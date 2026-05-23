import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { Search, Download, Filter, Calendar, BookOpen, Users, Compass } from 'lucide-react';
import Swal from 'sweetalert2';
import { Mahasantri, Jadwal, Absensi, Matakuliah, Kelas } from '../../types';
import { PROGRAM_OPTIONS } from '../../constants';
import { formatTimeDisplay } from '../../utils/time';

export default function RekapAbsensi() {
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

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [resMhs, resJdwl, resMk, resKls] = await Promise.all([
        api.get('getMahasantri'),
        api.get('getJadwal'),
        api.get('getMatakuliah'),
        api.get('getKelas')
      ]);
      setMahasantri(resMhs.data || []);
      setJadwal(resJdwl.data || []);
      setMatakuliah(resMk.data || []);
      setKelas(resKls.data || []);
      
      const defaultProgram = PROGRAM_OPTIONS[0];
      const filteredMk = (resMk.data || []).filter((m: any) => m.program === defaultProgram);
      const filteredKls = (resKls.data || []).filter((k: any) => k.program === defaultProgram);

      if (filteredMk.length > 0) setSelectedMatkul(filteredMk[0].nama_mk);
      if (filteredKls.length > 0) setSelectedKelas(filteredKls[0].nama_kelas);
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
      cleanCompare(getPropValue(a, 'mahasiswa_id'), studentId) &&
      cleanCompare(getPropValue(a, 'tanggal'), date) &&
      cleanCompare(getPropValue(a, 'jam_ke'), jam) &&
      cleanCompare(getPropValue(a, 'program'), selectedProgram) &&
      cleanCompare(getPropValue(a, 'kelas'), selectedKelas) &&
      (cleanCompare(selectedMatkul, '') || cleanCompare(getPropValue(a, 'nama_mk'), selectedMatkul))
    );
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

  const studentsInClass = mahasantri.filter(m => 
    (!selectedProgram || m.program === selectedProgram) &&
    (!selectedKelas || m.kelas === selectedKelas) &&
    m.status === 'aktif'
  );

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
    <div className="bg-white shadow rounded-lg p-6">
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium leading-6 text-slate-900">Rekap Absensi Bulanan</h3>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">Melihat detail rekapitulasi kehadiran berdasarkan mata kuliah, kelas, dan bulan.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => toast.success('Fitur download excel akan segera tersedia')}
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </button>
        </div>
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
              <option value="">Semua Mata Kuliah</option>
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
              {Array.from(new Set(kelas.filter(k => k.program === selectedProgram).map(k => k.nama_kelas))).map(k => (
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
                          {formatJamTime(jam)}
                        </div>
                        <div className="text-[9px] text-slate-400 font-medium">
                          Jam {jam}
                        </div>
                        {pb ? (
                          <button
                            onClick={() => handleEditPembahasan(date, jam, pb)}
                            className="group relative text-[9px] font-normal text-emerald-700 bg-emerald-50 hover:bg-emerald-100/90 hover:border-emerald-300 px-2 py-1.5 rounded border border-emerald-100 leading-tight text-center break-words w-full shadow-sm transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5"
                            title="Klik untuk mengedit pembahasan"
                          >
                            <span className="line-clamp-3 text-center w-full">{pb}</span>
                            <span className="text-[8px] text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity font-semibold block mt-0.5">✍️ Edit Materi</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleEditPembahasan(date, jam, '')}
                            className="w-full text-center font-normal px-2 py-1.5 rounded border border-dashed border-slate-300 hover:border-emerald-400 bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-700 cursor-pointer transition-all text-[9.5px]"
                            title="Klik untuk menambah pembahasan"
                          >
                            + Isi Materi
                          </button>
                        )}
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
                          <select
                            value={att ? att.status : ''}
                            onChange={(e) => handleQuickUpdate(m.id, date, jam, e.target.value)}
                            className={`text-[11px] font-bold rounded-md px-1 py-1 border transition-all cursor-pointer focus:outline-none focus:ring-1 ${
                              att ? getStatusSelectClass(att.status) : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-200'
                            }`}
                            title={att ? `Status: ${att.status}` : 'Belum absen'}
                          >
                            <option value="">-</option>
                            <option value="hadir">H</option>
                            <option value="sakit">S</option>
                            <option value="izin">I</option>
                            <option value="alpa">A</option>
                            <option value="terlambat">T</option>
                          </select>
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
    </div>
  );
}
