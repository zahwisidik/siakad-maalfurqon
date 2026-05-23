import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { Calendar, BookOpen, Users, Edit, Trash2, Check, X, Compass } from 'lucide-react';
import { Mahasantri, Absensi, Matakuliah, Kelas, Jadwal } from '../../types';
import { PROGRAM_OPTIONS } from '../../constants';
import { formatTimeDisplay } from '../../utils/time';

export default function RekapAbsensiPengajar() {
  const { user } = useAuth();
  const [mahasantri, setMahasantri] = useState<Mahasantri[]>([]);
  const [jadwal, setJadwal] = useState<Jadwal[]>([]);
  const [absensiData, setAbsensiData] = useState<Absensi[]>([]);
  const [matakuliah, setMatakuliah] = useState<Matakuliah[]>([]);
  const [kelas, setKelas] = useState<Kelas[]>([]);
  
  const [selectedProgram, setSelectedProgram] = useState<string>(PROGRAM_OPTIONS[0]);
  const [selectedMatkul, setSelectedMatkul] = useState<string>('');
  const [selectedKelas, setSelectedKelas] = useState<string>('');
  const [selectedBulan, setSelectedBulan] = useState<string>(
    new Date().toISOString().substring(0, 7) // YYYY-MM
  );
  
  const [loading, setLoading] = useState(false);
  const [isFetchingInitial, setIsFetchingInitial] = useState(true);
  const [hasQueried, setHasQueried] = useState(false);

  const [editingSession, setEditingSession] = useState<{date: string, jam: string} | null>(null);
  const [sessionFormData, setSessionFormData] = useState<{
    tanggal: string,
    jam_ke: string,
    pembahasan: string,
    absensi: Record<string, {id?: string, status: string}>
  }>({ tanggal: '', jam_ke: '', pembahasan: '', absensi: {} });
  const [isSavingSession, setIsSavingSession] = useState(false);

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
      
      setJadwal(myJadwal);
      setMatakuliah(myMk);
      
      const defaultProgram = PROGRAM_OPTIONS[0];
      
      // Filter classes that this pengajar actually teaches in selected program
      const uniqueKelasNames = new Set(myMk.filter(m => m.program === defaultProgram).map(m => m.kelas));
      const myKelas = (resKls.data || []).filter((k: any) => uniqueKelasNames.has(k.nama_kelas));
      setKelas(myKelas);
      
      const filteredMk = myMk.filter(m => m.program === defaultProgram);
      if (filteredMk.length > 0) setSelectedMatkul(filteredMk[0].nama_mk);
      if (myKelas.length > 0) setSelectedKelas(myKelas[0].nama_kelas);
    } catch (err) {
      toast.error('Gagal mengambil data referensi');
    } finally {
      setIsFetchingInitial(false);
    }
  };

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

  const getPembahasanForDay = (date: string) => {
    const records = absensiData.filter(a => 
      a.tanggal === date && 
      a.kelas === selectedKelas &&
      a.program === selectedProgram &&
      (selectedMatkul === '' || a.nama_mk === selectedMatkul) &&
      a.pembahasan && 
      a.pembahasan.trim() !== ''
    );
    if (records.length === 0) return '';
    return records.map(r => `Jam ${r.jam_ke}: ${r.pembahasan}`).join('\n');
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

  const handleOpenEditSession = (date: string, jam: string) => {
    const initAbs: Record<string, {id?: string, status: string}> = {};
    studentsInClass.forEach(m => {
      const existing = getAttendanceForCell(m.id, date, jam);
      initAbs[m.id] = {
        id: existing?.id,
        status: existing?.status || ''
      };
    });
    
    // Get existing pembahasan
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
          // Update existing
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
          // Create new record for this student if status is not empty
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
      
      // Update the pembahasan records tanggal, jam_ke, and pembahasan as well if changed
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
      tampilkanRekap(); // refresh data
    } catch (err) {
      toast.error('Gagal memperbarui sesi', { id: 'save-session' });
    } finally {
      setIsSavingSession(false);
    }
  };

  const handleQuickUpdate = async (studentId: string, date: string, jamKe: string, newStatus: string) => {
    const existingRecord = getAttendanceForCell(studentId, date, jamKe);
    
    if (newStatus === '') {
      if (existingRecord) {
        toast.loading('Menghapus...', { id: 'status-update' });
        try {
          await api.post('deleteAbsensi', { id: existingRecord.id });
          toast.success('Absensi berhasil dihapus', { id: 'status-update' });
          tampilkanRekapSilently();
        } catch (err) {
          toast.error('Gagal menghapus absensi', { id: 'status-update' });
        }
      }
      return;
    }

    if (existingRecord) {
      toast.loading('Memperbarui...', { id: 'status-update' });
      try {
        await api.post('updateAbsensi', { 
          id: existingRecord.id, 
          data: { 
            status: newStatus,
            timestamp: new Date().toISOString() 
          } 
        });
        toast.success(`Absensi diperbarui ke: ${newStatus}`, { id: 'status-update' });
        tampilkanRekapSilently();
      } catch (err) {
        toast.error('Gagal memperbarui absensi', { id: 'status-update' });
      }
    } else {
      toast.loading('Menyimpan...', { id: 'status-update' });
      try {
        const payload = {
          tanggal: date,
          jam_ke: jamKe.toString(),
          nama_mk: selectedMatkul || 'Mata Kuliah',
          program: selectedProgram,
          kelas: selectedKelas,
          mahasiswa_id: studentId,
          status: newStatus,
        };
        await api.post('saveAbsensi', { data: [payload] });
        toast.success(`Absensi disimpan ke: ${newStatus}`, { id: 'status-update' });
        tampilkanRekapSilently();
      } catch (err) {
        toast.error('Gagal menyimpan absensi', { id: 'status-update' });
      }
    }
  };

  const handleEditPembahasan = async (date: string, jam: string, oldPb: string) => {
    const { value: newPb } = await Swal.fire({
      title: 'Edit Pembahasan',
      input: 'textarea',
      inputLabel: `Materi/Pembahasan Jam ${jam} (${formatDateShort(date)})`,
      inputValue: oldPb,
      inputPlaceholder: 'Tulis pokok pembahasan perkuliahan hari ini...',
      showCancelButton: true,
      cancelButtonText: 'Batal',
      confirmButtonText: 'Simpan',
      confirmButtonColor: '#059669', // Emerald 600
    });

    if (newPb === undefined) return; // User cancelled

    const matchingRecords = absensiData.filter(a => 
      cleanCompare(getPropValue(a, 'tanggal'), date) &&
      cleanCompare(getPropValue(a, 'jam_ke'), jam) &&
      cleanCompare(getPropValue(a, 'program'), selectedProgram) &&
      cleanCompare(getPropValue(a, 'kelas'), selectedKelas) &&
      (cleanCompare(selectedMatkul, '') || cleanCompare(getPropValue(a, 'nama_mk'), selectedMatkul))
    );

    if (matchingRecords.length === 0) {
      toast.error('Gagal menemukan data absensi untuk kelas jam ini.');
      return;
    }

    toast.loading('Menyimpan pembahasan...', { id: 'pembahasan-update' });
    try {
      await Promise.all(matchingRecords.map(record => 
        api.post('updateAbsensi', {
          id: record.id,
          data: {
            pembahasan: newPb
          }
        })
      ));
      toast.success('Pembahasan berhasil diperbarui', { id: 'pembahasan-update' });
      tampilkanRekapSilently();
    } catch (err) {
      toast.error('Gagal memperbarui pembahasan', { id: 'pembahasan-update' });
    }
  };

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

  const formatJamTime = (jam: string) => {
    const key = jam.toString().trim();
    
    // If jam already looks like a raw time string from DB or standard formatting
    // For example: "7.3" or "07.30" or ISO timestamps, etc.
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

    // 1. Try to find a schedule that matches this jam_ke to get its hours from the database
    // Attempt specific program + kelas match first, fallback to first matching jam_ke
    const match = jadwal.find(j => 
      cleanCompare(getPropValue(j, 'jam_ke'), jam) &&
      cleanCompare(getPropValue(j, 'program'), selectedProgram) &&
      cleanCompare(getPropValue(j, 'kelas'), selectedKelas)
    ) || jadwal.find(j => cleanCompare(getPropValue(j, 'jam_ke'), jam));

    if (match) {
      const mulai = getPropValue(match, 'jam_mulai');
      const berakhir = getPropValue(match, 'jam_berakhir') || getPropValue(match, 'jam_selesai');
      if (mulai) {
        const startStr = formatTimeDisplay(mulai);
        const endStr = formatTimeDisplay(berakhir);
        if (endStr) {
          return `${startStr} - ${endStr}`;
        }
        
        // Fallback end time: if berakhir is missing but start is present, add 45 minutes
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
    
    // 2. Fallbacks for standard jam_ke mappings
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
    
    if (standardMap[key]) {
      return standardMap[key];
    }
    
    // If it's something unrecognized like "j1" or "Jam 1"
    const parsedNum = key.replace(/\D/g, '');
    if (parsedNum && standardMap[parsedNum]) {
      return standardMap[parsedNum];
    }
    
    return `Jam ${jam}`;
  };

  const studentsInClass = mahasantri.filter(m => 
    (!selectedProgram || m.program === selectedProgram) &&
    (!selectedKelas || m.kelas === selectedKelas) &&
    m.status === 'aktif'
  );

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
    // 1. Try with complete filter set
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
    
    // 2. Fallback: ignore precise subject comparison (useful if subject naming varies inside the sheet)
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
    
    // 3. Fallback: ignore program/kelas context if still not found, search by date & jam
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

  const activeJamsMap: Record<string, string[]> = {};
  uniqueDates.forEach(date => {
    activeJamsMap[date] = getActiveJamsForDate(date);
  });
  const totalColumnsCount = Object.values(activeJamsMap).reduce((sum, jams) => sum + jams.length, 0);

  return (
    <div className="bg-white shadow rounded-lg p-6 w-full max-w-7xl mx-auto">
      <div className="mb-6">
        <h3 className="text-lg font-medium leading-6 text-slate-900">Rekap Absensi Bulanan</h3>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">Melihat detail rekapitulasi kehadiran berdasarkan mata kuliah, kelas, dan bulan.</p>
      </div>

      {/* Filter Section */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
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
              {Array.from(new Set(matakuliah.filter(m => m.program === selectedProgram).map(m => m.nama_mk))).map(mk => (
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
              {Array.from(new Set(matakuliah.filter(m => m.program === selectedProgram && (selectedMatkul === '' || m.nama_mk === selectedMatkul)).map(m => m.kelas))).map(k => (
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
             className="w-full inline-flex items-center justify-center rounded-md border border-transparent bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50"
           >
             {loading ? 'Memproses...' : 'Tampilkan Rekap'}
           </button>
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-md">
        <table className="min-w-[900px] w-full divide-y divide-slate-200 border-collapse">
          <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
            <tr>
              <th rowSpan={2} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50 border-r border-slate-200 w-24">NIM</th>
              <th rowSpan={2} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50 border-r border-slate-200 w-48">Nama Lengkap</th>
              {uniqueDates.map(date => {
                const activeJams = activeJamsMap[date] || [];
                return (
                  <th 
                    key={date} 
                    colSpan={activeJams.length} 
                    className="px-2 py-3 text-center text-xs font-bold text-slate-700 bg-slate-100 border-r border-slate-200 border-b border-slate-200"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span className="font-mono">{formatDateShort(date)}</span>
                    </div>
                  </th>
                );
              })}
              {uniqueDates.length === 0 && (
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50">Tanggal Absensi</th>
              )}
            </tr>
            <tr>
              {uniqueDates.map(date => {
                const activeJams = activeJamsMap[date] || [];
                return activeJams.map(jam => {
                  const pb = getPembahasanForJam(date, jam);
                  return (
                    <th 
                      key={`${date}-${jam}`} 
                      className="px-2 py-2 text-center text-[10px] font-bold text-slate-500 bg-slate-50 border-r border-slate-100 min-w-[125px] max-w-[180px]"
                    >
                      <div className="flex flex-col items-center justify-center gap-1">
                        <div className="text-[11px] text-slate-700 font-bold whitespace-nowrap">
                          Jam {jam}
                        </div>
                        <div className="flex flex-col gap-1 w-full mt-1">
                          {pb && (
                            <div className="text-[9px] font-medium text-slate-600 bg-slate-50 px-2 py-1.5 rounded border border-slate-100 leading-tight text-center break-words w-full h-full">
                              <span className="line-clamp-3 w-full italic">"{pb}"</span>
                            </div>
                          )}
                          <button
                            onClick={() => handleOpenEditSession(date, jam)}
                            className="w-full text-center font-semibold px-2 py-1.5 rounded bg-emerald-50 hover:bg-emerald-100/90 text-emerald-700 hover:text-emerald-800 cursor-pointer transition-all text-[9.5px] border border-emerald-200 hover:border-emerald-300 shadow-sm"
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
                <th className="px-4 py-2 text-center text-xs font-normal text-slate-400">Belum ada kolom pertemuan</th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {loading ? (
              [1, 2, 3].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-4 py-4 border-r border-slate-200"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                  <td className="px-4 py-4 border-r border-slate-200"><div className="h-4 bg-slate-200 rounded w-40"></div></td>
                  <td colSpan={totalColumnsCount || 1} className="px-4 py-4 text-center text-slate-300">Loading kehadiran...</td>
                </tr>
              ))
            ) : !hasQueried ? (
              <tr>
                 <td colSpan={totalColumnsCount + 2 || 3} className="px-6 py-12 text-center text-sm text-slate-500">
                   Silakan pilih unit filter di atas kemudian klik tombol <b>Tampilkan Rekap</b>.
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
                <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 font-mono border-r border-slate-200">{m.nim}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-slate-800 border-r border-slate-200">{m.nama}</td>
                  {uniqueDates.map(date => {
                    const activeJams = activeJamsMap[date] || [];
                    return activeJams.map(jam => {
                      const att = getAttendanceForCell(m.id, date, jam);
                      return (
                        <td key={`${date}-${jam}`} className="px-1 py-2 text-center border-r border-slate-100">
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
      {editingSession && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col my-auto">
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Edit Absensi Kelas</h2>
                <p className="text-sm text-slate-500">Edit data untuk {selectedProgram} - {selectedKelas} - {selectedMatkul}</p>
              </div>
              <button 
                onClick={() => setEditingSession(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                disabled={isSavingSession}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4 mb-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
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
              
              <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Materi / Pembahasan</label>
                <textarea 
                  value={sessionFormData.pembahasan}
                  onChange={e => setSessionFormData(p => ({...p, pembahasan: e.target.value}))}
                  placeholder="Tulis pokok pembahasan perkuliahan hari ini..."
                  className="block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-3 border bg-white min-h-[80px]"
                />
              </div>
              
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">NIM</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Mahasantri</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Status Kehadiran</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {studentsInClass.map(m => (
                      <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                         <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 font-mono">{m.nim}</td>
                         <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-slate-800">{m.nama}</td>
                         <td className="px-4 py-3 text-center">
                            <div className="inline-flex justify-center rounded-md shadow-sm gap-0" role="group">
                              {['hadir', 'sakit', 'izin', 'alpa', 'terlambat', ''].map(status => (
                                <button
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
                                  className={`px-3 py-1.5 text-xs font-medium border first:rounded-l-md last:rounded-r-md capitalize transition-colors
                                    ${sessionFormData.absensi[m.id]?.status === status 
                                      ? (status === 'hadir' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                                         status === 'sakit' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                                         status === 'izin' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                                         status === 'alpa' ? 'bg-red-100 text-red-800 border-red-300' :
                                         status === 'terlambat' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                                         'bg-slate-200 text-slate-800 border-slate-300') 
                                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
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
            
            <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 rounded-b-lg">
              <button
                onClick={() => setEditingSession(null)}
                disabled={isSavingSession}
                className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 bg-white hover:bg-slate-50 font-medium transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSaveSession}
                disabled={isSavingSession}
                className="px-6 py-2 rounded-md font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors flex items-center gap-2"
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
