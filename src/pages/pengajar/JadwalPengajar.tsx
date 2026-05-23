import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Clock, Calendar } from 'lucide-react';
import { formatTimeDisplay } from '../../utils/time';

export default function JadwalPengajar() {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user?.nama) return;
    try {
      const res = await api.get('getJadwal');
      
      const normalizedSchedules = (res.data || []).map((j: any) => ({
        ...j,
        program: j.program || 'I\'dad Lughowi',
        kelas: j.kelas || 'Semester 2 - Putra',
        nama_mk: j.nama_mk || j.matakuliah || '',
        jam_berakhir: j.jam_berakhir || j.jam_selesai || ''
      }));

      const myJadwal = normalizedSchedules.filter((j: any) => {
        const jp = String(j.pengajar || '').trim().toLowerCase();
        const un = String(user.nama || '').trim().toLowerCase();
        if (jp === un && jp !== '') return true;
        
        const clean = (s: string) => s.replace(/\./g, '').replace(/ustadz|ustazah|ust|ustad/gi, '').replace(/\s+/g, '').trim();
        return clean(jp) === clean(un) && clean(jp) !== '';
      });
      
      const hariMap: Record<string, number> = {
        'Senin': 1, 'Selasa': 2, 'Rabu': 3, 'Kamis': 4, 'Jumat': 5, 'Sabtu': 6, 'Minggu': 7
      };
      myJadwal.sort((a: any, b: any) => {
        const aHari = String(a.hari || '').trim();
        const bHari = String(b.hari || '').trim();
        // Capitalize for map check
        const aCap = aHari.charAt(0).toUpperCase() + aHari.slice(1).toLowerCase();
        const bCap = bHari.charAt(0).toUpperCase() + bHari.slice(1).toLowerCase();
        
        if (hariMap[aCap] !== hariMap[bCap]) return (hariMap[aCap] || 99) - (hariMap[bCap] || 99);
        return String(a.jam_mulai || '').localeCompare(String(b.jam_mulai || ''));
      });
      
      setData(myJadwal);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const daysOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
  const groupedData = daysOrder
    .map(day => ({
      day,
      schedules: data.filter((j: any) => {
        const jh = String(j.hari || '').trim().toLowerCase();
        const dy = day.toLowerCase();
        return jh === dy;
      })
    }))
    .filter(g => g.schedules.length > 0);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="sm:flex sm:items-center justify-between mb-8">
        <div>
          <h3 className="text-lg font-medium leading-6 text-slate-900">Jadwal Mengajar Saya</h3>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">Daftar semua jadwal perkuliahan Anda dalam seminggu, dikelompokkan berdasarkan hari.</p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-12 text-center rounded-lg border border-slate-200 text-slate-400">
          Memuat data...
        </div>
      ) : groupedData.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-lg border border-slate-200 text-slate-400">
          Belum ada jadwal mengajar.
        </div>
      ) : (
        <div className="space-y-8">
          {groupedData.map((group) => (
            <div key={group.day} className="bg-white shadow rounded-lg border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-bold text-slate-800 text-lg">Hari {group.day}</h4>
                </div>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/50 px-3 py-1 rounded-full">
                  {group.schedules.length} Mata Kuliah
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-[800px] w-full divide-y divide-slate-200 text-left">
                  <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/50 w-1/4">Jam</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/50 w-2/4">Mata Kuliah</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/50 w-1/4">Program / Kelas</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {group.schedules.map((j: any) => (
                      <tr key={j.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-emerald-600 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {formatTimeDisplay(j.jam_mulai)} - {formatTimeDisplay(j.jam_berakhir)} (Jam ke-{j.jam_ke})
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800">
                          {j.nama_mk}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                          {j.program} - {j.kelas}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
