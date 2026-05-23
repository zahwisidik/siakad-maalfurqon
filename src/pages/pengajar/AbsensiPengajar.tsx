import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { Mahasantri, Jadwal, Matakuliah } from '../../types';
import { format } from 'date-fns';
import Swal from 'sweetalert2';
import { BookOpen, Users, Calendar, Clock, Compass } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PROGRAM_OPTIONS } from '../../constants';

export default function AbsensiPengajar() {
  const { user } = useAuth();
  const [jadwalList, setJadwalList] = useState<Jadwal[]>([]);
  const [matakuliahList, setMatakuliahList] = useState<Matakuliah[]>([]);
  
  // Form Filters
  const [selectedProgram, setSelectedProgram] = useState(PROGRAM_OPTIONS[0]);
  const [selectedMatkul, setSelectedMatkul] = useState('');
  const [selectedKelas, setSelectedKelas] = useState('');
  const [selectedTanggal, setSelectedTanggal] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedJamKe, setSelectedJamKe] = useState('');

  const [mahasantri, setMahasantri] = useState<Mahasantri[]>([]);
  const [absensi, setAbsensi] = useState<Record<string, string>>({});
  const [pembahasan, setPembahasan] = useState('');
  const [loadingForm, setLoadingForm] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDataShown, setIsDataShown] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, [user]);

  const fetchInitialData = async () => {
    if (!user?.nama) return;
    try {
      const [resJdwl, resMk] = await Promise.all([
        api.get('getJadwal'),
        api.get('getMatakuliah')
      ]);
      const myMk = (resMk.data || []).filter((m: any) => {
        const mp = String(m.pengajar || '').trim().toLowerCase();
        const un = String(user.nama || '').trim().toLowerCase();
        return mp === un && mp !== '';
      });
      const myJdwl = (resJdwl.data || []).filter((j: any) => {
        const jp = String(j.pengajar || '').trim().toLowerCase();
        const un = String(user.nama || '').trim().toLowerCase();
        return jp === un && jp !== '';
      });
      
      setMatakuliahList(myMk);
      setJadwalList(myJdwl);
      
      const defaultProgram = PROGRAM_OPTIONS[0];
      const filteredMk = myMk.filter((m: any) => m.program === defaultProgram);
      if (filteredMk.length > 0) setSelectedMatkul(filteredMk[0].nama_mk);
    } catch (error) {
      toast.error('Gagal mengambil data referensi');
    } finally {
      setLoadingForm(false);
    }
  };

  // derived options based on selection
  const availableKelas = Array.from(new Set(
    matakuliahList.filter(m => m.nama_mk === selectedMatkul && m.program === selectedProgram).map(m => m.kelas)
  ));
  
  // When matkul changes, reset kelass if not available
  useEffect(() => {
    if (availableKelas.length > 0 && !availableKelas.includes(selectedKelas)) {
      setSelectedKelas(availableKelas[0]);
    }
  }, [selectedMatkul, availableKelas]);

  // When class and date changes, try to guess the jam_ke from schedule
  useEffect(() => {
    if (selectedTanggal && selectedKelas && selectedMatkul) {
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const dayName = days[new Date(selectedTanggal).getDay()];
      
      const relatedJadwal = jadwalList.find(j => 
        j.hari === dayName && 
        j.kelas === selectedKelas &&
        j.nama_mk === selectedMatkul
      );
      
      if (relatedJadwal) {
        setSelectedJamKe(relatedJadwal.jam_ke.toString());
      } else {
        setSelectedJamKe('1'); // fallback
      }
    }
  }, [selectedTanggal, selectedKelas, selectedMatkul, jadwalList]);

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

  const handleTampilkanSiswa = async () => {
    if (!selectedMatkul || !selectedKelas || !selectedTanggal || !selectedJamKe) {
        toast.error("Mohon lengkapi semua filter.");
        return;
    }
    
    setLoadingData(true);
    setIsDataShown(true);
    try {
      const relatedMk = matakuliahList.find(m => m.nama_mk === selectedMatkul && m.kelas === selectedKelas);
      const program = relatedMk ? relatedMk.program : '';

      const res = await api.get('getMahasantri');
      const filtered = (res.data || []).filter((m: Mahasantri) => 
        m.kelas === selectedKelas && 
        (!program || m.program === program) && 
        m.status === 'aktif'
      );
      
      setMahasantri(filtered);
      setPembahasan('');
      
      const initAbs: Record<string, string> = {};
      filtered.forEach((m: Mahasantri) => {
        initAbs[m.id] = 'hadir';
      });
      setAbsensi(initAbs);
    } catch (error) {
       toast.error('Gagal mengambil data siswa');
    } finally {
      setLoadingData(false);
    }
  };

  const handleChangeStatus = (mId: string, status: string) => {
    setAbsensi(prev => ({...prev, [mId]: status}));
  };

  const handleSaveAbsensi = async () => {
    if (mahasantri.length === 0) return;
    setSaving(true);
    
    Swal.fire({
      title: 'Menyimpan absensi...',
      text: 'Mohon tunggu sebentar',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });
    
    const payload = Object.keys(absensi).map(mId => ({
      tanggal: selectedTanggal,
      jam_ke: selectedJamKe.toString(),
      nama_mk: selectedMatkul,
      program: selectedProgram,
      kelas: selectedKelas,
      mahasiswa_id: mId,
      status: absensi[mId],
      pembahasan: pembahasan
    }));

    try {
      await api.post('saveAbsensi', { data: payload });
      Swal.close();
      toast.success('Data absensi berhasil disimpan!');
      setIsDataShown(false);
    } catch (error) {
      Swal.close();
      toast.error('Gagal menyimpan absensi');
    } finally {
      setSaving(false);
    }
  };

  const statusOptions = ['hadir', 'sakit', 'izin', 'alpa', 'terlambat'];
  const statusColors: Record<string, string> = {
    hadir: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    sakit: 'bg-blue-100 text-blue-800 border-blue-200',
    izin: 'bg-amber-100 text-amber-800 border-amber-200',
    alpa: 'bg-red-100 text-red-800 border-red-200',
    terlambat: 'bg-purple-100 text-purple-800 border-purple-200',
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Input Absensi Kelas</h2>
        <p className="text-slate-500 text-sm">Pilih jadwal dan lengkapi form untuk memulai presensi.</p>
      </div>

      <div className="bg-white shadow rounded-lg border border-slate-200 p-6">
        {loadingForm ? (
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            <div className="h-10 bg-slate-200 rounded w-full"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
            <div className="lg:col-span-1">
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

            <div className="lg:col-span-1">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Mata Kuliah</label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <select 
                  value={selectedMatkul}
                  onChange={(e) => setSelectedMatkul(e.target.value)}
                  className="pl-10 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2.5 border bg-white"
                >
                  {Array.from(new Set(matakuliahList.filter(m => m.program === selectedProgram).map(m => m.nama_mk))).map(mk => (
                    <option key={mk} value={mk}>{mk}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="lg:col-span-1">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Kelas</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <select 
                  value={selectedKelas}
                  onChange={(e) => setSelectedKelas(e.target.value)}
                  className="pl-10 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2.5 border bg-white"
                >
                  {availableKelas.map(k => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="lg:col-span-1">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tanggal</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  type="date"
                  value={selectedTanggal}
                  onChange={(e) => setSelectedTanggal(e.target.value)}
                  className="pl-10 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2.5 border bg-white"
                />
              </div>
            </div>

            <div className="lg:col-span-1">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Jam Ke</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  type="number"
                  min="1"
                  max="10"
                  value={selectedJamKe}
                  onChange={(e) => setSelectedJamKe(e.target.value)}
                  className="pl-10 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2.5 border bg-white"
                />
              </div>
            </div>

            <div className="lg:col-span-1">
              <button 
                onClick={handleTampilkanSiswa}
                className="w-full inline-flex items-center justify-center rounded-md border border-transparent bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 transition-colors"
              >
                Tampilkan Siswa
              </button>
            </div>
          </div>
        )}
      </div>

      {isDataShown && (
        <div className="bg-white shadow rounded-lg border border-slate-200">
          <div className="bg-slate-50 px-6 py-4 flex justify-between items-center border-b border-slate-200">
            <h3 className="font-bold text-slate-700">Daftar Mahasantri ({mahasantri.length} orang) - {formatDateIndonesian(selectedTanggal)}</h3>
          </div>
          <div className="overflow-x-auto w-full">
            <table className="min-w-[700px] w-full divide-y divide-slate-200">
              <thead className="bg-white sticky top-0 z-10 shadow-sm border-b">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider bg-white">No / NIM</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider bg-white">Nama Lengkap</th>
                  <th className="px-4 sm:px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider bg-white">Kehadiran</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {loadingData ? (
                   <tr><td colSpan={3} className="p-8 text-center text-slate-400">Loading data siswa...</td></tr>
                ) : mahasantri.length === 0 ? (
                   <tr><td colSpan={3} className="p-8 text-center text-slate-400">Belum ada mahasantri aktif di kelas ini.</td></tr>
                ) : mahasantri.map((m, idx) => (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                      <span className="text-slate-400 mr-2">{idx + 1}.</span>
                      <span className="text-slate-600 font-mono">{m.nim}</span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800">{m.nama}</td>
                    <td className="px-4 sm:px-6 py-4 text-center">
                      <div className="inline-flex flex-wrap justify-center rounded-md gap-1 sm:shadow-sm sm:gap-0" role="group">
                        {statusOptions.map(opt => (
                          <button
                            key={opt}
                            onClick={() => handleChangeStatus(m.id, opt)}
                            className={`px-2 sm:px-3 py-1.5 text-xs font-medium border rounded-md sm:first:rounded-none sm:first:rounded-l-lg sm:last:rounded-none sm:last:rounded-r-lg capitalize transition-colors
                              ${absensi[m.id] === opt 
                                ? statusColors[opt] 
                                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                              }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-6 border-t border-slate-200 bg-slate-50/50">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Jurnal Pembahasan / Materi Perkuliahan
            </label>
            <textarea
              rows={3}
              value={pembahasan}
              onChange={(e) => setPembahasan(e.target.value)}
              placeholder="Tuliskan pokok pembahasan, submateri, atau catatan khusus perkuliahan hari ini..."
              className="block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-3 border bg-white"
            />
          </div>
          <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end">
            <button 
              disabled={saving || loadingData || mahasantri.length === 0}
              onClick={handleSaveAbsensi} 
              className="bg-emerald-600 text-white px-8 py-2.5 rounded-lg font-bold hover:bg-emerald-700 shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all"
            >
              {saving ? 'Menyimpan...' : 'Simpan Presensi'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
