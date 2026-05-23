import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { format } from 'date-fns';
import { Calendar, BookOpen, Users, Edit, Check, X, Compass, Plus, ClipboardCheck, ArrowLeft, Clock } from 'lucide-react';
import { Mahasantri, Absensi, Matakuliah, Kelas, Jadwal } from '../../types';
import { PROGRAM_OPTIONS } from '../../constants';
import { formatTimeDisplay } from '../../utils/time';

const cleanCompare = (val1: any, val2: any) => {
  const s1 = val1 !== undefined && val1 !== null ? val1.toString().toLowerCase().trim() : '';
  const s2 = val2 !== undefined && val2 !== null ? val2.toString().toLowerCase().trim() : '';
  return s1 === s2;
};

const getPropValue = (obj: any, propName: string): any => {
  if (!obj) return undefined;
  const target = propName.toLowerCase().trim();
  for (const key of Object.keys(obj)) {
    if (key.toLowerCase().trim() === target) {
      return obj[key];
    }
  }
  return obj[propName];
};

export default function AbsensiPengajar() {
  const { user } = useAuth();
  
  // Dynamic Master Reference Lists
  const [mahasantri, setMahasantri] = useState<Mahasantri[]>([]);
  const [jadwalList, setJadwalList] = useState<Jadwal[]>([]);
  const [absensiData, setAbsensiData] = useState<Absensi[]>([]);
  const [matakuliahList, setMatakuliahList] = useState<Matakuliah[]>([]);
  const [classesList, setClassesList] = useState<Kelas[]>([]);

  // Page States
  const [loading, setLoading] = useState(false);
  const [isFetchingInitial, setIsFetchingInitial] = useState(true);
  const [hasQueried, setHasQueried] = useState(false);

  // Main Rekap Filters
  const [selectedProgram, setSelectedProgram] = useState<string>(PROGRAM_OPTIONS[0]);
  const [selectedMatkul, setSelectedMatkul] = useState<string>('');
  const [selectedKelas, setSelectedKelas] = useState<string>('');
  const [selectedBulan, setSelectedBulan] = useState<string>(
    new Date().toISOString().substring(0, 7) // YYYY-MM
  );

  // ADD NEW SESSION MODAL STATE
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalProgram, setModalProgram] = useState(PROGRAM_OPTIONS[0]);
  const [modalMatkul, setModalMatkul] = useState('');
  const [modalKelas, setModalKelas] = useState('');
  const [modalTanggal, setModalTanggal] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [modalJamKe, setModalJamKe] = useState('1');
  const [modalPembahasan, setModalPembahasan] = useState('');
  const [modalAbsensi, setModalAbsensi] = useState<Record<string, string>>({});
  const [savingNewSession, setSavingNewSession] = useState(false);

  // EDIT SESSION MODAL STATE
  const [editingSession, setEditingSession] = useState<{ date: string, jam: string } | null>(null);
  const [sessionFormData, setSessionFormData] = useState<{
    tanggal: string,
    jam_ke: string,
    pembahasan: string,
    absensi: Record<string, { id?: string, status: string }>
  }>({ tanggal: '', jam_ke: '', pembahasan: '', absensi: {} });
  const [isSavingSession, setIsSavingSession] = useState(false);

  // Load active students for main rekap
  const studentsInClass = mahasantri.filter(m => 
    (!selectedProgram || m.program === selectedProgram) &&
    (!selectedKelas || m.kelas === selectedKelas) &&
    m.status === 'aktif'
  );

  // Active dates inside this month matching selected filters
  const uniqueDates: string[] = Array.from(new Set(
    absensiData
      .filter(a => {
        const aTanggal = getPropValue(a, 'tanggal');
        return (
          aTanggal && 
          aTanggal.toString().startsWith(selectedBulan) &&
          cleanCompare(getPropValue(a, 'program'), selectedProgram) &&
          cleanCompare(getPropValue(a, 'kelas'), selectedKelas) &&
          (cleanCompare(selectedMatkul, '') || cleanCompare(getPropValue(a, 'nama_mk'), selectedMatkul))
        );
      })
      .map(a => getPropValue(a, 'tanggal') as string)
  )).sort() as string[];

  // Helpers to fetch and normalize
  useEffect(() => {
    fetchInitialData();
  }, [user]);

  const fetchInitialData = async () => {
    if (!user?.nama) return;
    try {
      const [resMhs, resJdwl, resMk, resKls] = await Promise.all([
        api.get('getMahasantri'),
        api.get('getJadwal'),
        api.get('getMatakuliah'),
        api.get('getKelas')
      ]);
      
      setMahasantri(resMhs.data || []);
      
      const myMk = (resMk.data || []).filter((m: any) => {
        const mp = String(m.pengajar || '').trim().toLowerCase();
        const un = String(user.nama || '').trim().toLowerCase();
        return mp === un && mp !== '';
      });
      const myJadwal = (resJdwl.data || []).filter((j: any) => {
        const jp = String(j.pengajar || '').trim().toLowerCase();
        const un = String(user.nama || '').trim().toLowerCase();
        return jp === un && jp !== '';
      });
      
      setJadwalList(myJadwal);
      setMatakuliahList(myMk);
      setClassesList(resKls.data || []);
      
      const defaultProgram = PROGRAM_OPTIONS[0];
      
      const uniqueKelasNames = new Set(myMk.filter(m => m.program === defaultProgram).map(m => m.kelas));
      
      const filteredMk = myMk.filter(m => m.program === defaultProgram);
      if (filteredMk.length > 0) setSelectedMatkul(filteredMk[0].nama_mk);
      
      const sortedKelas = Array.from(uniqueKelasNames);
      if (sortedKelas.length > 0) setSelectedKelas(sortedKelas[0]);
    } catch (err) {
      toast.error('Gagal mengambil data referensi');
    } finally {
      setIsFetchingInitial(false);
    }
  };

  // derived options for MAIN view based on program
  const mainAvailableMatkuls = Array.from(new Set(
    matakuliahList.filter(m => m.program === selectedProgram).map(m => m.nama_mk)
  ));
  
  const mainAvailableKelas = Array.from(new Set(
    matakuliahList.filter(m => (!selectedMatkul || m.nama_mk === selectedMatkul) && m.program === selectedProgram).map(m => m.kelas)
  ));

  // derived options for ADD modal based on program
  const modalAvailableMatkuls = Array.from(new Set(
    matakuliahList.filter(m => m.program === modalProgram).map(m => m.nama_mk)
  ));
  
  const modalAvailableKelas = Array.from(new Set(
    matakuliahList.filter(m => m.nama_mk === modalMatkul && m.program === modalProgram).map(m => m.kelas)
  ));

  // Modal resets when modalProgram shifts
  useEffect(() => {
    if (isAddModalOpen) {
      const modalMks = Array.from(new Set(matakuliahList.filter(m => m.program === modalProgram).map(m => m.nama_mk)));
      if (modalMks.length > 0) {
        setModalMatkul(modalMks[0]);
      } else {
        setModalMatkul('');
      }
    }
  }, [modalProgram, isAddModalOpen]);

  // Modal resets class when modalMatkul shifts
  useEffect(() => {
    if (isAddModalOpen && modalMatkul) {
      const modalKls = Array.from(new Set(matakuliahList.filter(m => m.nama_mk === modalMatkul && m.program === modalProgram).map(m => m.kelas)));
      if (modalKls.length > 0 && !modalKls.includes(modalKelas)) {
        setModalKelas(modalKls[0]);
      }
    }
  }, [modalMatkul, modalProgram, isAddModalOpen]);

  // Modal guesses jam_ke on date/class/subject update
  useEffect(() => {
    if (isAddModalOpen && modalTanggal && modalKelas && modalMatkul) {
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const dayName = days[new Date(modalTanggal).getDay()];
      
      const relatedJadwal = jadwalList.find(j => 
        j.hari === dayName && 
        j.kelas === modalKelas &&
        j.nama_mk === modalMatkul
      );
      
      if (relatedJadwal) {
        setModalJamKe(relatedJadwal.jam_ke.toString());
      } else {
        setModalJamKe('1'); // fallback
      }
    }
  }, [modalTanggal, modalKelas, modalMatkul, isAddModalOpen, jadwalList]);

  // Modal active students list
  const studentsInModalClass = mahasantri.filter(m => 
    m.status === 'aktif' &&
    (!modalProgram || m.program === modalProgram) &&
    (!modalKelas || m.kelas === modalKelas)
  );

  // Initialize modal attendance state when class/students list updates
  useEffect(() => {
    if (isAddModalOpen) {
      const initAbs: Record<string, string> = {};
      studentsInModalClass.forEach(m => {
        initAbs[m.id] = 'hadir';
      });
      setModalAbsensi(initAbs);
    }
  }, [modalKelas, modalProgram, isAddModalOpen]);

  // Format Helper Utilities
  const formatDateShort = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const day = days[date.getDay()];
    const d = date.getDate();
    const m = date.getMonth() + 1;
    return `${day}, ${d}/${m}`;
  };

  const getStatusSelectClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'hadir': return 'bg-emerald-50 text-emerald-800 border-emerald-300 focus:ring-emerald-500';
      case 'sakit': return 'bg-amber-50 text-amber-800 border-amber-300 focus:ring-amber-500';
      case 'izin': return 'bg-blue-50 text-blue-800 border-blue-300 focus:ring-blue-500';
      case 'alpa': return 'bg-red-50 text-red-800 border-red-300 focus:ring-red-500';
      case 'terlambat': return 'bg-purple-50 text-purple-800 border-purple-300 focus:ring-purple-500';
      default: return 'bg-slate-50 text-slate-400 border-slate-200 focus:ring-slate-500';
    }
  };

  const getAttendanceForCell = (studentId: string, date: string, jam: string) => {
    return absensiData.find(a => 
      String(a.mahasiswa_id || '').trim() === String(studentId || '').trim() &&
      String(a.tanggal || '').trim() === String(date || '').trim() &&
      String(a.jam_ke || '').trim() === String(jam || '').trim() &&
      String(a.program || '').trim() === String(selectedProgram || '').trim() &&
      String(a.kelas || '').trim() === String(selectedKelas || '').trim() &&
      (selectedMatkul === '' || String(a.nama_mk || '').trim() === String(selectedMatkul || '').trim())
    );
  };

  const getActiveJamsForDate = (date: string): string[] => {
    const list = absensiData.filter(a => 
      cleanCompare(getPropValue(a, 'tanggal'), date) &&
      cleanCompare(getPropValue(a, 'program'), selectedProgram) &&
      cleanCompare(getPropValue(a, 'kelas'), selectedKelas) &&
      (cleanCompare(selectedMatkul, '') || cleanCompare(getPropValue(a, 'nama_mk'), selectedMatkul))
    );
    const setOfJams = new Set(list.map(a => {
      const jk = getPropValue(a, 'jam_ke');
      return jk ? jk.toString() : '';
    }).filter(Boolean));
    const jams = Array.from(setOfJams) as string[];
    return jams.sort((a, b) => parseInt(a) - parseInt(b));
  };

  const getPembahasanForJam = (date: string, jam: string) => {
    let record = absensiData.find(a => {
      const aTanggal = getPropValue(a, 'tanggal');
      const aJam = getPropValue(a, 'jam_ke');
      const aProgram = getPropValue(a, 'program');
      const aKelas = getPropValue(a, 'kelas');
      const aMk = getPropValue(a, 'nama_mk');
      const aPembahasan = getPropValue(a, 'pembahasan');
      
      return (
        cleanCompare(aTanggal, date) &&
        cleanCompare(aJam, jam) &&
        cleanCompare(aProgram, selectedProgram) &&
        cleanCompare(aKelas, selectedKelas) &&
        (cleanCompare(selectedMatkul, '') || cleanCompare(aMk, selectedMatkul)) &&
        aPembahasan &&
        aPembahasan.toString().trim() !== ''
      );
    });
    
    if (!record) {
      record = absensiData.find(a => {
        const aTanggal = getPropValue(a, 'tanggal');
        const aJam = getPropValue(a, 'jam_ke');
        const aProgram = getPropValue(a, 'program');
        const aKelas = getPropValue(a, 'kelas');
        const aPembahasan = getPropValue(a, 'pembahasan');
        
        return (
          cleanCompare(aTanggal, date) &&
          cleanCompare(aJam, jam) &&
          cleanCompare(aProgram, selectedProgram) &&
          cleanCompare(aKelas, selectedKelas) &&
          aPembahasan &&
          aPembahasan.toString().trim() !== ''
        );
      });
    }
    
    if (!record) {
      record = absensiData.find(a => {
        const aTanggal = getPropValue(a, 'tanggal');
        const aJam = getPropValue(a, 'jam_ke');
        const aPembahasan = getPropValue(a, 'pembahasan');
        
        return (
          cleanCompare(aTanggal, date) &&
          cleanCompare(aJam, jam) &&
          aPembahasan &&
          aPembahasan.toString().trim() !== ''
        );
      });
    }
    
    const res = record ? getPropValue(record, 'pembahasan') : '';
    return res ? res.toString() : '';
  };

  const formatJamTime = (jam: string) => {
    const key = jam.toString().trim();
    
    const isISO = /^\d{4}-\d{2}-\d{2}T\d{2}[:\.]\d{2}/.test(key);
    if (isISO || /^\d+(\.\d+)?$/.test(key) || /^\d+[\.:]\d+$/.test(key)) {
      const formatted = formatTimeDisplay(key);
      const parts = formatted.split('.');
      const h = parseInt(parts[0]);
      const m = parseInt(parts[1]);
      if (!isNaN(h) && !isNaN(m)) {
        let endM = m + 45;
        let endH = h + Math.floor(endM / 60);
        endM = endM % 60;
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${formatted} - ${pad(endH)}.${pad(endM)}`;
      }
      return formatted;
    }

    const match = jadwalList.find(j => 
      cleanCompare(getPropValue(j, 'jam_ke'), jam) &&
      cleanCompare(getPropValue(j, 'program'), selectedProgram) &&
      cleanCompare(getPropValue(j, 'kelas'), selectedKelas)
    ) || jadwalList.find(j => cleanCompare(getPropValue(j, 'jam_ke'), jam));

    if (match) {
      const mulai = getPropValue(match, 'jam_mulai');
      const berakhir = getPropValue(match, 'jam_berakhir') || getPropValue(match, 'jam_selesai');
      if (mulai) {
        const startStr = formatTimeDisplay(mulai);
        const endStr = formatTimeDisplay(berakhir);
        if (endStr) {
          return `${startStr} - ${endStr}`;
        }
        
        const parts = startStr.split('.');
        if (parts.length >= 2) {
          const h = parseInt(parts[0]);
          const m = parseInt(parts[1]);
          if (!isNaN(h) && !isNaN(m)) {
            let endM = m + 45;
            let endH = h + Math.floor(endM / 60);
            endM = endM % 60;
            const pad = (n: number) => n.toString().padStart(2, '0');
            return `${startStr} - ${pad(endH)}.${pad(endM)}`;
          }
        }
        return startStr;
      }
    }
    
    const standardMap: Record<string, string> = {
      '1': '07.30 - 08.15',
      '2': '08.15 - 09.00',
      '3': '09.00 - 09.45',
      '4': '09.45 - 10.30',
      '5': '10.45 - 11.30',
      '6': '11.30 - 12.15',
      '7': '13.00 - 13.45',
      '8': '13.45 - 14.30',
      '9': '14.30 - 15.15',
      '10': '15.15 - 16.00',
    };
    
    if (standardMap[key]) return standardMap[key];
    
    const parsedNum = key.replace(/\D/g, '');
    if (parsedNum && standardMap[parsedNum]) return standardMap[parsedNum];
    
    return `Jam ${jam}`;
  };

  // Main UI Actions
  const tampilkanRekapSilently = async () => {
    try {
      const resAbs = await api.get('getAbsensi');
      setAbsensiData(resAbs.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const tampilkanRekap = async () => {
    if (!selectedMatkul || !selectedKelas || !selectedBulan) {
      toast.error("Harap lengkapi semua filter");
      return;
    }
    
    setLoading(true);
    try {
      const resAbs = await api.get('getAbsensi');
      const allAbsensi: Absensi[] = resAbs.data || [];
      setAbsensiData(allAbsensi);
      setHasQueried(true);
      
      const filteredCount = allAbsensi.filter(a => 
        a.tanggal && 
        a.tanggal.startsWith(selectedBulan) &&
        a.program === selectedProgram &&
        a.kelas === selectedKelas &&
        (selectedMatkul === '' || a.nama_mk === selectedMatkul)
      ).length;
      
      if (filteredCount === 0) {
        toast('Tidak ada data absensi untuk filter tersebut.', { icon: 'ℹ️' });
      }
    } catch (err) {
      toast.error('Gagal mengambil data absensi');
    } finally {
      setLoading(false);
    }
  };

  // ADD NEW ATTENDANCE POPUP BACKEND TRIGGERS
  const handleOpenAddModal = () => {
    // pre-fill based on main screen filters where possible
    setModalProgram(selectedProgram);
    setModalMatkul(selectedMatkul || mainAvailableMatkuls[0] || '');
    setModalKelas(selectedKelas || mainAvailableKelas[0] || '');
    setModalTanggal(format(new Date(), 'yyyy-MM-dd'));
    setModalPembahasan('');
    setIsAddModalOpen(true);
  };

  const handleSaveNewSession = async () => {
    if (studentsInModalClass.length === 0) {
      toast.error("Tidak ada mahasantri aktif di kelas ini.");
      return;
    }
    if (!modalMatkul || !modalKelas) {
      toast.error("Mohon pilih Mata Kuliah dan Kelas.");
      return;
    }

    setSavingNewSession(true);
    Swal.fire({
      title: 'Menyimpan absensi...',
      text: 'Mohon tunggu sebentar',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    const payload = Object.keys(modalAbsensi).map(mId => ({
      tanggal: modalTanggal,
      jam_ke: modalJamKe.toString(),
      nama_mk: modalMatkul,
      program: modalProgram,
      kelas: modalKelas,
      mahasiswa_id: mId,
      status: modalAbsensi[mId],
      pembahasan: modalPembahasan
    }));

    try {
      await api.post('saveAbsensi', { data: payload });
      Swal.close();
      toast.success('Data absensi berhasil disimpan!');
      setIsAddModalOpen(false);
      // automatically query / refresh report
      tampilkanRekap();
    } catch (error) {
      Swal.close();
      toast.error('Gagal menyimpan absensi');
    } finally {
      setSavingNewSession(false);
    }
  };

  const handleMarkAllPresentInModal = () => {
    const updated: Record<string, string> = {};
    studentsInModalClass.forEach(m => {
      updated[m.id] = 'hadir';
    });
    setModalAbsensi(updated);
    toast.success("Berhasil menandai semua mahasantri HADIR.");
  };

  // EDIT ATTENDANCE POPUP BACKEND TRIGGERS
  const handleOpenEditSession = (date: string, jam: string) => {
    const initAbs: Record<string, { id?: string, status: string }> = {};
    studentsInClass.forEach(m => {
      const existing = getAttendanceForCell(m.id, date, jam);
      initAbs[m.id] = {
        id: existing?.id,
        status: existing?.status || ''
      };
    });
    
    const existingPb = getPembahasanForJam(date, jam) || '';
    
    setSessionFormData({
      tanggal: date,
      jam_ke: jam,
      pembahasan: existingPb,
      absensi: initAbs
    });
    setEditingSession({ date, jam });
  };

  const handleSaveSession = async () => {
    setIsSavingSession(true);
    toast.loading('Menyimpan perubahan sesi...', { id: 'save-session' });
    try {
      const updates = [];
      const creates = [];
      
      for (const mId of Object.keys(sessionFormData.absensi)) {
        const item = sessionFormData.absensi[mId];
        if (item.id) {
          updates.push(api.post('updateAbsensi', {
            id: item.id,
            data: {
              tanggal: sessionFormData.tanggal,
              jam_ke: sessionFormData.jam_ke.toString(),
              status: item.status,
              pembahasan: sessionFormData.pembahasan,
              timestamp: new Date().toISOString()
            }
          }));
        } else if (item.status) {
          creates.push({
            tanggal: sessionFormData.tanggal,
            jam_ke: sessionFormData.jam_ke.toString(),
            nama_mk: selectedMatkul || 'Mata Kuliah',
            program: selectedProgram,
            kelas: selectedKelas,
            mahasiswa_id: mId,
            status: item.status,
            pembahasan: sessionFormData.pembahasan,
          });
        }
      }
      
      if (updates.length > 0) {
        await Promise.all(updates);
      }
      
      if (creates.length > 0) {
        await api.post('saveAbsensi', { data: creates });
      }
      
      if (editingSession) {
        const matchingPbRecords = absensiData.filter(a => 
          String(a.tanggal || '').trim() === String(editingSession.date || '').trim() &&
          String(a.jam_ke || '').trim() === String(editingSession.jam || '').trim() &&
          String(a.program || '').trim() === String(selectedProgram || '').trim() &&
          String(a.kelas || '').trim() === String(selectedKelas || '').trim() &&
          (selectedMatkul === '' || String(a.nama_mk || '').trim() === String(selectedMatkul || '').trim())
        );
        
        if (matchingPbRecords.length > 0) {
          const updatesPb = matchingPbRecords.map(rec => 
            api.post('updateAbsensi', {
              id: rec.id,
              data: {
                tanggal: sessionFormData.tanggal,
                jam_ke: sessionFormData.jam_ke.toString(),
                pembahasan: sessionFormData.pembahasan
              }
            })
          );
          await Promise.all(updatesPb);
        }
      }
      
      toast.success('Sesi berhasil diperbarui', { id: 'save-session' });
      setEditingSession(null);
      tampilkanRekap(); 
    } catch (err) {
      toast.error('Gagal memperbarui sesi', { id: 'save-session' });
    } finally {
      setIsSavingSession(false);
    }
  };

  const activeJamsMap: Record<string, string[]> = {};
  uniqueDates.forEach(date => {
    activeJamsMap[date] = getActiveJamsForDate(date);
  });
  const totalColumnsCount = Object.values(activeJamsMap).reduce((sum, jams) => sum + jams.length, 0);

  const statusOptions = ['hadir', 'sakit', 'izin', 'alpa', 'terlambat'];
  const statusColors: Record<string, string> = {
    hadir: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    sakit: 'bg-blue-100 text-blue-800 border-blue-200',
    izin: 'bg-amber-100 text-amber-800 border-amber-200',
    alpa: 'bg-red-100 text-red-800 border-red-200',
    terlambat: 'bg-purple-100 text-purple-800 border-purple-200',
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 w-full max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h3 className="text-xl font-bold leading-6 text-slate-800">Absensi & Jurnal Kelas</h3>
          <p className="mt-1 text-sm text-slate-500">Melihat rekapitulasi kehadiran berkala serta melakukan penginputan absensi siswa baru.</p>
        </div>
        
        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold shadow-md shadow-emerald-500/20 transition-all text-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Absensi Baru</span>
        </button>
      </div>

      {/* FILTER SECTION */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        <div className="w-full">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Program</label>
          <div className="relative">
            <Compass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <select 
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="pl-10 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2.5 border bg-white"
            >
              {PROGRAM_OPTIONS.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="w-full">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Mata Kuliah</label>
          <div className="relative">
            <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <select 
              value={selectedMatkul}
              onChange={(e) => setSelectedMatkul(e.target.value)}
              className="pl-10 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2.5 border bg-white"
            >
              <option value="">Pilih Mata Kuliah</option>
              {mainAvailableMatkuls.map(mk => (
                <option key={mk} value={mk}>{mk}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="w-full">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Kelas</label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <select 
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="pl-10 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2.5 border bg-white"
            >
              <option value="">Pilih Kelas</option>
              {mainAvailableKelas.map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="w-full">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Bulan</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="month"
              value={selectedBulan}
              onChange={e => setSelectedBulan(e.target.value)}
              className="pl-10 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2.5 border bg-white"
            />
          </div>
        </div>

        <div className="w-full flex">
          <button 
            onClick={tampilkanRekap}
            disabled={loading || isFetchingInitial}
            className="w-full inline-flex items-center justify-center rounded-md border border-transparent bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 cursor-pointer text-center font-bold"
          >
            {loading ? 'Memproses...' : 'Tampilkan Laporan'}
          </button>
        </div>
      </div>

      {/* MATRIX ATTENDANCE TABLE */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-sm">
        <table className="min-w-[900px] w-full border border-slate-200 border-collapse">
          <thead className="bg-[#F8FAFC] sticky top-0 z-10 shadow-sm">
            <tr className="border-b border-slate-200">
              <th rowSpan={2} className="px-4 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider bg-[#F8FAFC] border-r border-b border-slate-200 w-24">NIM</th>
              <th rowSpan={2} className="px-4 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider bg-[#F8FAFC] border-r border-b border-slate-200 w-48">Nama Lengkap</th>
              {uniqueDates.map(date => {
                const activeJams = activeJamsMap[date] || [];
                return (
                  <th 
                    key={date} 
                    colSpan={activeJams.length} 
                    className="px-2 py-3 text-center text-xs font-bold text-slate-700 bg-slate-100 border-r border-slate-200 border-b border-slate-200"
                  >
                    <div className="flex items-center justify-center gap-1 font-mono">
                      <span>{formatDateShort(date)}</span>
                    </div>
                  </th>
                );
              })}
              {uniqueDates.length === 0 && (
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider bg-[#F8FAFC] border-b border-slate-200">Tanggal Absensi</th>
              )}
            </tr>
            <tr className="border-b border-slate-200">
              {uniqueDates.map(date => {
                const activeJams = activeJamsMap[date] || [];
                return activeJams.map(jam => {
                  const pb = getPembahasanForJam(date, jam);
                  return (
                    <th 
                      key={`${date}-${jam}`} 
                      className="px-2 py-2 text-center text-[10px] font-bold text-slate-500 bg-[#F8FAFC] border-r border-slate-200 min-w-[125px] max-w-[180px] border-b border-slate-200"
                    >
                      <div className="flex flex-col items-center justify-center gap-1">
                        <div className="text-[11px] text-slate-700 font-bold whitespace-nowrap">
                          Jam {jam}
                        </div>
                        <div className="flex flex-col gap-1 w-full mt-1">
                          {pb && (
                            <div className="text-[9px] font-medium text-slate-600 bg-white px-2 py-1.5 rounded border border-slate-250 leading-tight text-center break-words w-full h-full">
                              <span className="line-clamp-3 w-full italic">"{pb}"</span>
                            </div>
                          )}
                          <button
                            onClick={() => handleOpenEditSession(date, jam)}
                            className="w-full text-center font-bold px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 cursor-pointer transition-all text-[9.5px] border border-emerald-200 hover:border-emerald-300 shadow-sm"
                            title="Edit absensi dan materi pada sesi ini"
                          >
                            ✍️ Edit Sesi
                          </button>
                        </div>
                      </div>
                    </th>
                  );
                });
              })}
              {uniqueDates.length === 0 && (
                <th className="px-4 py-2 text-center text-xs font-normal text-slate-400 border-b border-slate-200">Belum ada kolom pertemuan</th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {loading ? (
              [1, 2, 3].map((i) => (
                <tr key={i} className="animate-pulse border-b border-slate-200">
                  <td className="px-4 py-4 border-r border-slate-200"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                  <td className="px-4 py-4 border-r border-slate-200"><div className="h-4 bg-slate-200 rounded w-40"></div></td>
                  <td colSpan={totalColumnsCount || 1} className="px-4 py-4 text-center text-slate-300">Loading kehadiran...</td>
                </tr>
              ))
            ) : !hasQueried ? (
              <tr>
                <td colSpan={totalColumnsCount + 2 || 3} className="px-6 py-12 text-center text-sm text-slate-500">
                  Silakan pilih filter di atas kemudian klik tombol <b>Tampilkan Laporan</b> untuk melihat data.
                </td>
              </tr>
            ) : studentsInClass.length === 0 ? (
              <tr>
                <td colSpan={totalColumnsCount + 2 || 3} className="px-6 py-12 text-center text-sm text-slate-500">
                  Tidak ditemukan mahasantri aktif untuk Kelas / Program terpilih.
                </td>
              </tr>
            ) : (
              studentsInClass.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-200">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 font-mono border-r border-slate-200">{m.nim}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-slate-800 border-r border-slate-200">{m.nama}</td>
                  {uniqueDates.map(date => {
                    const activeJams = activeJamsMap[date] || [];
                    return activeJams.map(jam => {
                      const att = getAttendanceForCell(m.id, date, jam);
                      return (
                        <td key={`${date}-${jam}`} className="px-1 py-1.5 text-center border-r border-slate-200">
                          <div
                            className={`inline-flex items-center justify-center w-7 h-7 text-[12px] font-bold rounded-md border ${
                              att ? getStatusSelectClass(att.status) : 'bg-slate-50 text-slate-400 border-slate-200'
                            }`}
                            title={att ? `Status: ${att.status}` : 'Belum absen'}
                          >
                            {att && att.status ? att.status.charAt(0).toUpperCase() : '-'}
                          </div>
                        </td>
                      );
                    });
                  })}
                  {uniqueDates.length === 0 && (
                    <td className="px-4 py-3 text-center text-sm text-slate-400">Belum ada absen yang tercatat pada bulan ini.</td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* POPUP / MODAL: TAMBAH ABSENSI BARU */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Input Data Absensi Harian</h3>
                  <p className="text-sm text-slate-500">Lengkapi jadwal, tanggal, dan materi di bawah untuk merekam presensi harian mahasantri.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1.5 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Program</label>
                  <select 
                    value={modalProgram}
                    onChange={(e) => setModalProgram(e.target.value)}
                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border bg-white"
                  >
                    {PROGRAM_OPTIONS.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Mata Kuliah</label>
                  <select 
                    value={modalMatkul}
                    onChange={(e) => setModalMatkul(e.target.value)}
                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border bg-white"
                  >
                    {modalAvailableMatkuls.map(mk => (
                      <option key={mk} value={mk}>{mk}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Kelas</label>
                  <select 
                    value={modalKelas}
                    onChange={(e) => setModalKelas(e.target.value)}
                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border bg-white"
                  >
                    {modalAvailableKelas.map(k => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tanggal</label>
                  <input 
                    type="date"
                    value={modalTanggal}
                    onChange={(e) => setModalTanggal(e.target.value)}
                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Jam Ke</label>
                  <input 
                    type="number"
                    min="1"
                    max="10"
                    value={modalJamKe}
                    onChange={(e) => setModalJamKe(e.target.value)}
                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border bg-white"
                  />
                </div>
              </div>

              {/* Jurnal text input */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Jurnal Pembahasan / Materi Perkuliahan
                </label>
                <textarea
                  rows={2}
                  value={modalPembahasan}
                  onChange={(e) => setModalPembahasan(e.target.value)}
                  placeholder="Tuliskan pokok pembahasan, submateri, atau catatan khusus perkuliahan hari ini..."
                  className="block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-3 border bg-white"
                />
              </div>

              {/* Student List header & shortcut */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mt-4">
                <h4 className="font-bold text-slate-700 flex items-center gap-2">
                  <span>Daftar Mahasantri ({studentsInModalClass.length} orang)</span>
                </h4>
                {studentsInModalClass.length > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllPresentInModal}
                    className="text-xs px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors font-bold rounded-lg cursor-pointer"
                  >
                    ✓ Hadirkan Semua
                  </button>
                )}
              </div>

              {/* Individual students attendance checkboxes */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-[300px] overflow-y-auto">
                <table className="min-w-[600px] w-full divide-y divide-slate-200">
                  <thead className="bg-[#F8FAFC] sticky top-0 z-10 border-b">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 uppercase tracking-wider bg-[#F8FAFC]">No / NIM</th>
                      <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 uppercase tracking-wider bg-[#F8FAFC]">Nama Lengkap</th>
                      <th className="px-4 py-2 text-center text-xs font-bold text-slate-500 uppercase tracking-wider bg-[#F8FAFC]">Kehadiran</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {studentsInModalClass.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-8 text-center text-slate-400">
                          Tidak ada siswa aktif ditemukan untuk program dan kelas terpilih.
                        </td>
                      </tr>
                    ) : (
                      studentsInModalClass.map((m, idx) => (
                        <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <span className="text-slate-400 mr-2">{idx + 1}.</span>
                            <span className="text-slate-600 font-mono">{m.nim}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-slate-800">{m.nama}</td>
                          <td className="px-4 py-3 text-center">
                            <div className="inline-flex justify-center rounded-md overflow-hidden shadow-sm" role="group">
                              {statusOptions.map(opt => (
                                <button
                                  type="button"
                                  key={opt}
                                  onClick={() => setModalAbsensi(prev => ({ ...prev, [m.id]: opt }))}
                                  className={`px-3 py-1.5 text-xs font-bold border-y border-r border-slate-200 first:border-l capitalize transition-colors cursor-pointer
                                    ${modalAbsensi[m.id] === opt 
                                      ? statusColors[opt] 
                                      : 'bg-white text-slate-500 hover:bg-slate-50'
                                    }`}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 rounded-b-xl">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                disabled={savingNewSession}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 bg-white hover:bg-slate-50 font-medium transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={savingNewSession || studentsInModalClass.length === 0}
                onClick={handleSaveNewSession}
                className="px-6 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg shadow-md hover:shadow-emerald-600/10 transition-all font-bold disabled:opacity-50 cursor-pointer"
              >
                {savingNewSession ? 'Menyimpan...' : 'Simpan Presensi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP / MODAL: EDIT ABSENSI EXISTING */}
      {editingSession && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Edit Absensi Sesi Kelas</h2>
                <p className="text-sm text-slate-500">Edit data untuk {selectedProgram} • Kelas {selectedKelas} • {selectedMatkul}</p>
              </div>
              <button 
                onClick={() => setEditingSession(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100 cursor-pointer"
                disabled={isSavingSession}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Tanggal Pertemuan</label>
                  <input 
                    type="date"
                    value={sessionFormData.tanggal}
                    onChange={e => setSessionFormData(p => ({...p, tanggal: e.target.value}))}
                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Jam Ke</label>
                  <input 
                    type="number"
                    min="1" max="10"
                    value={sessionFormData.jam_ke}
                    onChange={e => setSessionFormData(p => ({...p, jam_ke: e.target.value}))}
                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border bg-white"
                  />
                </div>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Materi / Pembahasan</label>
                <textarea 
                  value={sessionFormData.pembahasan}
                  onChange={e => setSessionFormData(p => ({...p, pembahasan: e.target.value}))}
                  placeholder="Tulis pokok pembahasan perkuliahan hari ini..."
                  className="block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-3 border bg-white min-h-[80px]"
                />
              </div>
              
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-[#F8FAFC] sticky top-0 z-10 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider bg-[#F8FAFC]">NIM</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider bg-[#F8FAFC]">Nama Mahasantri</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider bg-[#F8FAFC]">Status Kehadiran</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {studentsInClass.map(m => (
                      <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 font-mono">{m.nim}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-slate-800">{m.nama}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="inline-flex justify-center rounded-md overflow-hidden shadow-sm" role="group">
                            {['hadir', 'sakit', 'izin', 'alpa', 'terlambat', ''].map(status => (
                              <button
                                type="button"
                                key={status}
                                onClick={() => setSessionFormData(p => ({
                                  ...p,
                                  absensi: {
                                    ...p.absensi,
                                    [m.id]: {
                                      ...p.absensi[m.id],
                                      status: status
                                    }
                                  }
                                }))}
                                className={`px-3 py-1.5 text-xs font-bold border-y border-r border-slate-200 first:border-l capitalize transition-colors cursor-pointer
                                  ${sessionFormData.absensi[m.id]?.status === status 
                                    ? (status === 'hadir' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                                       status === 'sakit' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                                       status === 'izin' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                                       status === 'alpa' ? 'bg-red-100 text-red-800 border-red-300' :
                                       status === 'terlambat' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                                       'bg-slate-200 text-slate-800 border-slate-300') 
                                    : 'bg-white text-slate-500 hover:bg-slate-50'
                                  }`}
                              >
                                {status || '-'}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 rounded-b-xl">
              <button
                type="button"
                onClick={() => setEditingSession(null)}
                disabled={isSavingSession}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 bg-white hover:bg-slate-50 font-medium transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveSession}
                disabled={isSavingSession}
                className="px-6 py-2 rounded-lg font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-emerald-600/10 transition-colors flex items-center gap-2 cursor-pointer"
              >
                {isSavingSession ? 'Menyimpan...' : (
                  <>
                    <Check className="w-4 h-4" /> Simpan Perubahan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
