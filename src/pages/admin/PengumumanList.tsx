import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { Pengumuman } from '../../types';
import { Pen, Trash2, Plus, Search, Megaphone, CheckCircle2, AlertTriangle, Paperclip, ExternalLink } from 'lucide-react';
import Swal from 'sweetalert2';
import { formatToIndonesianDate, getTodayIndonesianDate } from '../../utils/time';

const KATEGORI_OPTIONS = ['Akademik', 'Asrama', 'Ujian', 'Administrasi', 'Umum'];

export default function PengumumanList() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState<Pengumuman[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Pengumuman>>({});
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('getPengumuman');
      setData(res.data || []);
    } catch (err: any) {
      toast.error('Gagal mengambil data pengumuman: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    e.preventDefault();
    const action = isEditing ? 'updatePengumuman' : 'addPengumuman';
    
    // Auto-generate current date for new ones if blank
    const payloadData = {
      ...formData,
      tanggal: formatToIndonesianDate(formData.tanggal) || getTodayIndonesianDate(),
      penting: formData.penting === true || formData.penting === 'true'
    };

    Swal.fire({
      title: 'Menyimpan data...',
      text: 'Mohon tunggu sebentar',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      await api.post(action, { id: formData.id, data: payloadData });
      Swal.close();
      toast.success(isEditing ? 'Pengumuman diperbarui' : 'Pengumuman berhasil dipublikasikan');
      setIsModalOpen(false);
      fetchData(); // Reload data
    } catch (err: any) {
      Swal.close();
      toast.error('Gagal menyimpan pengumuman: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Apakah Anda yakin?',
      text: "Pengumuman yang dihapus tidak dapat dikembalikan!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Ya, Hapus!'
    });

    if (result.isConfirmed) {
      Swal.fire({
        title: 'Menghapus data...',
        text: 'Mohon tunggu sebentar',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      try {
        await api.post('deletePengumuman', { id });
        Swal.close();
        toast.success('Pengumuman berhasil dihapus');
        fetchData();
      } catch (err: any) {
        Swal.close();
        toast.error('Gagal menghapus pengumuman: ' + err.message);
      }
    }
  };

  const openAddModal = () => {
    setIsEditing(false);
    setFormData({
      kategori: KATEGORI_OPTIONS[0],
      judul: '',
      isi_lengkap: '',
      penting: false,
      tanggal: getTodayIndonesianDate()
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: Pengumuman) => {
    setIsEditing(true);
    setFormData({
      ...item,
      penting: item.penting === true || item.penting === 'true' || item.penting === 'TRUE'
    });
    setIsModalOpen(true);
  };

  const filteredData = data.filter(item => 
    (item.judul || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.kategori || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.isi_lengkap || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium leading-6 text-slate-900 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-emerald-500" />
            Kelola Pusat Informasi & Pengumuman
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Terbitkan pengumuman resmi akademik asrama, ujian terpadu, dan administrasi pesantren kepada seluruh mahasantri.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-wrap gap-2 items-center">
          <div className="relative flex-grow sm:flex-grow-0 w-full sm:w-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Cari Pengumuman..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 sm:text-sm"
            />
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-2" />
            Buat Pengumuman
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          Tidak ada pengumuman ditemukan. Mulai dengan membuat pengumuman baru!
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded-md">
          <table className="min-w-[800px] w-full divide-y divide-slate-200">
            <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50 w-32">Kategori</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50">Judul Pengumuman</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50 w-36">Tanggal</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50 w-28">Penting</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50 w-40">Lampiran</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50 w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredData.map((item) => {
                const isPenting = item.penting === true || item.penting === 'true' || item.penting === 'TRUE';
                return (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                        item.kategori === 'Ujian' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                        item.kategori === 'Asrama' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                        item.kategori === 'Akademik' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        item.kategori === 'Administrasi' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        'bg-slate-50 text-slate-700 border border-slate-100'
                      }`}>
                        {item.kategori}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-bold text-slate-900">{item.judul}</div>
                        <div className="text-xs text-slate-500 mt-1 line-clamp-2 max-w-xl">{item.isi_lengkap}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">
                      {formatToIndonesianDate(item.tanggal)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {isPenting ? (
                        <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 text-[11px] font-bold px-2 py-0.5 rounded border border-red-100">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          YA
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">Tidak</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {item.file_path ? (
                        <a 
                          href={item.file_path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-md transition-colors"
                          title={item.file_path}
                        >
                          <Paperclip className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-xs font-semibold">Buka Lampiran</span>
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400 font-normal italic">Tidak ada</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="text-emerald-600 hover:text-emerald-900 p-1 hover:bg-emerald-50 rounded"
                          title="Edit"
                        >
                          <Pen className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-900 p-1 hover:bg-rose-50 rounded"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Write/Edit Popup Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-150 animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5 bg-slate-50 shrink-0">
              <Megaphone className="w-5 h-5 text-emerald-500 shrink-0" />
              <h3 className="text-sm sm:text-base font-bold text-slate-800 line-clamp-1">
                {isEditing ? 'Ubah Pengumuman Resmi' : 'Tulis Pengumuman Resmi Baru'}
              </h3>
            </div>
            
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-left">
              <div>
                <label className="block text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wide">Kategori Pengumuman</label>
                <select
                  value={formData.kategori || ''}
                  onChange={e => setFormData({ ...formData, kategori: e.target.value })}
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-xs sm:text-sm p-2 border outline-none font-medium"
                >
                  {KATEGORI_OPTIONS.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
 
              <div>
                <label className="block text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wide">Judul Pengumuman</label>
                <input
                  type="text"
                  required
                  placeholder="Ketik judul pengumuman..."
                  value={formData.judul || ''}
                  onChange={e => setFormData({ ...formData, judul: e.target.value })}
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-xs sm:text-sm p-2 border outline-none font-medium text-slate-800"
                />
              </div>
 
              <div>
                <label className="block text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wide">Tanggal Publikasi</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 24 Mei 2026 atau Hari ini"
                  value={formData.tanggal || ''}
                  onChange={e => setFormData({ ...formData, tanggal: e.target.value })}
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-xs sm:text-sm p-2 border outline-none font-medium text-slate-800"
                />
              </div>
 
              <div>
                <label className="block text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wide">Isi Pengumuman Lengkap</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Ketik isi pengumuman secara menyeluruh di sini..."
                  value={formData.isi_lengkap || ''}
                  onChange={e => setFormData({ ...formData, isi_lengkap: e.target.value })}
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-xs sm:text-sm p-2 border outline-none text-slate-800 leading-relaxed font-normal"
                />
              </div>
 
              <div>
                <label className="block text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wide">Link Lampiran Dokumen (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: https://drive.google.com/xyz atau /dokumen/file.pdf"
                  value={formData.file_path || ''}
                  onChange={e => setFormData({ ...formData, file_path: e.target.value })}
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-xs sm:text-sm p-2 border outline-none font-medium text-slate-800"
                />
              </div>
 
              <div className="flex items-start">
                <input
                  id="penting-checkbox"
                  type="checkbox"
                  checked={formData.penting === true}
                  onChange={e => setFormData({ ...formData, penting: e.target.checked })}
                  className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded cursor-pointer shrink-0"
                />
                <label htmlFor="penting-checkbox" className="ml-2 block text-xs sm:text-sm font-medium text-slate-700 cursor-pointer select-none leading-snug">
                  Lencana Penting (Highlight warna merah bagi mahasantri)
                </label>
              </div>
 
              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-md text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit" disabled={isSubmitting}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 cursor-pointer disabled:opacity-50"
                >
                  {isEditing ? 'Simpan Perubahan' : 'Terbitkan Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
