import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { BookOpen } from 'lucide-react';

export default function MatakuliahPengajar() {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!user?.nama) return;
    try {
      const res = await api.get('getMatakuliah');
      const myMk = (res.data || []).filter((m: any) => m.pengajar === user.nama);
      setData(myMk);
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
          <h3 className="text-lg font-medium leading-6 text-slate-900">Mata Kuliah Yang Diampu</h3>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">Daftar semua mata kuliah dan kelas yang Anda ampu semester ini.</p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[800px] w-full divide-y divide-slate-200 text-left">
            <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">Kode</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">Mata Kuliah</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center bg-slate-50">SKS</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">Program</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">Kelas</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400">Memuat data...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400">Belum ada mata kuliah yang diampu.</td></tr>
              ) : (
                data.map((m: any) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">{m.kode}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 flex items-center gap-2">
                       <BookOpen className="w-4 h-4 text-emerald-500" />
                       {m.nama_mk}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 text-center font-bold">{m.sks}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{m.program}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-700">{m.kelas}</td>
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
