import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FileText, Plus, Search, Edit2, Trash2, Download, ExternalLink } from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '../../services/api';

interface Dokumen {
  id: string;
  nama: string;
  file_path: string;
}

export default function DokumenList() {
  const [data, setData] = useState<Dokumen[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Dokumen>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get('getDokumen');
      if (response && response.data) {
        setData(response.data);
      }
    } catch (e: any) {
      toast.error('Gagal memuat dokumen: ' + (e.message || e));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama?.trim()) {
      toast.error('Nama dokumen wajib diisi!');
      return;
    }
    if (!formData.file_path?.trim()) {
      toast.error('Tautan berkas wajib diisi!');
      return;
    }

    Swal.fire({
      title: 'Menyimpan data...',
      text: 'Mohon tunggu sebentar',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      if (isEditing && formData.id) {
        await api.post('updateDokumen', {
          id: formData.id,
          data: {
            nama: formData.nama.trim(),
            file_path: formData.file_path.trim()
          }
        });
        toast.success('Dokumen berhasil diperbarui');
      } else {
        await api.post('addDokumen', {
          data: {
            nama: formData.nama.trim(),
            file_path: formData.file_path.trim()
          }
        });
        toast.success('Dokumen baru berhasil ditambahkan');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error('Gagal menyimpan dokumen: ' + (err.message || err));
    } finally {
      Swal.close();
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Apakah Anda yakin?',
      text: 'Dokumen ini akan dihapus permanen dari portal dan database!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Ya, Hapus!',
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
        await api.post('deleteDokumen', { id });
        toast.success('Dokumen berhasil dihapus dari portal');
        fetchData();
      } catch (err: any) {
        toast.error('Gagal menghapus dokumen: ' + (err.message || err));
      } finally {
        Swal.close();
      }
    }
  };

  const openAddModal = () => {
    setIsEditing(false);
    setFormData({
      nama: '',
      file_path: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: Dokumen) => {
    setIsEditing(true);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const filteredData = data.filter((doc) =>
    doc.nama.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search and Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </span>
          <input
            type="text"
            placeholder="Cari nama dokumen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all outline-none"
          />
        </div>
        <button
          onClick={openAddModal}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-sm hover:shadow transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Tambah Dokumen
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-600" />
          <h2 className="font-bold text-slate-800 text-sm">Daftar Dokumen Portal Mahasantri</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-150 text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr className="divide-x divide-slate-150 border-b border-slate-150">
                <th scope="col" className="px-3 py-2.5 text-center w-12">No</th>
                <th scope="col" className="px-4 py-2.5 text-left">Nama Dokumen</th>
                <th scope="col" className="px-4 py-2.5 text-left">Tautan / File Path</th>
                <th scope="col" className="px-3 py-2.5 text-center w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 bg-white text-slate-700 font-medium">
              {filteredData.map((doc, index) => (
                <tr key={doc.id} className="divide-x divide-slate-150 hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-4 text-center font-mono font-bold text-slate-400">
                    {index + 1}
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-bold text-slate-800 text-[13px]">{doc.nama}</p>
                  </td>
                  <td className="px-4 py-4 text-slate-500 break-all font-mono text-[11px]">
                    <a
                      href={doc.file_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-emerald-600 hover:underline"
                    >
                      {doc.file_path}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                  <td className="px-3 py-4 text-center whitespace-nowrap">
                    <div className="inline-flex gap-2 justify-center">
                      <button
                        onClick={() => openEditModal(doc)}
                        className="p-1.5 bg-sky-50 text-sky-600 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors cursor-pointer"
                        title="Edit Dokumen"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Dokumen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400 italic font-normal text-sm">
                    {searchTerm ? 'Tidak ada dokumen yang sesuai dengan kata kunci pencarian.' : 'Belum ada dokumen yang didaftarkan. Klik tombol Tambah Dokumen untuk menambahkan.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-emerald-700 to-slate-905 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {isEditing ? 'Edit Dokumen Akademik' : 'Tambah Dokumen Akademik Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-slate-600 text-xs font-bold uppercase mb-1.5">Nama Dokumen</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Kalender Akademik 2025/2026"
                  value={formData.nama || ''}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 text-xs font-bold uppercase mb-1.5">Tautan Dokumen (Google Drive/URL)</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: /dokumen/kalender_akademik.pdf atau URL G-Drive"
                  value={formData.file_path || ''}
                  onChange={(e) => setFormData({ ...formData, file_path: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1 font-normal leading-relaxed">
                  Masukkan tautan publik Google Drive atau path file (misal: <code className="bg-slate-100 px-1 py-0.5 rounded text-[9px] text-slate-600">/dokumen/nama_file.pdf</code>).
                </p>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-105">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-150 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  {isEditing ? 'Simpan Perubahan' : 'Tambah Dokumen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
