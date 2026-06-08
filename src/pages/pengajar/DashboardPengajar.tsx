import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Clock, Users, CalendarDays, MapPin, CheckCircle, LogOut, AlertCircle, X, Settings, Play, Square, Coffee, Trash2, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatTimeDisplay, getWIBDate, getWIBTime, fetchRealWIBTime, getTodayIndonesianDate } from '../../utils/time';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';


const API_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY || '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

const getPropValue = (obj: any, propName: string): any => {
  if (!obj) return undefined;
  const target = propName.toLowerCase().trim();
  for (const key of Object.keys(obj)) {
    const keyCleaned = key.toLowerCase().trim().replace(/_/g, ' ');
    const targetCleaned = target.replace(/_/g, ' ');
    if (keyCleaned === targetCleaned) {
      return obj[key];
    }
  }
  return obj[propName];
};

const cleanCompare = (val1: any, val2: any) => {
  const s1 = val1 !== undefined && val1 !== null ? val1.toString().toLowerCase().trim() : '';
  const s2 = val2 !== undefined && val2 !== null ? val2.toString().toLowerCase().trim() : '';
  return s1 === s2;
};

const isSameDay = (dateVal1: any, dateVal2: any) => {
  if (!dateVal1 || !dateVal2) return false;
  
  const cleanStr = (val: any) => {
    if (typeof val !== 'string') val = String(val);
    const m = val.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (m) {
      const year = m[1];
      const month = m[2].padStart(2, '0');
      const day = m[3].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return val.substring(0, 10);
  };

  return cleanStr(dateVal1) === cleanStr(dateVal2);
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000; // Radius bumi dalam meter
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Jarak dalam meter
};

export default function DashboardPengajar() {
  const { user } = useAuth();
  const [locationPresets, setLocationPresets] = useState<any[]>([
    { id: '1', nama: 'Gedung Putra', koordinat: '-7.5477347, 110.2333963', radius: 15 },
    { id: '2', nama: 'Gedung Putri', koordinat: '-7.5474789, 110.2304279', radius: 15 }
  ]);
  const [stats, setStats] = useState({ matakuliah: 0, kelas: 0, sks: 0 });
  const [todayJadwal, setTodayJadwal] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [absensiList, setAbsensiList] = useState<any[]>([]);
  
  const [attendance, setAttendance] = useState<{
    waktu_datang: string | null;
    waktu_pulang: string | null;
  }>({ waktu_datang: null, waktu_pulang: null });

  const [sessions, setSessions] = useState<any[]>([]);
  const [allTeacherAttendance, setAllTeacherAttendance] = useState<any[]>([]);
  
  // Custom work schedule configuration: Tetap vs Fleksibel
  const [scheduleConfig, setScheduleConfig] = useState<{
    type: 'tetap' | 'fleksibel';
    fixed: { [key: string]: { enabled: boolean; from: string; to: string } };
  }>(() => {
    try {
      const key = `teacher_schedule_${user?.id || 'default'}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {}
    return {
      type: 'tetap',
      fixed: {
        'Senin': { enabled: true, from: '07:30', to: '14:30' },
        'Selasa': { enabled: true, from: '07:30', to: '14:30' },
        'Rabu': { enabled: true, from: '07:30', to: '14:30' },
        'Kamis': { enabled: true, from: '07:30', to: '14:30' },
        'Jumat': { enabled: true, from: '07:30', to: '14:30' },
        'Sabtu': { enabled: true, from: '07:30', to: '12:30' },
        'Minggu': { enabled: false, from: '07:30', to: '14:30' },
      }
    };
  });

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [tempSchedule, setTempSchedule] = useState<any>(null);
  const [ticker, setTicker] = useState(0);

  // Trigger ticker update for real-time live clock-in tracker
  useEffect(() => {
    const interval = setInterval(() => {
      setTicker(t => t + 1);
    }, 10000); 
    return () => clearInterval(interval);
  }, []);

  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);

  const [showModalPulang, setShowModalPulang] = useState(false);
  const [pulangData, setPulangData] = useState({ lokasi: '', alasan: '' });
  const [showWarningAlasan, setShowWarningAlasan] = useState(false);

  const [showModalDatang, setShowModalDatang] = useState(false);
  const [datangData, setDatangData] = useState({ lokasi: '', alasan_terlambat: '' });
  const [showWarningAlasanDatang, setShowWarningAlasanDatang] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
    checkAttendance();
  }, [user]);

  const checkAttendance = async () => {
    if (!user?.id) return;
    try {
      const today = getWIBDate(); 
      const res = await api.get('getAbsensiPengajar');
      
      const myAllAbs = (res.data || []).filter((a: any) => a.pengajar_id === user.id);
      setAllTeacherAttendance(myAllAbs);

      const myAbs = res.data.find((a: any) => {
        if (a.pengajar_id !== user.id) return false;
        if (!a.tanggal) return false;
        
        const apiTanggal = String(a.tanggal);
        if (apiTanggal === today || apiTanggal === getTodayIndonesianDate() || apiTanggal.startsWith(today)) return true;
        
        try {
          const d = new Date(apiTanggal);
          if (!isNaN(d.getTime())) {
             const formatted = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
             if (formatted === today) return true;
          }
        } catch(err) {}

        return false;
      });
      if (myAbs) {
        let loadedSessions = [];
        if (myAbs.multi_sessions) {
          try {
            loadedSessions = typeof myAbs.multi_sessions === 'string' ? JSON.parse(myAbs.multi_sessions) : myAbs.multi_sessions;
          } catch(err) {
            console.error(err);
          }
        }
        
        if (!loadedSessions || loadedSessions.length === 0) {
          if (myAbs.waktu_datang) {
            loadedSessions = [{
              in: formatTimeDisplay(myAbs.waktu_datang),
              out: myAbs.waktu_pulang ? formatTimeDisplay(myAbs.waktu_pulang) : null,
              lokasi_datang: myAbs.lokasi_datang || 'Gedung Putra',
              lokasi_pulang: myAbs.lokasi_pulang || 'Gedung Putra',
              alasan_terlambat: myAbs.alasan_terlambat || '',
              alasan_pulang_awal: myAbs.alasan_pulang_awal || ''
            }];
          }
        }
        setSessions(loadedSessions);
        setAttendance({
          waktu_datang: myAbs.waktu_datang ? formatTimeDisplay(myAbs.waktu_datang) : null,
          waktu_pulang: myAbs.waktu_pulang ? formatTimeDisplay(myAbs.waktu_pulang) : null,
        });
      } else {
        setSessions([]);
        setAttendance({ waktu_datang: null, waktu_pulang: null });
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  const getDurationMinutes = (timeIn: string, timeOut: string) => {
    const [h1, m1] = timeIn.split(':').map(Number);
    const [h2, m2] = timeOut.split(':').map(Number);
    return Math.max(0, (h2 * 60 + m2) - (h1 * 60 + m1));
  };

  const formatMinutesToText = (totalMinutes: number) => {
    if (totalMinutes <= 0) return '0 menit';
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours > 0) {
      return `${hours} jam ${mins} menit`;
    }
    return `${mins} menit`;
  };

  const calculateTotalWorkedToday = () => {
    let totalMins = 0;
    for (const s of sessions) {
      if (s.in && s.out) {
        totalMins += getDurationMinutes(s.in, s.out);
      } else if (s.in && !s.out) {
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const wib = new Date(utc + (3600000 * 7));
        const currentHours = String(wib.getHours()).padStart(2, '0');
        const currentMins = String(wib.getMinutes()).padStart(2, '0');
        const currentWIBStr = `${currentHours}:${currentMins}`;
        if (currentWIBStr > s.in) {
          totalMins += getDurationMinutes(s.in, currentWIBStr);
        }
      }
    }
    return totalMins;
  };

  const getDayAttendanceInfo = (dateStr: string) => {
    const record = allTeacherAttendance.find((a: any) => {
      if (!a.tanggal) return false;
      const apiTgl = String(a.tanggal);
      if (apiTgl === dateStr || apiTgl.startsWith(dateStr)) return true;
      try {
        const d = new Date(apiTgl);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }) === dateStr;
        }
      } catch (e) {}
      return false;
    });

    if (!record) return null;

    let daySessions = [];
    if (record.multi_sessions) {
      try {
        daySessions = typeof record.multi_sessions === 'string' ? JSON.parse(record.multi_sessions) : record.multi_sessions;
      } catch (e) {}
    }
    
    if (daySessions.length === 0 && record.waktu_datang) {
      daySessions = [{
        in: formatTimeDisplay(record.waktu_datang),
        out: record.waktu_pulang ? formatTimeDisplay(record.waktu_pulang) : null,
      }];
    }

    let totalMinutes = 0;
    for (const s of daySessions) {
      if (s.in && s.out) {
        totalMinutes += getDurationMinutes(s.in, s.out);
      }
    }

    return {
      record,
      sessions: daySessions,
      totalMinutes,
      clockIn: record.waktu_datang ? formatTimeDisplay(record.waktu_datang) : null,
      clockOut: record.waktu_pulang ? formatTimeDisplay(record.waktu_pulang) : null,
    };
  };

  const getPast7DaysInfo = () => {
    const days = [];
    const idDaysAbbr = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const wibNow = new Date(utc + (3600000 * 7));
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(wibNow.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }); // YYYY-MM-DD
      const dayLabel = idDaysAbbr[d.getDay()].substring(0, 3);
      const dayNameFull = idDaysAbbr[d.getDay()];
      const day = d.getDate();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const dateLabel = `${day} ${monthNames[d.getMonth()]}`;
      
      const dayInfo = getDayAttendanceInfo(dateStr);
      days.push({
        dateStr,
        dayLabel,
        dayNameFull,
        dateLabel,
        info: dayInfo,
      });
    }
    return days;
  };

  const handleOpenScheduleModal = () => {
    setTempSchedule(JSON.parse(JSON.stringify(scheduleConfig)));
    setShowScheduleModal(true);
  };

  const handleSaveScheduleConfig = () => {
    if (!tempSchedule) return;
    setScheduleConfig(tempSchedule);
    try {
      localStorage.setItem(`teacher_schedule_${user?.id || 'default'}`, JSON.stringify(tempSchedule));
      toast.success('Jadwal kerja berhasil disesuaikan.');
    } catch (e) {}
    setShowScheduleModal(false);
  };

  const promptLocationAndVerify = async (onSuccess: (lokasi: string) => void) => {
    if (!navigator.geolocation) {
       toast.error('Geolocation tidak didukung oleh browser anda.');
       return;
    }

    if (locationPresets.length === 0) {
       onSuccess('');
       return;
    }

    const inputOptions: Record<string, string> = {};
    locationPresets.forEach(p => {
      inputOptions[p.nama] = p.nama;
    });

    const { value: selectedLocationName } = await Swal.fire({
      title: 'Pilih Lokasi Presensi',
      text: 'Di area gedung mana Anda berada saat ini?',
      input: 'radio',
      inputOptions: inputOptions,
      showCancelButton: true,
      confirmButtonText: 'Lanjut',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#059669',
      inputValidator: (value) => {
        if (!value) {
          return 'Anda harus memilih lokasi dahulu';
        }
      }
    });

    if (!selectedLocationName) return;

    toast.loading('Memverifikasi lokasi presensi...', { id: 'loc_verify' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        toast.dismiss('loc_verify');
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCurrentLocation({ lat, lng });

        const selectedPreset = locationPresets.find(p => p.nama === selectedLocationName);
        if (selectedPreset) {
          const parts = String(selectedPreset.koordinat).split(',');
          if (parts.length >= 2) {
            const pLat = parseFloat(parts[0].trim());
            const pLng = parseFloat(parts[1].trim());
            const distance = calculateDistance(lat, lng, pLat, pLng);
            const allowedRadius = parseFloat(selectedPreset.radius) || 15;
            
            if (distance <= allowedRadius) {
              onSuccess(selectedLocationName as string);
            } else {
              Swal.fire({
                 icon: 'error',
                 title: 'Area Tidak Terjangkau',
                 html: `<div class="text-left text-sm space-y-3 mt-2">
                          <p>Jarak Anda saat ini <b>${distance.toFixed(1)} meter</b> dari titik pusat <b>${selectedPreset.nama}</b> (<span class="font-mono text-xs">${selectedPreset.koordinat}</span>).</p>
                          <p>Batas radius presensi maksimal yang diizinkan adalah <b>${allowedRadius} meter</b>.</p>
                          <p class="text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200 mt-2"><b>Solusi:</b> Silakan berjalan lebih dekat ke arah gedung lalu coba lakukan presensi kembali.</p>
                        </div>`,
                 confirmButtonColor: '#059669',
                 confirmButtonText: 'Tutup'
              });
            }
          } else {
             onSuccess(selectedLocationName as string); // fallback
          }
        } else {
           onSuccess(selectedLocationName as string); // fallback
        }
      },
      (err) => {
        toast.dismiss('loc_verify');
        console.error(err);
        toast.error('Gagal mendapatkan lokasi. Pastikan izin lokasi (GPS) pada browser/perangkat Anda diaktifkan.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const submitClockIn = async () => {
    if (!user?.id) return;
    if (!datangData.lokasi) {
      toast.error('Pilih lokasi anda');
      return;
    }

    if (showWarningAlasanDatang && !datangData.alasan_terlambat.trim()) {
      toast.error('Sila isi alasan keterlambatan anda');
      return;
    }
    if (isSubmitting) return;

    setIsSubmitting(true);
    toast.loading('Menyimpan presensi...', { id: 'submit_presensi' });

    let realNow: Date;
    try {
      realNow = await fetchRealWIBTime();
    } catch (e: any) {
      setIsSubmitting(false);
      toast.error('Gagal mengambil waktu dari server. Buka di Tab Baru atau matikan pemblokir iklan.', { id: 'submit_presensi' });
      return;
    }

    const today = getWIBDate(realNow);
    const time = getWIBTime(realNow);
    
    const newSession = {
      in: time,
      out: null,
      lokasi_datang: datangData.lokasi,
      alasan_terlambat: datangData.alasan_terlambat || ''
    };
    
    const updatedSessions = [...sessions, newSession];
    setSessions(updatedSessions);
    
    const finalWaktuDatang = attendance.waktu_datang || time;
    const newState = { ...attendance, waktu_datang: finalWaktuDatang };
    setAttendance(newState);
    
    try {
       await api.post('saveAbsensiPengajar', {
         pengajar_id: user?.id,
         tanggal: today,
         waktu_datang: finalWaktuDatang,
         waktu_pulang: attendance.waktu_pulang,
         lokasi_datang: datangData.lokasi,
         alasan_terlambat: datangData.alasan_terlambat,
         multi_sessions: JSON.stringify(updatedSessions)
       });
       toast.success('Berhasil Mulai Sesi Kerja', { id: 'submit_presensi' });
       checkAttendance();
    } catch (e) {
       console.error(e);
       toast.error('Absen tersimpan lokal. Gagal sinkronisasi ke server.', { id: 'submit_presensi' });
    } finally {
       setIsSubmitting(false);
       setShowModalDatang(false);
    }
  };

  const handleClockIn = async () => {
    if (!user?.id) return;
    
    // For Fixed schedule, restrict clock-in once check-out has been completed today
    if (scheduleConfig.type === 'tetap' && (attendance.waktu_pulang || (sessions.length > 0 && sessions.some(s => s.in && s.out)))) {
      toast.error('Untuk skema rutin, Anda hanya diperkenankan melakukan absensi 1 kali dalam sehari.');
      return;
    }
    
    promptLocationAndVerify((lokasi: string) => {
      setShowModalDatang(true);
      setDatangData({ lokasi, alasan_terlambat: '' });
        
      fetchRealWIBTime().then((realNow) => {
        const wibTime = getWIBTime(realNow);
        
        if (scheduleConfig.type === 'tetap') {
          const daysMap = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
          const todayName = daysMap[realNow.getDay()];
          const todaySetting = scheduleConfig.fixed[todayName];
          
          if (todaySetting && todaySetting.enabled) {
            if (wibTime > todaySetting.from && sessions.length === 0) {
              setShowWarningAlasanDatang(true);
            } else {
              setShowWarningAlasanDatang(false);
            }
          } else {
            setShowWarningAlasanDatang(false);
          }
        } else {
          setShowWarningAlasanDatang(false);
        }
      }).catch((e: any) => {
        setShowModalDatang(false);
        toast.error('Gagal mengambil waktu dari server. Buka di Tab Baru atau matikan pemblokir iklan.');
      });
    });
  };

  const handleClockOutClick = () => {
    promptLocationAndVerify((lokasi: string) => {
      setShowModalPulang(true);
      setPulangData({ lokasi, alasan: '' });
        
      fetchRealWIBTime().then((realNow) => {
        const wibTime = getWIBTime(realNow);
        
        if (scheduleConfig.type === 'tetap') {
          const daysMap = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
          const todayName = daysMap[realNow.getDay()];
          const todaySetting = scheduleConfig.fixed[todayName];
          
          if (todaySetting && todaySetting.enabled) {
            if (wibTime < todaySetting.to) {
              setShowWarningAlasan(true);
            } else {
              setShowWarningAlasan(false);
            }
          } else {
            setShowWarningAlasan(false);
          }
        } else {
          setShowWarningAlasan(false);
        }
      }).catch((e: any) => {
        setShowModalPulang(false);
        toast.error('Gagal mengambil waktu dari server. Buka di Tab Baru atau matikan pemblokir iklan.');
      });
    });
  };

  const submitClockOut = async () => {
    if (!user?.id) return;
    if (!pulangData.lokasi) {
      toast.error('Pilih lokasi anda');
      return;
    }

    if (showWarningAlasan && !pulangData.alasan.trim()) {
      toast.error('Sila isi alasan anda');
      return;
    }
    if (isSubmitting) return;

    setIsSubmitting(true);
    toast.loading('Menyimpan presensi...', { id: 'submit_presensi' });

    let realNow: Date;
    try {
      realNow = await fetchRealWIBTime();
    } catch (e: any) {
      setIsSubmitting(false);
      toast.error('Gagal mengambil waktu dari server. Buka di Tab Baru atau matikan pemblokir iklan.', { id: 'submit_presensi' });
      return;
    }

    const today = getWIBDate(realNow);
    const time = getWIBTime(realNow);
    
    const updatedSessions = sessions.map((s, idx) => {
      if (idx === sessions.length - 1 && s.out === null) {
        return {
          ...s,
          out: time,
          lokasi_pulang: pulangData.lokasi,
          alasan_pulang_awal: pulangData.alasan || ''
        };
      }
      return s;
    });
    setSessions(updatedSessions);
    
    const finalWaktuPulang = time;
    const newState = { ...attendance, waktu_pulang: finalWaktuPulang };
    setAttendance(newState);
    
    try {
       await api.post('saveAbsensiPengajar', {
         pengajar_id: user.id,
         tanggal: today,
         waktu_datang: attendance.waktu_datang || (sessions[0]?.in || time),
         waktu_pulang: finalWaktuPulang,
         lokasi_pulang: pulangData.lokasi,
         alasan_pulang_awal: pulangData.alasan,
         multi_sessions: JSON.stringify(updatedSessions)
       });
       toast.success('Berhasil Akhiri Sesi Kerja', { id: 'submit_presensi' });
       checkAttendance();
    } catch (e) {
       console.error(e);
       toast.error('Absen tersimpan lokal. Gagal sinkronisasi ke server.', { id: 'submit_presensi' });
    } finally {
       setIsSubmitting(false);
       setShowModalPulang(false);
    }
  };

  const fetchData = async () => {
    if (!user?.nama) return;
    try {
      const [jd, mk, abs, locs] = await Promise.all([
        api.get('getJadwal'),
        api.get('getMatakuliah'),
        api.get('getAbsensi').catch(() => ({ data: [] })),
        api.get('getLokasiPreset').catch(() => ({ data: [] }))
      ]);

      setAbsensiList(abs.data || []);
      if (locs?.data && Array.isArray(locs.data) && locs.data.length > 0) {
        setLocationPresets(locs.data);
      }

      const myMk = (mk.data || []).filter((m: any) => {
        const mp = String(m.pengajar || '').trim().toLowerCase();
        const un = String(user.nama || '').trim().toLowerCase();
        return mp === un && mp !== '';
      });
      const myJadwal = (jd.data || []).filter((j: any) => {
        const jp = String(j.pengajar || '').trim().toLowerCase();
        const un = String(user.nama || '').trim().toLowerCase();
        return jp === un && jp !== '';
      });

      const uniqueKelas = new Set(myMk.map((m: any) => m.kelas));
      
      const totalSks = myMk.reduce((acc: number, curr: any) => acc + (parseFloat(curr.sks) || 0), 0);
      
      setStats({
        matakuliah: new Set(myMk.map((m: any) => m.nama_mk)).size,
        kelas: uniqueKelas.size,
        sks: totalSks
      });

      const daysMap = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const todayName = daysMap[new Date().getDay()];
      
      const todayJdwl = myJadwal
        .filter((j: any) => String(j.hari || '').trim().toLowerCase() === todayName.toLowerCase())
        .sort((a: any, b: any) => String(a.jam_mulai || '').localeCompare(String(b.jam_mulai || '')));
        
      setTodayJadwal(todayJdwl);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const lastSession = sessions.length > 0 ? sessions[sessions.length - 1] : null;
  const isWorking = !!(lastSession && lastSession.out === null);

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      {/* HEADER ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Ahlan wa Sahlan, {user?.nama}</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              Melalui sistem ini, Ustadz/Ustadzah dapat memantau jadwal mengajar harian, mengelola nilai mahasantri, mengelola absensi perkuliahan, serta mencatat kehadiran kerja harian secara mandiri.
            </p>
          </div>
          
          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-1">Skema Jam Kerja</p>
                <p className="text-sm font-bold text-slate-700 capitalize">
                  Jadwal {scheduleConfig.type} 
                  {scheduleConfig.type === 'tetap' && (() => {
                    const daysMap = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                    const todayName = daysMap[new Date().getDay()];
                    const todaySetting = scheduleConfig.fixed[todayName];
                    return todaySetting && todaySetting.enabled 
                      ? ` (${todaySetting.from} - ${todaySetting.to})`
                      : ' (Hari Libur)';
                  })()}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleOpenScheduleModal}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors font-bold text-xs rounded-xl border border-emerald-100 cursor-pointer"
            >
              <Settings className="w-4 h-4" />
              Sesuaikan Jam Kerja
            </button>
          </div>
        </div>

        {/* PRESENSI CARD WITH MULTI-SESSIONS */}
        <div className="bg-slate-900 p-6 sm:p-6 rounded-2xl shadow-lg border border-slate-800 flex flex-col text-white relative overflow-hidden justify-between min-h-[240px]">
          {/* subtle background decoration */}
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-100 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" /> 
                Presensi Hari Ini
              </h3>
              <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                isWorking ? 'bg-emerald-500/20 text-emerald-400 animate-pulse border border-emerald-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                {isWorking ? '● Aktif Bekerja' : '○ Standby'}
              </span>
            </div>
            <p className="text-xs text-slate-400 pl-7">{getTodayIndonesianDate()}</p>
          </div>
          
          <div className="flex flex-col gap-3 mt-4">
            {/* Active action button */}
            {isWorking ? (
              <button 
                onClick={handleClockOutClick} 
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/10"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                Akhiri Sesi Kerja (Clock Out)
              </button>
            ) : scheduleConfig.type === 'tetap' && (attendance.waktu_pulang || (sessions.length > 0 && sessions.some(s => s.in && s.out))) ? (
              <div 
                className="w-full py-2.5 bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-inner"
              >
                <Check className="w-4 h-4 text-emerald-400 animate-bounce" />
                Presensi Rutin Hari Ini Selesai
              </div>
            ) : (
              <button 
                onClick={handleClockIn} 
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Mulai Sesi Kerja (Clock In)
              </button>
            )}

            {/* Live Worked Hours Accumulator */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 flex items-center justify-between">
              <div>
                <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Total Waktu Bekerja</p>
                <p className="text-sm font-extrabold text-emerald-400">{formatMinutesToText(calculateTotalWorkedToday())}</p>
              </div>
              <Coffee className="w-4 h-4 text-slate-500" />
            </div>

            {/* Session list */}
            {sessions.length > 0 && (
              <div className="space-y-1 bg-white/5 p-2 rounded-xl border border-white/5">
                <p className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Daftar Sesi Kerja:</p>
                <div className="max-h-[85px] overflow-y-auto space-y-1 text-[11px] pr-1 scrollbar-thin scrollbar-thumb-white/10">
                  {sessions.map((s: any, idx: number) => {
                    const durationText = s.out ? formatMinutesToText(getDurationMinutes(s.in, s.out)) : 'Berjalan...';
                    return (
                      <div key={idx} className="flex justify-between items-center text-slate-300 py-0.5 border-b border-white/5 last:border-0 font-mono">
                        <span>
                          {s.in} - {s.out || '...'}
                        </span>
                        <span className={`font-semibold ${s.out ? 'text-slate-400' : 'text-emerald-400 animate-pulse'}`}>
                          {durationText}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* REKAP ABSENSI BEKERJA 1 PEKAN (DEDICATED PANEL) */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <CalendarDays className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
              Rekap Presensi Kerja 7 Hari Terakhir
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Riwayat check-in/out mandiri dan total durasi kerja harian Anda.</p>
          </div>
          <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100/60 px-2.5 py-1 rounded-full font-mono font-extrabold shrink-0">
            {getPast7DaysInfo()[0].dateLabel} - {getPast7DaysInfo()[6].dateLabel}
          </span>
        </div>
        
        <div className="overflow-x-auto border border-slate-200/60 rounded-xl bg-white shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200/60 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="px-3 py-2.5 font-bold">Hari & Tanggal</th>
                <th className="px-3 py-2.5 font-bold">Skema & Status</th>
                <th className="px-3 py-2.5 font-bold">Waktu Masuk & Pulang</th>
                <th className="px-3 py-2.5 font-bold text-right">Total Kerja</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150/80 text-xs text-slate-650">
              {[...getPast7DaysInfo()].reverse().map((dayObj: any) => {
                const hasAttended = !!dayObj.info;
                const isToday = dayObj.dateStr === getWIBDate();
                const scheduleForToday = scheduleConfig.type === 'tetap' ? scheduleConfig.fixed[dayObj.dayNameFull] : null;
                const isScheduledWorkday = scheduleConfig.type === 'fleksibel' || (scheduleForToday && scheduleForToday.enabled);
                
                let statusBadge = null;
                if (hasAttended) {
                  const allSessionsFinished = dayObj.info.sessions.every((s: any) => s.out !== null);
                  statusBadge = (
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold ${
                      allSessionsFinished 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' 
                        : 'bg-amber-50 text-amber-700 border border-amber-150 animate-pulse'
                    }`}>
                      <span className={`w-1 h-1 rounded-full ${allSessionsFinished ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      {allSessionsFinished ? 'Hadir Selesai' : 'Sedang Aktif'}
                    </span>
                  );
                } else if (isToday) {
                  statusBadge = (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                      Belum Presensi
                    </span>
                  );
                } else if (isScheduledWorkday) {
                  statusBadge = (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-100">
                      Absen / Alpa
                    </span>
                  );
                } else {
                  statusBadge = (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100/60 text-slate-400 border border-slate-200/30">
                      Hari Libur
                    </span>
                  );
                }

                return (
                  <tr 
                    key={dayObj.dateStr}
                    className={`${
                      isToday 
                        ? 'bg-emerald-50/20 font-medium' 
                        : ''
                    } hover:bg-slate-50/40 transition-colors`}
                  >
                    <td className="px-3 py-2">
                      <div className="flex flex-col">
                        <span className={`font-bold text-slate-700 flex items-center gap-1 ${isToday ? 'text-emerald-950 font-black' : ''}`}>
                          {dayObj.dayNameFull}
                          {isToday && (
                            <span className="text-[8px] bg-emerald-500 text-white px-1 py-0.2 rounded font-extrabold uppercase scale-90">Hari Ini</span>
                          )}
                        </span>
                        <span className="text-[10px] text-slate-450 font-mono font-medium mt-0.5">{dayObj.dateLabel}</span>
                      </div>
                    </td>

                    <td className="px-3 py-2">
                      <div className="flex flex-col gap-0.5 items-start">
                        <span className="text-[8px] font-extrabold tracking-wider uppercase text-slate-400 font-mono">
                          {scheduleConfig.type}
                        </span>
                        {statusBadge}
                      </div>
                    </td>

                    <td className="px-3 py-2">
                      {hasAttended ? (
                        <div className="flex flex-col gap-1 max-w-[280px]">
                          {scheduleConfig.type === 'tetap' ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-slate-700 bg-slate-100 border border-slate-200/40 px-1.5 py-0.5 rounded text-[10px]">
                                {dayObj.info.clockIn || '--:--'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold font-mono">s/d</span>
                              <span className="font-mono font-bold text-slate-700 bg-slate-100 border border-slate-200/40 px-1.5 py-0.5 rounded text-[10px]">
                                {dayObj.info.clockOut || '--:--'}
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {dayObj.info.sessions.map((s: any, sIdx: number) => (
                                <div 
                                  key={sIdx} 
                                  className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200/80 px-1.5 py-0.5 rounded text-[9.5px] font-medium"
                                >
                                  <span className="text-slate-400 font-mono font-extrabold">S{sIdx+1}:</span>
                                  <span className="font-mono font-bold text-slate-700">
                                    {s.in} - {s.out || 'Aktif'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          {isScheduledWorkday ? 'Belum ada kontribusi hari ini' : 'Libur'}
                        </span>
                      )}
                    </td>

                    <td className="px-3 py-2 text-right">
                      {hasAttended ? (
                        <div className="flex flex-col items-end">
                          <span className={`font-mono text-xs font-black ${dayObj.info.clockOut ? 'text-emerald-600' : 'text-amber-500 animate-pulse'}`}>
                            {dayObj.info.clockOut ? (
                              formatMinutesToText(dayObj.info.totalMinutes)
                            ) : (
                              'Berjalan'
                            )}
                          </span>
                          {dayObj.info.totalMinutes > 0 && (
                            <span className="text-[9px] text-slate-400 font-semibold font-mono">
                              ({Math.round((dayObj.info.totalMinutes / 60) * 10) / 10} jam)
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300 font-mono">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Mata Kuliah</p>
            <p className="text-2xl font-bold text-slate-700">{stats.matakuliah}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Kelas Diampu</p>
            <p className="text-2xl font-bold text-slate-700">{stats.kelas}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total SKS</p>
            <p className="text-2xl font-bold text-slate-700">{stats.sks}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-slate-400" />
                Jadwal Mengajar Hari Ini
              </h3>
              <p className="text-sm text-slate-500 mt-1 pl-7">
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <Link to="/jadwal-pengajar" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">Lihat Semua</Link>
          </div>
          
          <div className="space-y-4">
            {todayJadwal.length > 0 ? todayJadwal.map(j => {
              const isAlreadyAttended = absensiList.some(abs => {
                const absProg = getPropValue(abs, 'program');
                const absKls = getPropValue(abs, 'kelas');
                const absMk = getPropValue(abs, 'nama_mk');
                const absTgl = getPropValue(abs, 'tanggal');

                return (
                  cleanCompare(absProg, j.program) &&
                  cleanCompare(absKls, j.kelas) &&
                  cleanCompare(absMk, j.nama_mk) &&
                  isSameDay(absTgl, getWIBDate())
                );
              });

              return (
                <div key={j.id} className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-emerald-50 transition-colors">
                  <div>
                    <div className="text-xs font-bold text-emerald-600 mb-1">{formatTimeDisplay(j.jam_mulai)} - {formatTimeDisplay(j.jam_berakhir)}</div>
                    <h4 className="font-bold text-slate-800">{j.nama_mk}</h4>
                    <p className="text-sm text-slate-500 mt-1">{j.program} - {j.kelas}</p>
                  </div>
                  {isAlreadyAttended ? (
                    <div className="shrink-0 px-4 py-2 bg-emerald-50 text-emerald-700 font-bold text-sm rounded-lg border border-emerald-200 flex items-center gap-1.5 shadow-sm">
                      <CheckCircle className="w-4 h-4 text-emerald-600" /> Telah Diabsen
                    </div>
                  ) : (
                    <Link 
                      to="/absensi-pengajar" 
                      state={{ autoOpenModal: true, mk: j.nama_mk, kelas: j.kelas, program: j.program }}
                      className="shrink-0 px-4 py-2 bg-white text-emerald-600 font-semibold text-sm rounded-lg border border-emerald-200 hover:bg-emerald-600 hover:text-white transition-colors"
                    >
                      Isi Absensi
                    </Link>
                  )}
                </div>
              );
            }) : (
              <div className="text-center py-8">
                <div className="mx-auto h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                  <Clock className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-slate-500 text-sm">Tidak ada jadwal mengajar untuk hari ini.</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 bg-slate-900 rounded-2xl p-6 text-white shadow-xl shadow-slate-900/20 flex flex-col justify-center items-center text-center">
          <BookOpen className="w-12 h-12 text-emerald-400 mb-4" />
          <h3 className="font-bold text-lg mb-2">Materi Perkuliahan</h3>
          <p className="text-sm text-slate-400 mb-6">Siapkan materi dan rencana pembelajaran (RPS) sebelum memulai perkuliahan.</p>
          <Link to="/matakuliah-pengajar" className="w-full py-2.5 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition-colors">
            Lihat Daftar Mata Kuliah
          </Link>
        </div>
      </div>

      {showModalDatang && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800">Absensi Datang</h3>
              <button onClick={() => setShowModalDatang(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
              <div className="rounded-xl overflow-hidden border border-slate-200">
                {hasValidKey && currentLocation ? (
                  <div className="w-full h-[200px]">
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      style={{ border: 0 }}
                      src={`https://www.google.com/maps/embed/v1/view?key=${API_KEY}&center=${currentLocation.lat},${currentLocation.lng}&zoom=17`}
                      allowFullScreen
                    ></iframe>
                  </div>
                ) : (
                  <div className="h-[200px] bg-slate-100 flex flex-col items-center justify-center text-center p-4">
                     <MapPin className="w-8 h-8 text-slate-400 mb-2" />
                     {currentLocation ? (
                       <p className="text-sm text-slate-600">Terverifikasi. Lokasi: {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}</p>
                     ) : (
                       <p className="text-sm text-slate-600">Mencari lokasi...</p>
                     )}
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm text-slate-700 font-medium mb-3">Lokasi presensi pilihan Anda:</p>
                <select 
                  className="w-full border border-slate-200 bg-slate-50 cursor-not-allowed rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  value={datangData.lokasi}
                  onChange={(e) => setDatangData({ ...datangData, lokasi: e.target.value })}
                  disabled
                >
                  <option value="">-- Pilih Lokasi --</option>
                  {locationPresets.map(p => (
                    <option key={p.id} value={p.nama}>{p.nama}</option>
                  ))}
                </select>
              </div>

              {showWarningAlasanDatang && (
                <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 space-y-3">
                   <div className="flex gap-3">
                     <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                     <p className="text-sm text-amber-800 italic">"Setiap muslim harus menyesuaikan diri dengan kesepakatan yang dia setujui. Kecuali kesepakatan yang mengharamkan yang halal atau menghalalkan yang haram." <br className="hidden sm:block"/> <span className="font-semibold text-amber-900">(HR. at-Thabrani dalam al-Mu'jam al-Kabir)</span></p>
                   </div>
                   
                   <div className="pt-2">
                     <label className="block text-sm font-semibold text-amber-900 mb-2">Anda datang melewati batas waktu, silahkan isi alasan keterlambatan Anda:</label>
                     <textarea 
                       className="w-full border border-amber-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                       rows={3}
                       placeholder="Alasan terlambat datang..."
                       value={datangData.alasan_terlambat}
                       onChange={(e) => setDatangData({ ...datangData, alasan_terlambat: e.target.value })}
                     ></textarea>
                   </div>
                </div>
              )}
            </div>
            
            <div className="p-4 sm:p-6 border-t border-slate-100 flex gap-3 justify-end bg-slate-50">
              <button 
                onClick={() => setShowModalDatang(false)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-semibold rounded-xl text-sm"
              >
                Batal
              </button>
              <button 
                onClick={submitClockIn}
                disabled={isSubmitting}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Presensi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModalPulang && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800">Absensi Pulang</h3>
              <button onClick={() => setShowModalPulang(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
              <div className="rounded-xl overflow-hidden border border-slate-200">
                {hasValidKey && currentLocation ? (
                  <div className="w-full h-[200px]">
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      style={{ border: 0 }}
                      src={`https://www.google.com/maps/embed/v1/view?key=${API_KEY}&center=${currentLocation.lat},${currentLocation.lng}&zoom=17`}
                      allowFullScreen
                    ></iframe>
                  </div>
                ) : (
                  <div className="h-[200px] bg-slate-100 flex flex-col items-center justify-center text-center p-4">
                     <MapPin className="w-8 h-8 text-slate-400 mb-2" />
                     {currentLocation ? (
                       <p className="text-sm text-slate-600">Terverifikasi. Lokasi: {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}</p>
                     ) : (
                       <p className="text-sm text-slate-600">Mencari lokasi...</p>
                     )}
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm text-slate-700 font-medium mb-3">Selesai bekerja. Lokasi checkout Anda:</p>
                <select 
                  className="w-full border border-slate-200 bg-slate-50 cursor-not-allowed rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  value={pulangData.lokasi}
                  onChange={(e) => setPulangData({ ...pulangData, lokasi: e.target.value })}
                  disabled
                >
                  <option value="">-- Pilih Lokasi --</option>
                  {locationPresets.map(p => (
                    <option key={p.id} value={p.nama}>{p.nama}</option>
                  ))}
                </select>
              </div>

              {showWarningAlasan && (
                <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 space-y-3">
                   <div className="flex gap-3">
                     <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                     <p className="text-sm text-amber-800 italic">"Rasulullah Melarang seseorang tidak melaksanakan kewajiban yang ada padanya atau menuntut apa yang bukan menjadi haknya." <br className="hidden sm:block"/> <span className="font-semibold text-amber-900">(Syarh An-Nawawi 'ala Muslim)</span></p>
                   </div>
                   
                   <div className="pt-2">
                     <label className="block text-sm font-semibold text-amber-900 mb-2">Anda selesai bekerja sebelum waktunya, silahkan isi alasan Anda:</label>
                     <textarea 
                       className="w-full border border-amber-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                       rows={3}
                       placeholder="Alasan pulang lebih awal..."
                       value={pulangData.alasan}
                       onChange={(e) => setPulangData({ ...pulangData, alasan: e.target.value })}
                     ></textarea>
                   </div>
                </div>
              )}
            </div>
            
            <div className="p-4 sm:p-6 border-t border-slate-100 flex gap-3 justify-end bg-slate-50">
              <button 
                onClick={() => setShowModalPulang(false)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-semibold rounded-xl text-sm"
              >
                Batal
              </button>
              <button 
                onClick={submitClockOut}
                disabled={isSubmitting}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Presensi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showScheduleModal && tempSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-slate-800">Atur Skema Jam Kerja Bapak/Ibu</h3>
                <p className="text-xs text-slate-400 mt-1">Konfigurasikan skema jam kerja tetap harian atau fleksibel mandiri.</p>
              </div>
              <button onClick={() => setShowScheduleModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
              {/* Type selector */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tipe Jam Kerja</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTempSchedule({ ...tempSchedule, type: 'tetap' })}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                      tempSchedule.type === 'tetap' 
                        ? 'border-emerald-500 bg-emerald-50/55 text-emerald-900' 
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span className="font-bold text-sm block">Tetap / Rutin</span>
                    <span className="text-[11px] text-slate-500 leading-normal">Mempunyai batas masuk & pulang mingguan yang tetap.</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempSchedule({ ...tempSchedule, type: 'fleksibel' })}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                      tempSchedule.type === 'fleksibel' 
                        ? 'border-emerald-500 bg-emerald-50/55 text-emerald-900' 
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span className="font-bold text-sm block">Fleksibel / Mandiri</span>
                    <span className="text-[11px] text-slate-500 leading-normal">Mendukung multi check-in, akumulasi jam kerja otomatis harian.</span>
                  </button>
                </div>
              </div>

              {/* If Fixed, show days configuration table */}
              {tempSchedule.type === 'tetap' && (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Konfigurasi Jam Operasional Harian</label>
                  
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                    {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map((day) => {
                      const daySetting = tempSchedule.fixed[day] || { enabled: false, from: '07:30', to: '14:30' };
                      return (
                        <div key={day} className="p-3 flex items-center justify-between gap-4 hover:bg-slate-50/30">
                          {/* Left: day toggle checkbox */}
                          <label className="flex items-center gap-3 cursor-pointer shrink-0">
                            <input
                              type="checkbox"
                              checked={daySetting.enabled}
                              onChange={(e) => {
                                const updatedFixed = { ...tempSchedule.fixed };
                                updatedFixed[day] = { ...daySetting, enabled: e.target.checked };
                                setTempSchedule({ ...tempSchedule, fixed: updatedFixed });
                              }}
                              className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                            />
                            <span className="text-sm font-semibold text-slate-700">{day}</span>
                          </label>

                          {/* Right: hours input (only shown if enabled) */}
                          {daySetting.enabled ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                maxLength={5}
                                value={daySetting.from}
                                placeholder="07:30"
                                onChange={(e) => {
                                  const updatedFixed = { ...tempSchedule.fixed };
                                  updatedFixed[day] = { ...daySetting, from: e.target.value };
                                  setTempSchedule({ ...tempSchedule, fixed: updatedFixed });
                                }}
                                className="w-16 text-center border border-slate-200 rounded-lg p-1.5 text-xs font-mono outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                              />
                              <span className="text-xs text-slate-400 font-mono">s/d</span>
                              <input
                                type="text"
                                maxLength={5}
                                value={daySetting.to}
                                placeholder="14:30"
                                onChange={(e) => {
                                  const updatedFixed = { ...tempSchedule.fixed };
                                  updatedFixed[day] = { ...daySetting, to: e.target.value };
                                  setTempSchedule({ ...tempSchedule, fixed: updatedFixed });
                                }}
                                className="w-16 text-center border border-slate-200 rounded-lg p-1.5 text-xs font-mono outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                              />
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic font-medium pr-2">Hari Libur</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {tempSchedule.type === 'fleksibel' && (
                <div className="p-4 bg-emerald-50/40 border border-emerald-100 rounded-xl flex gap-3 text-emerald-800">
                  <AlertCircle className="w-5 h-5 shrink-0 text-emerald-600" />
                  <div className="text-xs space-y-1">
                    <p className="font-bold">Skema Tanpa Batasan Jam Terikat</p>
                    <p className="leading-relaxed">Sistem tidak akan memicu denda absensi terlambat atau larangan check-out awal. Total waktu bekerjamu diakumulasikan sepanjang hari melalui sistem multi check-in/out.</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 sm:p-6 border-t border-slate-100 flex gap-3 justify-end bg-slate-50">
              <button 
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-semibold rounded-xl text-sm cursor-pointer"
              >
                Batal
              </button>
              <button 
                onClick={handleSaveScheduleConfig}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Simpan Konfigurasi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
