import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Clock, Users, CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatTimeDisplay } from '../../utils/time';

export default function DashboardPengajar() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ matakuliah: 0, kelas: 0, sks: 0 });
  const [todayJadwal, setTodayJadwal] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [user]);

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

  if (loading) return <div className="animate-pulse p-4 sm:p-8 space-y-4 max-w-7xl mx-auto"><div className="h-8 bg-slate-200 rounded w-1/4"></div><div className="grid grid-cols-1 sm:grid-cols-3 gap-4"><div className="h-24 bg-slate-200 rounded"></div><div className="h-24 bg-slate-200 rounded"></div><div className="h-24 bg-slate-200 rounded"></div></div></div>;

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Ahlan wa Sahlan, {user?.nama}</h2>
          <p className="text-slate-500 text-sm mt-1">Berikut adalah ringkasan aktivitas mengajar Anda semester ini.</p>
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
                <Link to="/absensi-pengajar" className="shrink-0 px-4 py-2 bg-white text-emerald-600 font-semibold text-sm rounded-lg border border-emerald-200 hover:bg-emerald-600 hover:text-white transition-colors">
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
    </div>
  );
}
