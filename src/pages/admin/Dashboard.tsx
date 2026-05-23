import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Users, UserSquare2, BookOpen, Clock, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatTimeDisplay } from '../../utils/time';

export default function Dashboard() {
  const [stats, setStats] = useState({
    mahasantri: 0,
    pengajar: 0,
    kelas: 0,
    jadwal: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [trendData, setTrendData] = useState<any[]>([]);
  const [todayJadwal, setTodayJadwal] = useState<any[]>([]);
  const [recentAbsensi, setRecentAbsensi] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const calculateTrend = (absensiData: any[], mahasantriData: any[]) => {
    const daysOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    const result: Record<string, { L: { hadir: number, total: number }, P: { hadir: number, total: number } }> = {};
    daysOrder.forEach(d => {
      result[d] = { L: { hadir: 0, total: 0 }, P: { hadir: 0, total: 0 } };
    });

    const daysMap = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    absensiData.forEach(a => {
      const d = new Date(a.tanggal);
      const dayName = daysMap[d.getDay()];
      if (!result[dayName]) return;

      const m = mahasantriData.find(mhs => mhs.id === a.mahasiswa_id);
      if (!m) return;

      const gender = (m.jenis_kelamin || 'laki-laki').toLowerCase() === 'perempuan' ? 'P' : 'L';
      const isHadir = (a.status || '').toLowerCase() === 'hadir';
      
      result[dayName][gender].total += 1;
      if (isHadir) {
        result[dayName][gender].hadir += 1;
      }
    });

    return daysOrder.map(d => {
      const L_pct = result[d].L.total > 0 ? Math.round((result[d].L.hadir / result[d].L.total) * 100) : 0;
      const P_pct = result[d].P.total > 0 ? Math.round((result[d].P.hadir / result[d].P.total) * 100) : 0;
      return {
        day: d,
        L: L_pct,
        P: P_pct,
        L_text: `${L_pct}% (${result[d].L.hadir}/${result[d].L.total})`,
        P_text: `${P_pct}% (${result[d].P.hadir}/${result[d].P.total})`
      };
    });
  };

  const fetchDashboardData = async () => {
    setRefreshing(true);
    try {
      const [mhs, gr, kl, jd, abs] = await Promise.all([
        api.get('getMahasantri'),
        api.get('getPengajar'),
        api.get('getKelas'),
        api.get('getJadwal'),
        api.get('getAbsensi')
      ]);

      const mahasantriData = mhs.data || [];
      const pengajarData = gr.data || [];
      const kelasData = kl.data || [];
      const jadwalData = jd.data || [];
      const absensiData = abs.data || [];

      setStats({
        mahasantri: mahasantriData.length,
        pengajar: pengajarData.length,
        kelas: kelasData.length,
        jadwal: jadwalData.length
      });

      // Schedules Today
      const daysMap = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const todayName = daysMap[new Date().getDay()];
      const todayJdwl = jadwalData
        .filter((j: any) => j.hari === todayName)
        .sort((a: any, b: any) => String(a.jam_mulai || '').localeCompare(String(b.jam_mulai || '')));
      
      setTodayJadwal(todayJdwl);

      // Trend Data
      setTrendData(calculateTrend(absensiData, mahasantriData));

      // Recent Absensi
      const sortedAbsensi = [...absensiData]
        .sort((a: any, b: any) => {
          if (a.tanggal !== b.tanggal) return b.tanggal.localeCompare(a.tanggal);
          return 0; 
        })
        .slice(0, 5); 
      
      const recentAbs = sortedAbsensi.map((a: any) => {
        const m = mahasantriData.find((mhs: any) => mhs.id === a.mahasiswa_id);
        const absenDayName = daysMap[new Date(a.tanggal).getDay()];
        const jdwl = jadwalData.find((j: any) => 
          j.hari === absenDayName &&
          j.jam_ke === a.jam_ke &&
          j.kelas === a.kelas &&
          j.program === a.program
        );
        return {
          ...a,
          nim: m?.nim || '-',
          nama: m?.nama || 'Unknown',
          nama_mk: jdwl?.nama_mk || '-',
        };
      });

      setRecentAbsensi(recentAbs);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch ((status || '').toLowerCase()) {
      case 'hadir': return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-full text-[10px] font-bold uppercase">Hadir</span>;
      case 'izin': return <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-[10px] font-bold uppercase">Izin</span>;
      case 'sakit': return <span className="px-2 py-0.5 bg-amber-100 text-amber-600 rounded-full text-[10px] font-bold uppercase">Sakit</span>;
      default: return <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-[10px] font-bold uppercase">{status}</span>;
    }
  };

  if (loading) {
    return <div className="animate-pulse space-y-4 h-full">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1,2,3,4].map(i => <div key={i} className="h-24 bg-slate-200 rounded-2xl"></div>)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-64">
        <div className="md:col-span-8 bg-slate-200 rounded-2xl"></div>
        <div className="md:col-span-4 bg-slate-200 rounded-2xl"></div>
      </div>
    </div>;
  }

  return (
    <div className="flex flex-col lg:grid lg:gap-6 lg:grid-cols-12 lg:grid-rows-[auto_1fr_auto] h-auto lg:h-full min-h-0 lg:min-h-[600px] mb-8 lg:mb-0 space-y-6 lg:space-y-0">
      
      {/* Stats Row */}
      <div className="lg:col-span-12 flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="font-bold text-slate-800 text-lg">Ringkasan Statistik</h2>
        <button 
          onClick={fetchDashboardData} 
          disabled={refreshing}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
          {refreshing ? 'Memperbarui...' : 'Refresh'}
        </button>
      </div>

      <div className="lg:col-span-12 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {[
          { name: 'Total Mahasantri', value: stats.mahasantri, icon: Users, colorClass: 'bg-blue-50 text-blue-600' },
          { name: 'Total Pengajar', value: stats.pengajar, icon: UserSquare2, colorClass: 'bg-amber-50 text-amber-600' },
          { name: 'Total Kelas Aktif', value: stats.kelas, icon: BookOpen, colorClass: 'bg-emerald-50 text-emerald-600' },
          { name: 'Jadwal Aktif', value: stats.jadwal, icon: Clock, colorClass: 'bg-rose-50 text-rose-600' }
        ].map((item, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${item.colorClass}`}>
              <item.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider line-clamp-1">{item.name}</p>
              <p className="text-2xl font-bold text-slate-800">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Visual Section */}
      <div className="lg:col-span-8 flex-1 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[300px]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-slate-700">Trend Kehadiran Mingguan</h3>
          <div className="flex gap-2">
            <span className="px-2 sm:px-3 py-1 rounded-full bg-slate-200 text-[10px] font-bold text-slate-600 uppercase">Laki-laki</span>
            <span className="px-2 sm:px-3 py-1 rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-600 uppercase">Perempuan</span>
          </div>
        </div>
        <div className="flex-1 w-full min-h-[160px] flex items-end justify-between px-2 sm:px-6">
          {trendData.map((item, idx) => (
            <div key={idx} className="flex gap-1 sm:gap-2 items-end h-[160px] relative group w-8 sm:w-12 justify-center">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-slate-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none transition-opacity">
                 L: {item.L_text} | P: {item.P_text}
              </div>
              <div style={{ height: `${Math.max(item.L, 5)}%` }} className="w-3 sm:w-4 bg-slate-200 rounded-t-sm transition-all relative"></div>
              <div style={{ height: `${Math.max(item.P, 5)}%` }} className="w-3 sm:w-4 bg-emerald-400 rounded-t-sm transition-all relative"></div>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-4 text-[10px] font-bold text-slate-400 uppercase px-1 sm:px-4">
          <span>Sen</span><span>Sel</span><span>Rab</span><span>Kam</span><span>Jum</span><span>Sab</span><span>Ahd</span>
        </div>
      </div>

      {/* Side Widget: Quick Info */}
      <div className="lg:col-span-4 bg-slate-900 p-6 rounded-2xl shadow-xl shadow-slate-900/20 text-white flex flex-col min-h-[300px]">
        <h3 className="font-bold mb-4">Jadwal Kuliah Hari Ini</h3>
        <div className="space-y-4 overflow-y-auto pr-2 flex-1 scrollbar-thin scrollbar-thumb-slate-700">
          {todayJadwal.length > 0 ? todayJadwal.map((j: any) => (
            <div key={j.id} className="p-3 bg-white/10 rounded-xl border border-white/10">
              <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest">{formatTimeDisplay(j.jam_mulai)} - {formatTimeDisplay(j.jam_berakhir)}</p>
              <p className="font-bold text-sm mt-1">{j.nama_mk} ({j.program} - {j.kelas})</p>
              <p className="text-xs text-slate-400 mt-0.5">{j.pengajar}</p>
            </div>
          )) : (
            <div className="text-sm text-slate-400 italic mt-4">Tidak ada jadwal kuliah hari ini.</div>
          )}
        </div>
      </div>

      {/* Bottom List Section */}
      <div className="lg:col-span-12 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col min-w-0">
        <div className="flex items-center justify-between mb-4 mt-2">
          <h3 className="font-bold text-slate-700">Absensi Terakhir Masuk</h3>
          <Link to="/admin/rekap" className="text-emerald-500 text-xs font-bold hover:underline shrink-0 ml-4">Lihat Semua</Link>
        </div>
        <div className="overflow-x-auto overflow-y-hidden pb-2 -mx-4 sm:-mx-6 px-4 sm:px-6 scrollbar-thin scrollbar-thumb-slate-200">
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100">
                <th className="pb-3 px-2">NIM</th>
              <th className="pb-3 px-2">Mahasantri</th>
              <th className="pb-3 px-2">Kelas</th>
              <th className="pb-3 px-2">Mata Kuliah</th>
              <th className="pb-3 px-2">Status</th>
              <th className="pb-3 px-2 text-right">Tanggal</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {recentAbsensi.length > 0 ? recentAbsensi.map((a: any) => (
              <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td className="py-3 px-2 font-medium text-slate-700">{a.nim}</td>
                <td className="py-3 px-2 text-slate-600">{a.nama}</td>
                <td className="py-3 px-2 text-slate-600">{a.kelas} ({a.program})</td>
                <td className="py-3 px-2 italic text-slate-500">{a.nama_mk}</td>
                <td className="py-3 px-2">{getStatusBadge(a.status)}</td>
                <td className="py-3 px-2 text-right text-slate-400 text-xs mt-1 block">{a.tanggal}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="py-4 text-center text-slate-400 text-sm">Belum ada data absensi.</td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

    </div>
  );
}
