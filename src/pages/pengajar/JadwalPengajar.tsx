import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Clock } from 'lucide-react';

export default function JadwalPengajar() {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!user?.nama) return;
    try {
      const res = await api.get('getJadwal');
      const myJadwal = (res.data || []).filter((j: any) => j.pengajar === user.nama);
      
      const hariMap: Record<string, number> = {
        'Senin': 1, 'Selasa': 2, 'Rabu': 3, 'Kamis': 4, 'Jumat': 5, 'Sabtu': 6, 'Minggu': 7
      };
      myJadwal.sort((a: any, b: any) => {
        if (hariMap[a.hari] !== hariMap[b.hari]) return hariMap[a.hari] - hariMap[b.hari];
        return (a.jam_mulai || '').localeCompare(b.jam_mulai || '');
      });
      
      setData(myJadwal);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="sm:flex sm:items-center justify-between mb-8">
        <div>
          <h3 className="text-lg font-medium leading-6 text-slate-900">Jadwal Mengajar Saya</h3>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">Daftar semua jadwal perkuliahan Anda dalam seminggu.</p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[800px] w-full divide-y divide-slate-200 text-left">
            <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">Hari</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">Jam</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">Mata Kuliah</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">Program / Kelas</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan={4} className="p-8 text-center text-slate-400">Memuat data...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-slate-400">Belum ada jadwal mengajar.</td></tr>
              ) : (
                data.map((j: any) => (
                  <tr key={j.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{j.hari}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-emerald-600 flex items-center gap-2">
                       <Clock className="w-4 h-4" />
                       {j.jam_mulai} - {j.jam_berakhir} (Jam ke-{j.jam_ke})
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-700">{j.nama_mk}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{j.program} - Kelas {j.kelas}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
