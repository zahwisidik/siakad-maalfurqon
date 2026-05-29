import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Clock, Users, CalendarDays, MapPin, CheckCircle, LogOut, AlertCircle, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatTimeDisplay } from '../../utils/time';
import toast from 'react-hot-toast';


const API_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY || '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

export default function DashboardPengajar() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ matakuliah: 0, kelas: 0, sks: 0 });
  const [todayJadwal, setTodayJadwal] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [attendance, setAttendance] = useState<{
    waktu_datang: string | null;
    waktu_pulang: string | null;
  }>({ waktu_datang: null, waktu_pulang: null });

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
      const today = new Date().toLocaleDateString('en-CA');
      const res = await api.get('getAbsensiPengajar');
      const myAbs = res.data.find((a: any) => a.pengajar_id === user.id && a.tanggal === today);
      if (myAbs) {
        setAttendance({
          waktu_datang: myAbs.waktu_datang || null,
          waktu_pulang: myAbs.waktu_pulang || null,
        });
      }
    } catch (e) {
      console.error(e);
    }
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

    const now = new Date();
    const today = now.toLocaleDateString('en-CA');
    const time = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    
    const newState = { ...attendance, waktu_datang: time };
    setAttendance(newState);
    
    try {
       await api.post('saveAbsensiPengajar', {
         pengajar_id: user?.id,
         tanggal: today,
         waktu_datang: time,
         waktu_pulang: newState.waktu_pulang,
         lokasi_datang: datangData.lokasi,
         alasan_terlambat: datangData.alasan_terlambat
       });
       toast.success('Berhasil Absen Datang', { id: 'submit_presensi' });
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
    
    if (!navigator.geolocation) {
      toast.error('Geolocation tidak didukung oleh browser anda.');
      return;
    }

    toast.loading('Memverifikasi lokasi...', { id: 'loc_check' });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        toast.dismiss('loc_check');
        setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        toast.success('Lokasi berhasil dipetakan.');
        setShowModalDatang(true);
        setDatangData({ lokasi: '', alasan_terlambat: '' });
        const now = new Date();
        // Assuming work starts around 08:00
        if (now.getHours() >= 8 && (now.getHours() > 8 || now.getMinutes() > 0)) {
          setShowWarningAlasanDatang(true);
        } else {
          setShowWarningAlasanDatang(false);
        }
      },
      (err) => {
        toast.dismiss('loc_check');
        toast.error('Gagal mendapatkan lokasi. Pastikan izin akses lokasi diberikan.');
      }
    );
  };

  const handleClockOutClick = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation tidak didukung oleh browser anda.');
      return;
    }

    toast.loading('Memverifikasi lokasi...', { id: 'loc_check_pulang' });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        toast.dismiss('loc_check_pulang');
        setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setShowModalPulang(true);
        setPulangData({ lokasi: '', alasan: '' });
        const now = new Date();
        // Assumption: regular work hours end around 15:00
        if (now.getHours() < 15) {
          setShowWarningAlasan(true);
        } else {
          setShowWarningAlasan(false);
        }
      },
      (err) => {
        toast.dismiss('loc_check_pulang');
        toast.error('Gagal mendapatkan lokasi. Pastikan izin akses lokasi diberikan.');
      }
    );
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

    const now = new Date();
    const today = now.toLocaleDateString('en-CA');
    const time = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    
    const newState = { ...attendance, waktu_pulang: time };
    setAttendance(newState);
    
    try {
       await api.post('saveAbsensiPengajar', {
         pengajar_id: user.id,
         tanggal: today,
         waktu_datang: newState.waktu_datang,
         waktu_pulang: time,
         lokasi_pulang: pulangData.lokasi,
         alasan_pulang_awal: pulangData.alasan
       });
       toast.success('Berhasil Absen Pulang', { id: 'submit_presensi' });
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
      const [jd, mk] = await Promise.all([
        api.get('getJadwal'),
        api.get('getMatakuliah')
      ]);

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

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      {/* HEADER ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Ahlan wa Sahlan, {user?.nama}</h2>
          <p className="text-slate-500 text-sm mt-1 mb-4">Berikut adalah ringkasan aktivitas mengajar Anda semester ini.</p>
        </div>

        {/* PRESENSI CARD */}
        <div className="bg-slate-900 p-6 sm:p-6 rounded-2xl shadow-lg border border-slate-800 flex flex-col text-white relative overflow-hidden">
          {/* subtle background decoration */}
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

          <h3 className="font-bold text-slate-100 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" /> 
            Presensi Hari Ini
          </h3>
          
          <div className="flex flex-col gap-3 flex-1 justify-center">
            {/* Datang */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${attendance.waktu_datang ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Datang</p>
                  <p className="text-sm font-bold text-white">{attendance.waktu_datang || '--:--'}</p>
                </div>
              </div>
              {!attendance.waktu_datang && (
                <button onClick={handleClockIn} className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-xs font-bold transition-colors">
                  Absen
                </button>
              )}
            </div>

            {/* Pulang */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${attendance.waktu_pulang ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-400'}`}>
                  <LogOut className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Pulang</p>
                  <p className="text-sm font-bold text-white">{attendance.waktu_pulang || '--:--'}</p>
                </div>
              </div>
              {attendance.waktu_datang && !attendance.waktu_pulang && (
                <button onClick={handleClockOutClick} className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-lg text-xs font-bold transition-colors">
                  Absen
                </button>
              )}
            </div>
          </div>
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
            {todayJadwal.length > 0 ? todayJadwal.map(j => (
              <div key={j.id} className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-emerald-50 transition-colors">
                <div>
                  <div className="text-xs font-bold text-emerald-600 mb-1">{formatTimeDisplay(j.jam_mulai)} - {formatTimeDisplay(j.jam_berakhir)}</div>
                  <h4 className="font-bold text-slate-800">{j.nama_mk}</h4>
                  <p className="text-sm text-slate-500 mt-1">{j.program} - {j.kelas}</p>
                </div>
                <Link 
                  to="/absensi-pengajar" 
                  state={{ autoOpenModal: true, mk: j.nama_mk, kelas: j.kelas, program: j.program }}
                  className="shrink-0 px-4 py-2 bg-white text-emerald-600 font-semibold text-sm rounded-lg border border-emerald-200 hover:bg-emerald-600 hover:text-white transition-colors"
                >
                  Isi Absensi
                </Link>
              </div>
            )) : (
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
                <p className="text-sm text-slate-700 font-medium mb-3">Silahkan konfirmasi lokasi gedung Anda saat ini.</p>
                <select 
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  value={datangData.lokasi}
                  onChange={(e) => setDatangData({ ...datangData, lokasi: e.target.value })}
                >
                  <option value="">-- Pilih Lokasi --</option>
                  <option value="Gedung Putra">Gedung Putra</option>
                  <option value="Gedung Putri">Gedung Putri</option>
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
                <p className="text-sm text-slate-700 font-medium mb-3">Apakah Anda sudah selesai bekerja? Silahkan konfirmasi lokasi Anda.</p>
                <select 
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  value={pulangData.lokasi}
                  onChange={(e) => setPulangData({ ...pulangData, lokasi: e.target.value })}
                >
                  <option value="">-- Pilih Lokasi --</option>
                  <option value="Gedung Putra">Gedung Putra</option>
                  <option value="Gedung Putri">Gedung Putri</option>
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
    </div>
  );
}
