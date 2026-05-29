import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { Mahasantri } from '../../types';
import { Pen, Trash2, Plus, Search } from 'lucide-react';
import Swal from 'sweetalert2';
import { KELAS_OPTIONS, PROGRAM_OPTIONS } from '../../constants';
import ExcelImport from '../../components/ExcelImport';

export default function MahasantriList() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_data, _setData] = useState<Mahasantri[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Mahasantri>>({});
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('getMahasantri');
      _setData(res.data || []);
    } catch (err) {
      toast.error('Gagal mengambil data mahasantri');
    } finally { setIsSubmitting(false); 
      setLoading(false);
    }
  };

  const handleImport = async (data: any[]) => {
    try {
      Swal.fire({
        title: 'Memproses data...',
        text: 'Mohon tunggu sebentar',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const formattedData = data.map(item => ({
        nim: item.nim || item.NIM || item.Nim || '',
        nama: item.nama || item.Nama || item.NAMA || '',
        jenis_kelamin: (item.jenis_kelamin || item['Jenis Kelamin'] || '').toLowerCase().startsWith('l') ? 'laki-laki' : 'perempuan',
        program: item.program || item.Program || PROGRAM_OPTIONS[0],
        kelas: item.kelas || item.Kelas || KELAS_OPTIONS[0],
        status: (item.status || item.Status || 'aktif').toLowerCase()
      }));

      await api.post('bulkAddMahasantri', { data: formattedData });
      Swal.close();
      toast.success(`${formattedData.length} data berhasil diimport`);
      fetchData();
    } catch (err) {
      Swal.close();
      toast.error('Gagal mengimport data');
    } finally { setIsSubmitting(false); }
  };

  const handleSave = async (e: React.FormEvent) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    e.preventDefault();
    const action = isEditing ? 'updateMahasantri' : 'addMahasantri';
    
    Swal.fire({
      title: 'Menyimpan data...',
      text: 'Mohon tunggu sebentar',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      await api.post(action, { id: formData.id, data: formData });
      Swal.close();
      toast.success(isEditing ? 'Data diperbarui' : 'Data ditambahkan');
      setIsModalOpen(false);
      fetchData(); // Reload data
    } catch (err) {
      Swal.close();
      toast.error('Gagal menyimpan data');
    } finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Apakah anda yakin?',
      text: "Data yang dihapus tidak dapat dikembalikan!",
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
        await api.post('deleteMahasantri', { id });
        Swal.close();
        toast.success('Data berhasil dihapus');
        fetchData();
      } catch(err) {
        Swal.close();
        toast.error('Gagal menghapus data');
      }
    }
  };

  const openAddModal = () => {
    setIsEditing(false);
    setFormData({ nim: '', nama: '', jenis_kelamin: 'laki-laki', program: PROGRAM_OPTIONS[0], kelas: KELAS_OPTIONS[0], status: 'aktif' });
    setIsModalOpen(true);
  };

  const openEditModal = (item: Mahasantri) => {
    setIsEditing(true);
    setFormData(item);
    setIsModalOpen(true);
  };

  const filteredData = _data.filter(item => 
    item.nama?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.nim?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium leading-6 text-slate-900">Kelola Data Mahasantri</h3>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">Menampilkan daftar semua mahasantri aktif dan nonaktif.</p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-wrap gap-2 items-center">
          <ExcelImport onImport={handleImport} />
          <div className="relative flex-grow sm:flex-grow-0 w-full sm:w-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Cari NIM atau Nama..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 sm:text-sm"
            />
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Data
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-md">
        <table className="min-w-[800px] w-full divide-y divide-slate-200">
          <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50">NIM</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50">Nama</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50">L/P</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50">Program</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50">Kelas</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {loading ? (
              [1, 2, 3].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-32"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-8"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                  <td className="px-6 py-4"></td>
                </tr>
              ))
            ) : filteredData.length === 0 ? (
              <tr>
                 <td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-500 border-b">Data tidak ditemukan atau kosong.</td>
              </tr>
            ) : (
              filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{item.nim}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{item.nama}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{item.jenis_kelamin === 'perempuan' ? 'P' : 'L'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{item.program}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{item.kelas}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${item.status === 'aktif' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button onClick={() => openEditModal(item)} className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 p-1.5 rounded-md"><Pen className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900 bg-red-50 p-1.5 rounded-md"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-slate-500 bg-opacity-75 transition-opacity" onClick={() => setIsModalOpen(false)}></div>
            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
              <form onSubmit={handleSave}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-medium leading-6 text-slate-900 mb-4">
                    {isEditing ? 'Edit Data Mahasantri' : 'Tambah Mahasantri Baru'}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">NIM</label>
                      <input type="text" required value={formData.nim || ''} onChange={e => setFormData({...formData, nim: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Nama Lengkap</label>
                      <input type="text" required value={formData.nama || ''} onChange={e => setFormData({...formData, nama: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Jenis Kelamin</label>
                      <select value={formData.jenis_kelamin || 'laki-laki'} onChange={e => setFormData({...formData, jenis_kelamin: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border">
                        <option value="laki-laki">Laki-laki</option>
                        <option value="perempuan">Perempuan</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Program</label>
                        <select value={formData.program || PROGRAM_OPTIONS[0]} onChange={e => setFormData({...formData, program: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border">
                          {PROGRAM_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Kelas</label>
                        <select value={formData.kelas || KELAS_OPTIONS[0]} onChange={e => setFormData({...formData, kelas: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border">
                          {KELAS_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Status</label>
                      <select value={formData.status || 'aktif'} onChange={e => setFormData({...formData, status: e.target.value as any})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border">
                        <option value="aktif">Aktif</option>
                        <option value="nonaktif">Nonaktif</option>
                        <option value="lulus">Lulus</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button type="submit" disabled={isSubmitting} className="inline-flex w-full justify-center rounded-md border border-transparent bg-emerald-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-emerald-700 sm:ml-3 sm:w-auto sm:text-sm">{isSubmitting ? "Menyimpan..." : "Simpan"}</button>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="mt-3 inline-flex w-full justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-base font-medium text-slate-700 shadow-sm hover:bg-slate-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
