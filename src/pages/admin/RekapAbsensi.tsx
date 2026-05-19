import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { Search, Download, Filter, Calendar, BookOpen, Users, Compass } from 'lucide-react';
import { Mahasantri, Jadwal, Absensi, Matakuliah, Kelas } from '../../types';
import { PROGRAM_OPTIONS } from '../../constants';

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
  
  // Data yang ditampilkan di tabel
  const [displayedData, setDisplayedData] = useState<any[]>([]);

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

  const formatDateIndonesian = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const day = days[date.getDay()];
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${day}, ${d}/${m}/${y}`;
  };

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[date.getDay()];
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
      
      // Filter the absensi by bulan and program
      const monthPrefix = selectedBulan; // format YYYY-MM
      
      const filteredByMonth = allAbsensi.filter(a => 
        a.tanggal && 
        a.tanggal.startsWith(monthPrefix) &&
        a.program === selectedProgram
      );
      
      const matchedData: any[] = [];
      
      filteredByMonth.forEach(absen => {
        // Only process for the selected Kelas
        if (absen.kelas !== selectedKelas) return;
        
        // Find mapped Jadwal based on hari, jam_ke, kelas, program
        const dayName = getDayName(absen.tanggal);
        const relatedJadwal = jadwal.find(j => 
          j.hari === dayName && 
          j.jam_ke === absen.jam_ke && 
          j.kelas === absen.kelas && 
          j.program === absen.program
        );
        
        // Match Matkul name from relatedJadwal
        if (relatedJadwal && relatedJadwal.nama_mk === selectedMatkul) {
          const mhs = mahasantri.find(m => m.id === absen.mahasiswa_id);
          matchedData.push({
            ...absen,
            nim: mhs?.nim || '-',
            nama: mhs?.nama || 'Unknown'
          });
        }
      });
      
      // Sort by tanggal then jam_ke then NIM
      matchedData.sort((a, b) => {
        if (a.tanggal !== b.tanggal) return a.tanggal.localeCompare(b.tanggal);
        if (a.jam_ke !== b.jam_ke) return parseInt(a.jam_ke) - parseInt(b.jam_ke);
        return a.nim.localeCompare(b.nim);
      });
      
      setDisplayedData(matchedData);
      
      if (matchedData.length === 0) {
        toast('Tidak ada data absensi untuk filter tersebut.', { icon: 'ℹ️' });
      }
      
    } catch (err) {
      toast.error('Gagal mengambil data absensi');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'hadir': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-emerald-100 text-emerald-800 border-emerald-200">Hadir</span>;
      case 'izin': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-blue-100 text-blue-800 border-blue-200">Izin</span>;
      case 'sakit': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-amber-100 text-amber-800 border-amber-200">Sakit</span>;
      default: return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-red-100 text-red-800 border-red-200">{status}</span>;
    }
  };

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
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50">NIM</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50">Nama Lengkap</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50">Tanggal</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50">Jam Ke</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50">Status Kehadiran</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {loading ? (
              [1, 2, 3].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-48"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-8 mx-auto"></div></td>
                  <td className="px-6 py-4"><div className="h-6 bg-slate-200 rounded-full w-20 mx-auto"></div></td>
                </tr>
              ))
            ) : displayedData.length === 0 ? (
              <tr>
                 <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-500">
                   {isFetchingInitial ? 'Memuat data awal...' : 'Tidak ada data absensi untuk filter yang dipilih. Silakan klik Tampilkan Rekap.'}
                 </td>
              </tr>
            ) : (
              displayedData.map((d, index) => (
                <tr key={`${d.id}-${index}`} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{d.nim}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{d.nama}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{formatDateIndonesian(d.tanggal)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 text-center">{d.jam_ke}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                    {getStatusBadge(d.status)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
