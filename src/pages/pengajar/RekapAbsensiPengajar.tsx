import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { Calendar, BookOpen, Users, Edit, Trash2, Check, X, Compass } from 'lucide-react';
import { Mahasantri, Absensi, Matakuliah, Kelas, Jadwal } from '../../types';
import { PROGRAM_OPTIONS } from '../../constants';

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
  const [displayedData, setDisplayedData] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<string>('');

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
      
      const myMk = (resMk.data || []).filter((m: any) => m.pengajar === user?.nama);
      const myJadwal = (resJdwl.data || []).filter((j: any) => j.pengajar === user?.nama);
      
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

  const getDayName = (dateStr: string) => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[new Date(dateStr).getDay()];
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

  const tampilkanRekap = async () => {
    if (!selectedMatkul || !selectedKelas || !selectedBulan) {
      toast.error("Harap lengkapi semua filter");
      return;
    }
    
    setLoading(true);
    try {
      const resAbs = await api.get('getAbsensi');
      const allAbsensi: Absensi[] = resAbs.data || [];
      
      const monthPrefix = selectedBulan;
      const filteredByMonth = allAbsensi.filter(a => 
        a.tanggal && 
        a.tanggal.startsWith(monthPrefix) &&
        a.program === selectedProgram
      );
      
      const matchedData: any[] = [];
      
      filteredByMonth.forEach(absen => {
        if (absen.kelas === selectedKelas && absen.nama_mk === selectedMatkul) {
          const mhs = mahasantri.find(m => m.id === absen.mahasiswa_id);
          matchedData.push({
            ...absen,
            nim: mhs?.nim || '-',
            nama: mhs?.nama || 'Unknown'
          });
        }
      });
      
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

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setEditStatus(item.status);
  };

  const handleSaveEdit = async (id: string, itemData: any) => {
    try {
      setLoading(true);
      // Simplify payload to only update the status field for better compatibility
      await api.post('updateAbsensi', { 
        id, 
        data: { 
          status: editStatus,
          timestamp: new Date().toISOString() 
        } 
      });
      toast.success('Absensi berhasil diperbarui');
      setEditingId(null);
      tampilkanRekap(); // refresh
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Gagal memperbarui absensi';
      toast.error('Gagal memperbarui: ' + msg);
      setLoading(false);
      console.error(err);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Hapus data absensi?',
      text: 'Anda tidak dapat mengembalikan data yang sudah dihapus!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      Swal.fire({
        title: 'Menghapus data...',
        text: 'Mohon tunggu sebentar',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      try {
        await api.post('deleteAbsensi', { id });
        Swal.close();
        toast.success('Data berhasil dihapus');
        tampilkanRekap(); // refresh
      } catch(err) {
        Swal.close();
        toast.error('Gagal menghapus data');
      }
    }
  };

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
        <table className="min-w-[900px] w-full divide-y divide-slate-200">
          <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50">NIM</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50">Nama Lengkap</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50">Tanggal</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50">Jam Ke</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50">Status Kehadiran</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-48"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-8 mx-auto"></div></td>
                  <td className="px-6 py-4"><div className="h-6 bg-slate-200 rounded-full w-20 mx-auto"></div></td>
                  <td className="px-6 py-4"><div className="h-6 bg-slate-200 rounded-full w-12 mx-auto"></div></td>
                </tr>
              ))
            ) : displayedData.length === 0 ? (
              <tr>
                 <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
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
                    {editingId === d.id ? (
                      <select 
                        value={editStatus} 
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="text-sm p-1 border rounded bg-white outline-none"
                      >
                        <option value="hadir">Hadir</option>
                        <option value="izin">Izin</option>
                        <option value="sakit">Sakit</option>
                        <option value="alfa">Alfa</option>
                        <option value="terlambat">Terlambat</option>
                      </select>
                    ) : (
                      getStatusBadge(d.status)
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    {editingId === d.id ? (
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleSaveEdit(d.id, d)} className="text-emerald-600 hover:text-emerald-900">
                          <Check className="h-4 w-4" />
                        </button>
                        <button onClick={handleCancelEdit} className="text-slate-400 hover:text-slate-600">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleEdit(d)} className="text-blue-600 hover:text-blue-900" title="Edit">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(d.id)} className="text-red-600 hover:text-red-900" title="Hapus">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
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
