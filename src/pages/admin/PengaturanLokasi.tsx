import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { MapPin, Pen, Navigation, ShieldCheck, HelpCircle } from 'lucide-react';
import Swal from 'sweetalert2';

interface LokasiPreset {
  id: string;
  nama: string;
  koordinat: string;
  radius: string | number;
}

export default function PengaturanLokasi() {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lokasiList, setLokasiList] = useState<LokasiPreset[]>([]);
  
  // Modal states for editing
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<Partial<LokasiPreset>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('getLokasiPreset');
      setLokasiList(res.data || []);
    } catch (err) {
      toast.error('Gagal mengambil data preset lokasi.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (item: LokasiPreset) => {
    setEditingPreset({ ...item });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!editingPreset.nama || !editingPreset.koordinat || !editingPreset.radius) {
      toast.error('Harap isi semua kolom formulir.');
      return;
    }

    const koordinatParts = String(editingPreset.koordinat).split(',');
    if (koordinatParts.length < 2) {
      toast.error('Format koordinat salah. Pisahkan dengan koma.');
      return;
    }

    let latNum = parseFloat(koordinatParts[0].trim());
    let lngNum = parseFloat(koordinatParts[1].trim());

    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      toast.error('Latitude tidak valid.');
      return;
    }

    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      toast.error('Longitude tidak valid.');
      return;
    }

    const radNum = parseFloat(String(editingPreset.radius));

    if (isNaN(radNum) || radNum <= 0) {
      toast.error('Radius harus berupa angka positif.');
      return;
    }

    setIsSubmitting(true);
    Swal.fire({
      title: 'Menyimpan konfigurasi...',
      text: 'Menghubungkan ke database...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      await api.post('updateLokasiPreset', {
        id: editingPreset.id,
        data: {
          nama: editingPreset.nama,
          koordinat: `${latNum}, ${lngNum}`, // Save cleaned format
          radius: radNum
        }
      });
      Swal.close();
      toast.success('Konfigurasi lokasi berhasil diperbarui.');
      setIsModalOpen(false);
      fetchData(); // Reload
    } catch (err: any) {
      Swal.close();
      toast.error('Gagal menyimpan konfigurasi: ' + (err.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <MapPin className="w-6 h-6 text-emerald-600" />
            Batas Radius & Koordinat Presensi
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Atur koordinat pusat Gedung Putra dan Gedung Putri serta batasan jarak radius aman untuk absensi pengajar dan tenaga kependidikan.
          </p>
        </div>
      </div>

      {/* Info Warning Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex gap-4">
        <ShieldCheck className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-900 space-y-1">
          <p className="font-semibold">Perhatian Penting Keamanan Presensi</p>
          <p className="opacity-90 leading-relaxed">
            Sistem merujuk koordinat GPS langsung dari gawai (HP/Laptop) pengajar secara real-time. Jika koordinat di bawah ini diubah, rentang kalkulasi kehadiran <strong>radius 15 meter</strong> akan otomatis merujuk ke titik koordinat baru ini. Harap lakukan verifikasi dengan saksama sebelum menyimpan.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Preset Locations Cards / Table */}
        <div className="lg:col-span-3 bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-lg text-slate-800">Daftar Bangunan & Preset GPS</h3>
            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full">
              {lokasiList.length} Lokasi Terdaftar
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-3"></div>
              Memuat data preset lokasi...
            </div>
          ) : lokasiList.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              Belum ada lokasi yang dikonfigurasi. Hubungkan spreadsheet atau tunggu inisialisasi default.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="p-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Nama Lokasi</th>
                    <th className="p-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Koordinat</th>
                    <th className="p-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Batas Radius</th>
                    <th className="p-4 text-xs font-bold uppercase text-slate-500 tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lokasiList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                            {item.nama.charAt(0)}
                          </div>
                          <span className="font-semibold text-slate-700">{item.nama}</span>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-sm text-slate-600">{item.koordinat}</td>
                      <td className="p-4">
                        <span className="bg-amber-50 text-amber-800 border border-amber-100 px-3 py-1 text-xs font-semibold rounded-full font-mono">
                          {item.radius} Meter
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleEditClick(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 font-semibold rounded-xl text-xs transition-colors"
                        >
                          <Pen className="w-3.5 h-3.5" />
                          Sesuaikan
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Tutorial / Help Center Sidebar */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
          <h4 className="font-bold text-slate-800 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-emerald-600" />
            Panduan Koordinat
          </h4>

          <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
            <div>
              <span className="font-semibold text-slate-700 block mb-1">1. Cari di Google Maps</span>
              Buka <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline hover:text-emerald-700">Google Maps</a>, kemudian navigasikan ke lokasi Ma'had Aly Al-Furqon Magelang.
            </div>

            <div>
              <span className="font-semibold text-slate-700 block mb-1">2. Dapatkan Koordinat</span>
              Klik kanan pada titik bangunan. Angka desimal yang muncul adalah koordinatnya. Salin nilai tersebut (sudah menggunakan pemisah koma).
            </div>

            <div className="bg-white border rounded-xl p-3 space-y-1.5">
              <span className="font-semibold text-slate-700 block text-[11px]">Contoh Nilai Input:</span>
              <p><strong>Koordinat:</strong> -7.5477347, 110.2333963</p>
              <p><strong>Radius:</strong> 15 <span className="text-[10px] text-slate-400 font-normal">(Disarankan 15 s/d 30 meter)</span></p>
            </div>

            <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-100 rounded-xl">
              <p className="font-semibold mb-1 flex items-center gap-1">
                <Navigation className="w-3.5 h-3.5 shrink-0" /> Radius Absensi
              </p>
              Batas radius ideal adalah 15 meter. Hal ini untuk menyaring agar pendidik benar-benar berada di dalam area bangunan fisik saat melakukan clock-in atau clock-out.
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal Custom */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800">Edit Konfigurasi Lokasi</h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 transition-colors text-sm font-semibold p-1"
              >
                Tutup
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">Nama Lokasi/Bangunan</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50 text-slate-500 cursor-not-allowed"
                    value={editingPreset.nama || ''}
                    disabled
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Nama bangunan tidak dapat diubah agar sinkron dengan sistem absensi.</p>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">Koordinat</label>
                  <input
                    type="text"
                    required
                    placeholder="-7.5477347, 110.2333963"
                    className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={editingPreset.koordinat !== undefined ? editingPreset.koordinat : ''}
                    onChange={(e) => setEditingPreset({ ...editingPreset, koordinat: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">Radius Kehadiran Maksimal (Meter)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={100}
                    placeholder="15"
                    className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={editingPreset.radius !== undefined ? editingPreset.radius : ''}
                    onChange={(e) => setEditingPreset({ ...editingPreset, radius: e.target.value })}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Standar toleransi adalah 15M. Maksimal ideal 35M untuk kompensasi GPS kurang stabil.</p>
                </div>
              </div>

              <div className="p-5 border-t border-slate-100 flex gap-3 justify-end bg-slate-50">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-semibold rounded-xl text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
