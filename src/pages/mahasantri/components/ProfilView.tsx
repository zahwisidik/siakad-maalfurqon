import React, { useState, useRef } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  GraduationCap, 
  Camera, 
  Compass, 
  CheckCircle2, 
  RefreshCw, 
  LogOut, 
  X,
  Users,
  MapPin,
  ShieldAlert,
  Save,
  BookOpen,
  UserCheck,
  Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

interface ProfilViewProps {
  user: any;
  onUpdateProfile: (updatedData: any) => void;
  onLogout: () => void;
}

export default function ProfilView({ user, onUpdateProfile, onLogout }: ProfilViewProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tabs state
  const [activeTab, setActiveTab] = useState<'akademik' | 'identitas' | 'alamat' | 'orangtua'>('akademik');

  // Sub-tabs for parent data ('ayah' | 'ibu' | 'wali')
  const [activeParentTab, setActiveParentTab] = useState<'ayah' | 'ibu' | 'wali'>('ayah');

  // PROFIL PHOTO (Avatar Editor)
  const [avatarSrc, setAvatarSrc] = useState<string | null>(user?.avatar || null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [tempPhoto, setTempPhoto] = useState<string | null>(null);

  // FORM STATES (Bound to user properties, defaults to empty strings)
  
  // 1. Data Akademik
  const [nama, setNama] = useState(user?.nama || '');
  const [nim, setNim] = useState(user?.nim || '');
  const [program, setProgram] = useState(user?.program || '');
  const [tahunMasuk, setTahunMasuk] = useState(user?.tahun_masuk || '');
  const [status, setStatus] = useState(user?.status || 'Aktif');

  // 2. Identitas
  const [tempatLahir, setTempatLahir] = useState(user?.tempat_lahir || '');
  const [tanggalLahir, setTanggalLahir] = useState(user?.tanggal_lahir || '');
  const [jenisKelamin, setJenisKelamin] = useState(user?.jenis_kelamin || '');
  const [kewarganegaraan, setKewarganegaraan] = useState(user?.kewarganegaraan || '');
  const [agama, setAgama] = useState(user?.agama || '');
  const [nik, setNik] = useState(user?.nik || '');
  const [nisn, setNisn] = useState(user?.nisn || '');
  const [phone, setPhone] = useState(user?.no_hp || '');
  const [email, setEmail] = useState(user?.email || '');
  const [jenisTinggal, setJenisTinggal] = useState(user?.jenis_tinggal || '');

  // 3. Alamat
  const [jalan, setJalan] = useState(user?.jalan || '');
  const [rtRw, setRtRw] = useState(user?.rt_rw || '');
  const [dukuh, setDukuh] = useState(user?.dukuh || '');
  const [kelurahan, setKelurahan] = useState(user?.kelurahan || '');
  const [kecamatan, setKecamatan] = useState(user?.kecamatan || '');
  const [kabupaten, setKabupaten] = useState(user?.kabupaten || '');
  const [provinsi, setProvinsi] = useState(user?.provinsi || '');
  const [kodePos, setKodePos] = useState(user?.kode_pos || '');

  // 4. Orang Tua/Wali - Ayah
  const [namaAyah, setNamaAyah] = useState(user?.nama_ayah || '');
  const [nikAyah, setNikAyah] = useState(user?.nik_ayah || '');
  const [tanggalLahirAyah, setTanggalLahirAyah] = useState(user?.tanggal_lahir_ayah || '');
  const [pendidikanAyah, setPendidikanAyah] = useState(user?.pendidikan_ayah || '');
  const [pekerjaanAyah, setPekerjaanAyah] = useState(user?.pekerjaan_ayah || '');
  const [penghasilanAyah, setPenghasilanAyah] = useState(user?.penghasilan_ayah || '');

  // Orang Tua/Wali - Wali
  const [namaWali, setNamaWali] = useState(user?.nama_wali || '');
  const [nikWali, setNikWali] = useState(user?.nik_wali || '');
  const [tanggalLahirWali, setTanggalLahirWali] = useState(user?.tanggal_lahir_wali || '');
  const [pendidikanWali, setPendidikanWali] = useState(user?.pendidikan_wali || '');
  const [pekerjaanWali, setPekerjaanWali] = useState(user?.pekerjaan_wali || '');
  const [penghasilanWali, setPenghasilanWali] = useState(user?.penghasilan_wali || '');

  // Orang Tua/Wali - Ibu
  const [namaIbu, setNamaIbu] = useState(user?.nama_ibu || '');
  const [nikIbu, setNikIbu] = useState(user?.nik_ibu || '');
  const [tanggalLahirIbu, setTanggalLahirIbu] = useState(user?.tanggal_lahir_ibu || '');
  const [pendidikanIbu, setPendidikanIbu] = useState(user?.pendidikan_ibu || '');
  const [pekerjaanIbu, setPekerjaanIbu] = useState(user?.pekerjaan_ibu || '');
  const [penghasilanIbu, setPenghasilanIbu] = useState(user?.penghasilan_ibu || '');

  // Synchronize state with props when user updates from database asynchronously
  React.useEffect(() => {
    if (user) {
      if (user.avatar !== undefined) setAvatarSrc(user.avatar || null);
      if (user.nama !== undefined) setNama(user.nama || '');
      if (user.nim !== undefined) setNim(user.nim || '');
      if (user.program !== undefined) setProgram(user.program || '');
      if (user.tahun_masuk !== undefined) setTahunMasuk(user.tahun_masuk || '');
      if (user.status !== undefined) setStatus(user.status || 'Aktif');
      if (user.tempat_lahir !== undefined) setTempatLahir(user.tempat_lahir || '');
      if (user.tanggal_lahir !== undefined) setTanggalLahir(user.tanggal_lahir || '');
      if (user.jenis_kelamin !== undefined) setJenisKelamin(user.jenis_kelamin || '');
      if (user.kewarganegaraan !== undefined) setKewarganegaraan(user.kewarganegaraan || '');
      if (user.agama !== undefined) setAgama(user.agama || '');
      if (user.nik !== undefined) setNik(user.nik || '');
      if (user.nisn !== undefined) setNisn(user.nisn || '');
      if (user.no_hp !== undefined) setPhone(user.no_hp || '');
      if (user.email !== undefined) setEmail(user.email || '');
      if (user.jenis_tinggal !== undefined) setJenisTinggal(user.jenis_tinggal || '');
      if (user.jalan !== undefined) setJalan(user.jalan || '');
      if (user.rt_rw !== undefined) setRtRw(user.rt_rw || '');
      if (user.dukuh !== undefined) setDukuh(user.dukuh || '');
      if (user.kelurahan !== undefined) setKelurahan(user.kelurahan || '');
      if (user.kecamatan !== undefined) setKecamatan(user.kecamatan || '');
      if (user.kabupaten !== undefined) setKabupaten(user.kabupaten || '');
      if (user.provinsi !== undefined) setProvinsi(user.provinsi || '');
      if (user.kode_pos !== undefined) setKodePos(user.kode_pos || '');
      if (user.nama_ayah !== undefined) setNamaAyah(user.nama_ayah || '');
      if (user.nik_ayah !== undefined) setNikAyah(user.nik_ayah || '');
      if (user.tanggal_lahir_ayah !== undefined) setTanggalLahirAyah(user.tanggal_lahir_ayah || '');
      if (user.pendidikan_ayah !== undefined) setPendidikanAyah(user.pendidikan_ayah || '');
      if (user.pekerjaan_ayah !== undefined) setPekerjaanAyah(user.pekerjaan_ayah || '');
      if (user.penghasilan_ayah !== undefined) setPenghasilanAyah(user.penghasilan_ayah || '');
      if (user.nama_wali !== undefined) setNamaWali(user.nama_wali || '');
      if (user.nik_wali !== undefined) setNikWali(user.nik_wali || '');
      if (user.tanggal_lahir_wali !== undefined) setTanggalLahirWali(user.tanggal_lahir_wali || '');
      if (user.pendidikan_wali !== undefined) setPendidikanWali(user.pendidikan_wali || '');
      if (user.pekerjaan_wali !== undefined) setPekerjaanWali(user.pekerjaan_wali || '');
      if (user.penghasilan_wali !== undefined) setPenghasilanWali(user.penghasilan_wali || '');
      if (user.nama_ibu !== undefined) setNamaIbu(user.nama_ibu || '');
      if (user.nik_ibu !== undefined) setNikIbu(user.nik_ibu || '');
      if (user.tanggal_lahir_ibu !== undefined) setTanggalLahirIbu(user.tanggal_lahir_ibu || '');
      if (user.pendidikan_ibu !== undefined) setPendidikanIbu(user.pendidikan_ibu || '');
      if (user.pekerjaan_ibu !== undefined) setPekerjaanIbu(user.pekerjaan_ibu || '');
      if (user.penghasilan_ibu !== undefined) setPenghasilanIbu(user.penghasilan_ibu || '');
    }
  }, [user]);

  // Avatar logic
  const triggerUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setTempPhoto(event.target.result as string);
          setShowCropModal(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmCrop = () => {
    if (tempPhoto) {
      setAvatarSrc(tempPhoto);
      onUpdateProfile({ avatar: tempPhoto });
      setShowCropModal(false);
      setTempPhoto(null);
      toast.success('Foto profil berhasil diunggah.');
    }
  };

  // Submit Save action
  const handleSaveCategory = async (e: React.FormEvent, categoryType: string) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    let payload: any = {};

    if (categoryType === 'akademik') {
      payload = {
        nama,
        nim,
        program,
        tahun_masuk: tahunMasuk,
        status
      };
    } else if (categoryType === 'identitas') {
      payload = {
        tempat_lahir: tempatLahir,
        tanggal_lahir: tanggalLahir,
        jenis_kelamin: jenisKelamin,
        kewarganegaraan: kewarganegaraan,
        agama,
        nik,
        nisn,
        no_hp: phone,
        email,
        jenis_tinggal: jenisTinggal
      };
    } else if (categoryType === 'alamat') {
      payload = {
        jalan,
        rt_rw: rtRw,
        dukuh,
        kelurahan,
        kecamatan,
        kabupaten,
        provinsi,
        kode_pos: kodePos
      };
    } else if (categoryType === 'orangtua') {
      payload = {
        nama_ayah: namaAyah,
        nik_ayah: nikAyah,
        tanggal_lahir_ayah: tanggalLahirAyah,
        pendidikan_ayah: pendidikanAyah,
        pekerjaan_ayah: pekerjaanAyah,
        penghasilan_ayah: penghasilanAyah,

        nama_wali: namaWali,
        nik_wali: nikWali,
        tanggal_lahir_wali: tanggalLahirWali,
        pendidikan_wali: pendidikanWali,
        pekerjaan_wali: pekerjaanWali,
        penghasilan_wali: penghasilanWali,

        nama_ibu: namaIbu,
        nik_ibu: nikIbu,
        tanggal_lahir_ibu: tanggalLahirIbu,
        pendidikan_ibu: pendidikanIbu,
        pekerjaan_ibu: pekerjaanIbu,
        penghasilan_ibu: penghasilanIbu
      };
    }

    try {
      await onUpdateProfile(payload);
      toast.success(`Data ${categoryType.toUpperCase()} berhasil disimpan.`);
    } catch (err: any) {
      toast.error('Gagal menyimpan pembaruan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* 1. Left Column: Profile Avatar Summary & System Actions */}
      <div className="space-y-6">
        
        {/* Pas Foto Diri Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center space-y-4 shadow-sm relative overflow-hidden">
          <div className="relative w-24 h-24 mx-auto group">
            <div className="w-full h-full rounded-full border-3 border-emerald-500/20 bg-slate-100 overflow-hidden flex items-center justify-center shadow-lg">
              {avatarSrc ? (
                <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-slate-400" />
              )}
            </div>
            
            {/* Camera Trigger */}
            <button 
              onClick={triggerUploadClick}
              className="absolute bottom-0 right-0 p-2 rounded-full bg-emerald-600 border border-white text-white hover:bg-emerald-700 transition-colors shadow shadow-emerald-500/30 cursor-pointer"
              title="Unggah Pas Foto"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-slate-805 leading-none">{nama || user?.nama || 'Belum Diisi'}</h3>
            <p className="text-[11px] text-slate-400 font-mono">NIM: {nim || user?.nim || 'Belum Diisi'}</p>
          </div>

          <div className="bg-slate-50/80 rounded-xl p-4 text-left divide-y divide-slate-150 text-[11px] space-y-2.5 pt-3">
            <div className="flex justify-between pb-2.5">
              <span className="text-slate-450 font-bold">Status Akademik</span>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border font-bold uppercase text-[9px] leading-none ${
                (status || user?.status || 'aktif').toLowerCase() === 'aktif' 
                  ? 'bg-emerald-50 border-emerald-150 text-emerald-750' 
                  : 'bg-red-50 border-red-150 text-red-750'
              }`}>
                <CheckCircle2 className="w-2.5 h-2.5" />
                {status || user?.status || 'Aktif'}
              </span>
            </div>
            <div className="flex justify-between pt-2.5">
              <span className="text-slate-450 font-bold">Tahun Masuk</span>
              <span className="text-slate-800 font-extrabold font-mono">{tahunMasuk || user?.tahun_masuk || '-'}</span>
            </div>
            <div className="flex justify-between pt-2.5">
              <span className="text-slate-450 font-bold">Program Studi</span>
              <span className="text-slate-800 font-bold">{program || user?.program || '-'} {user?.kelas ? `(${user.kelas})` : ''}</span>
            </div>
          </div>
        </div>

        {/* System Exit Options */}
        <div className="bg-rose-50/40 border border-rose-100 rounded-2xl p-5 space-y-3">
          <div className="text-left">
            <h4 className="font-extrabold text-xs text-rose-800">Selesai Beraktivitas?</h4>
            <p className="text-[10px] text-rose-600 mt-0.5">Selalu periksa kembali usai mengisi data agar tersimpan dengan aman.</p>
          </div>
          <button 
            type="button"
            onClick={onLogout}
            className="w-full bg-rose-650 hover:bg-rose-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
          >
            <LogOut className="w-4 h-4" />
            Keluar dari Sistem
          </button>
        </div>

      </div>

      {/* 2. Right Column: The Large Form Card divided in tabs */}
      <div className="lg:col-span-2 space-y-6">
        
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          
          {/* Card Header & Custom Tab Selector Bar */}
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <div className="flex flex-col gap-1 pb-4">
              <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">Manajemen Profil Mandiri</h2>
              <p className="text-xs text-slate-500">Rincian data resmi mahasantri sesuai dokumen lembaga.</p>
            </div>

            {/* Read-Only Alert Banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex gap-2.5 text-xs text-amber-800 items-start mb-4">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold">Data Akademik Terkunci</p>
                <p className="text-amber-700 mt-0.5">Khusus rincian Akademik dideklarasikan secara permanen oleh lembaga (Read-Only). Sedangkan tab Identitas, Alamat, dan Wali tetap dapat Anda perbarui secara mandiri.</p>
              </div>
            </div>

            {/* Custom Tab Navigation Slider */}
            <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
              
              <button
                type="button"
                onClick={() => setActiveTab('akademik')}
                className={`flex-1 min-w-[100px] py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'akademik'
                    ? 'bg-white text-emerald-700 shadow-xs border-b border-emerald-500/10'
                    : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-800'
                }`}
              >
                <GraduationCap className="w-4 h-4 shrink-0" />
                <span>Akademik</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('identitas')}
                className={`flex-1 min-w-[100px] py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'identitas'
                    ? 'bg-white text-emerald-700 shadow-xs border-b border-emerald-500/10'
                    : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-800'
                }`}
              >
                <UserCheck className="w-4 h-4 shrink-0" />
                <span>Identitas</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('alamat')}
                className={`flex-1 min-w-[100px] py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'alamat'
                    ? 'bg-white text-emerald-700 shadow-xs border-b border-emerald-500/10'
                    : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-800'
                }`}
              >
                <MapPin className="w-4 h-4 shrink-0" />
                <span>Alamat</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('orangtua')}
                className={`flex-1 min-w-[100px] py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'orangtua'
                    ? 'bg-white text-emerald-700 shadow-xs border-b border-emerald-500/10'
                    : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-800'
                }`}
              >
                <Users className="w-4 h-4 shrink-0" />
                <span>Wali / Ortu</span>
              </button>

            </div>
          </div>

          {/* Form Content Body */}
          <div className="p-6">
            
            {/* 1. DATA AKADEMIK TAB */}
            {activeTab === 'akademik' && (
              <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
                <fieldset disabled className="space-y-5">
                  <div className="flex items-center gap-1.5 text-slate-500 border-b border-slate-100 pb-2">
                    <GraduationCap className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs uppercase tracking-wider font-extrabold text-slate-700">Rincian Data Akademik</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                    <div className="space-y-1.5">
                      <label className="block text-slate-500 uppercase text-[10px] tracking-wider">Nama Mahasantri</label>
                      <input 
                        type="text" 
                        value={nama}
                        onChange={(e) => setNama(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-505"
                        placeholder="Masukkan nama resmi lengkap"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-slate-500 uppercase text-[10px] tracking-wider">Nomor Induk Mahasantri (NIM)</label>
                      <input 
                        type="text" 
                        value={nim}
                        onChange={(e) => setNim(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 font-bold font-mono focus:outline-none focus:ring-1 focus:ring-emerald-505"
                        placeholder="Masukkan NIM resmi"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-slate-500 uppercase text-[10px] tracking-wider">Program Studi</label>
                      <input 
                        type="text" 
                        value={program}
                        onChange={(e) => setProgram(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-505"
                        placeholder="Contoh: Takhasus Tafsir / Syariah"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-slate-500 uppercase text-[10px] tracking-wider">Tahun Masuk</label>
                      <input 
                        type="text" 
                        value={tahunMasuk}
                        onChange={(e) => setTahunMasuk(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 font-bold font-mono focus:outline-none focus:ring-1 focus:ring-emerald-505"
                        placeholder="Contoh: 2024"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="block text-slate-500 uppercase text-[10px] tracking-wider">Status Mahasantri Kerja</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-505"
                      >
                        <option value="Aktif">Aktif</option>
                        <option value="Cuti">Cuti</option>
                        <option value="Tidak Aktif">Tidak Aktif</option>
                        <option value="Lulus">Lulus</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-4 border-t border-slate-100 text-[11px] text-slate-400 font-bold">
                    <ShieldAlert className="w-4 h-4 text-slate-450" />
                    <span>Seluruh data akademik di atas telah diverifikasi dan dikunci oleh pihak pengelola.</span>
                  </div>
                </fieldset>
              </form>
            )}

            {/* 2. IDENTITAS DIRI TAB */}
            {activeTab === 'identitas' && (
              <form onSubmit={(e) => handleSaveCategory(e, 'identitas')} className="space-y-5">
                <div className="flex items-center gap-1.5 text-slate-500 border-b border-slate-100 pb-2">
                  <User className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs uppercase tracking-wider font-extrabold text-slate-700">Identitas Kontak & Pribadi</span>
                </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                    
                    <div className="space-y-1.5">
                      <label className="block text-slate-500 uppercase text-[10px] tracking-wider">Tempat Lahir</label>
                      <input 
                        type="text" 
                        value={tempatLahir}
                        onChange={(e) => setTempatLahir(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-505"
                        placeholder="Contoh: Magelang"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-slate-500 uppercase text-[10px] tracking-wider">Tanggal Lahir</label>
                      <input 
                        type="date" 
                        value={tanggalLahir}
                        onChange={(e) => setTanggalLahir(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-505 font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-slate-500 uppercase text-[10px] tracking-wider">Jenis Kelamin</label>
                      <select
                        value={jenisKelamin}
                        onChange={(e) => setJenisKelamin(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-505"
                      >
                        <option value="">-- Pilih Jenis Kelamin --</option>
                        <option value="laki-laki">Laki-laki</option>
                        <option value="perempuan">Perempuan</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-slate-500 uppercase text-[10px] tracking-wider">Kewarganegaraan</label>
                      <input 
                        type="text" 
                        value={kewarganegaraan}
                        onChange={(e) => setKewarganegaraan(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-505"
                        placeholder="Contoh: WNI / Indonesia"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-slate-500 uppercase text-[10px] tracking-wider">Agama</label>
                      <select
                        value={agama}
                        onChange={(e) => setAgama(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-505"
                      >
                        <option value="">-- Pilih Agama --</option>
                        <option value="Islam">Islam</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-slate-500 uppercase text-[10px] tracking-wider">Nomor Induk Kependudukan (NIK)</label>
                      <input 
                        type="text" 
                        value={nik}
                        onChange={(e) => setNik(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-505"
                        placeholder="16 Digit NIK KTP/KK"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-slate-500 uppercase text-[10px] tracking-wider">NISN (Nomor Induk Siswa Nasional)</label>
                      <input 
                        type="text" 
                        value={nisn}
                        onChange={(e) => setNisn(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-505"
                        placeholder="Masukkan NISN jika ada"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-slate-500 uppercase text-[10px] tracking-wider">No Handphone / WA</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input 
                          type="text" 
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-505 font-mono"
                          placeholder="Contoh: 0812XXXXXXXX"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-slate-500 uppercase text-[10px] tracking-wider">Alamat Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input 
                          type="email" 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-505"
                          placeholder="contoh@domain.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-slate-500 uppercase text-[10px] tracking-wider">Jenis Tinggal</label>
                      <input 
                        type="text" 
                        value={jenisTinggal}
                        onChange={(e) => setJenisTinggal(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-505"
                        placeholder="Contoh: Asrama Mandiri, Kos, Rumah Ortu"
                      />
                    </div>

                  </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-6 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Simpan Identitas Diri
                  </button>
                </div>
              </form>
            )}

            {/* 3. ALAMAT DOMISILI TAB */}
            {activeTab === 'alamat' && (
              <form onSubmit={(e) => handleSaveCategory(e, 'alamat')} className="space-y-5">
                <div className="flex items-center gap-1.5 text-slate-500 border-b border-slate-100 pb-2">
                  <Compass className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs uppercase tracking-wider font-extrabold text-slate-700">Alamat Lengkap Domisili</span>
                </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                    
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="block text-slate-500 uppercase text-[10px] tracking-wider">Alamat Jalan</label>
                      <input 
                        type="text" 
                        value={jalan}
                        onChange={(e) => setJalan(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-505"
                        placeholder="Nama Jalan, Blok, No Rumah"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-slate-500 uppercase text-[10px] tracking-wider">RT / RW</label>
                      <input 
                        type="text" 
                        value={rtRw}
                        onChange={(e) => setRtRw(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-505 font-mono"
                        placeholder="RT 03 / RW 04"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-slate-500 uppercase text-[10px] tracking-wider">Dukuh / Dusun</label>
                      <input 
                        type="text" 
                        value={dukuh}
                        onChange={(e) => setDukuh(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-505"
                        placeholder="Contoh: Krajan"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-slate-500 uppercase text-[10px] tracking-wider">Kelurahan / Desa</label>
                      <input 
                        type="text" 
                        value={kelurahan}
                        onChange={(e) => setKelurahan(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-505"
                        placeholder="Contoh: Secang"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-slate-500 uppercase text-[10px] tracking-wider">Kecamatan</label>
                      <input 
                        type="text" 
                        value={kecamatan}
                        onChange={(e) => setKecamatan(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-505"
                        placeholder="Contoh: Grabag"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-slate-500 uppercase text-[10px] tracking-wider">Kabupaten / Kota</label>
                      <input 
                        type="text" 
                        value={kabupaten}
                        onChange={(e) => setKabupaten(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-505"
                        placeholder="Contoh: Magelang"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-slate-500 uppercase text-[10px] tracking-wider">Provinsi</label>
                      <input 
                        type="text" 
                        value={provinsi}
                        onChange={(e) => setProvinsi(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-505"
                        placeholder="Contoh: Jawa Tengah"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="block text-slate-500 uppercase text-[10px] tracking-wider">Kode Pos</label>
                      <input 
                        type="text" 
                        value={kodePos}
                        onChange={(e) => setKodePos(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-505 font-mono"
                        placeholder="Contoh: 56195"
                      />
                    </div>

                  </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-6 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Simpan Alamat Lengkap
                  </button>
                </div>
              </form>
            )}

            {/* 4. ORANG TUA / WALI TAB */}
            {activeTab === 'orangtua' && (
              <form onSubmit={(e) => handleSaveCategory(e, 'orangtua')} className="space-y-5">
                <div className="flex items-center gap-1.5 text-slate-500 border-b border-slate-100 pb-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs uppercase tracking-wider font-extrabold text-slate-700">Rincian Data Keluarga Wali</span>
                </div>

                  {/* Sub Tab selection between Ayah, Ibu, Wali */}
                  <div className="flex border border-slate-200 rounded-xl overflow-hidden text-xs">
                    <button
                      type="button"
                      onClick={() => setActiveParentTab('ayah')}
                      className={`flex-1 py-2 font-bold cursor-pointer transition-colors ${
                        activeParentTab === 'ayah' ? 'bg-slate-800 text-white' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      AYAH
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveParentTab('ibu')}
                      className={`flex-1 py-2 font-bold cursor-pointer transition-colors ${
                        activeParentTab === 'ibu' ? 'bg-slate-800 text-white' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      IBU
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveParentTab('wali')}
                      className={`flex-1 py-2 font-bold cursor-pointer transition-colors ${
                        activeParentTab === 'wali' ? 'bg-slate-800 text-white' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      WALI
                    </button>
                  </div>

                  <div className="border border-slate-150 rounded-2xl p-5 bg-slate-50/20 space-y-4">
                    
                    {/* AYAH SUB-FORM */}
                    {activeParentTab === 'ayah' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="block text-slate-500 uppercase text-[10px] tracking-wider">Nama Ayah</label>
                          <input 
                            type="text" 
                            value={namaAyah}
                            onChange={(e) => setNamaAyah(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
                            placeholder="Nama lengkap Ayah Kandung"
                          />
                        </div>

                        <div className="space-y-1.5 font-mono">
                          <label className="block text-slate-500 uppercase text-[10px] tracking-wider font-sans">NIK Ayah</label>
                          <input 
                            type="text" 
                            value={nikAyah}
                            onChange={(e) => setNikAyah(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
                            placeholder="16 Digit NIK"
                          />
                        </div>

                        <div className="space-y-1.5 font-mono">
                          <label className="block text-slate-500 uppercase text-[10px] tracking-wider font-sans">Tanggal Lahir Ayah</label>
                          <input 
                            type="date" 
                            value={tanggalLahirAyah}
                            onChange={(e) => setTanggalLahirAyah(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-slate-500 uppercase text-[10px] tracking-wider">Pendidikan Ayah</label>
                          <select
                            value={pendidikanAyah}
                            onChange={(e) => setPendidikanAyah(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
                          >
                            <option value="">-- Pilih Pendidikan --</option>
                            <option value="SD">SD / Sederajat</option>
                            <option value="SMP">SMP / Sederajat</option>
                            <option value="SMA">SMA / Sederajat</option>
                            <option value="Diploma">Diploma (D1-D4)</option>
                            <option value="Sarjana S1">Sarjana (S1)</option>
                            <option value="Magister S2">Magister (S2)</option>
                            <option value="Doktor S3">Doktor (S3)</option>
                            <option value="Tidak Sekolah">Tidak Sekolah</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-slate-500 uppercase text-[10px] tracking-wider">Pekerjaan Ayah</label>
                          <input 
                            type="text" 
                            value={pekerjaanAyah}
                            onChange={(e) => setPekerjaanAyah(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
                            placeholder="PNS, Karyawan, Sawah, Dagang dll"
                          />
                        </div>

                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="block text-slate-500 uppercase text-[10px] tracking-wider">Penghasilan Ayah</label>
                          <select
                            value={penghasilanAyah}
                            onChange={(e) => setPenghasilanAyah(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none font-sans"
                          >
                            <option value="">-- Pilih Range Penghasilan bulanan --</option>
                            <option value="< Rp 1.000.000">&lt; Rp 1.000.000</option>
                            <option value="Rp 1.000.000 - Rp 2.000.000">Rp 1.000.000 - Rp 2.000.000</option>
                            <option value="Rp 2.000.000 - Rp 5.000.000">Rp 2.000.000 - Rp 5.000.000</option>
                            <option value="> Rp 5.000.000">&gt; Rp 5.000.000</option>
                            <option value="Tidak ada/ Tidak Bekerja">Tidak Ada Penghasilan tetap / Tidak Bekerja</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* IBU SUB-FORM */}
                    {activeParentTab === 'ibu' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="block text-slate-500 uppercase text-[10px] tracking-wider">Nama Ibu</label>
                          <input 
                            type="text" 
                            value={namaIbu}
                            onChange={(e) => setNamaIbu(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
                            placeholder="Nama lengkap Ibu Kandung"
                          />
                        </div>

                        <div className="space-y-1.5 font-mono">
                          <label className="block text-slate-500 uppercase text-[10px] tracking-wider font-sans">NIK Ibu</label>
                          <input 
                            type="text" 
                            value={nikIbu}
                            onChange={(e) => setNikIbu(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
                            placeholder="16 Digit NIK"
                          />
                        </div>

                        <div className="space-y-1.5 font-mono">
                          <label className="block text-slate-500 uppercase text-[10px] tracking-wider font-sans">Tanggal Lahir Ibu</label>
                          <input 
                            type="date" 
                            value={tanggalLahirIbu}
                            onChange={(e) => setTanggalLahirIbu(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-slate-500 uppercase text-[10px] tracking-wider">Pendidikan Ibu</label>
                          <select
                            value={pendidikanIbu}
                            onChange={(e) => setPendidikanIbu(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
                          >
                            <option value="">-- Pilih Pendidikan --</option>
                            <option value="SD">SD / Sederajat</option>
                            <option value="SMP">SMP / Sederajat</option>
                            <option value="SMA">SMA / Sederajat</option>
                            <option value="Diploma">Diploma (D1-D4)</option>
                            <option value="Sarjana S1">Sarjana (S1)</option>
                            <option value="Magister S2">Magister (S2)</option>
                            <option value="Doktor S3">Doktor (S3)</option>
                            <option value="Tidak Sekolah">Tidak Sekolah</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-slate-500 uppercase text-[10px] tracking-wider">Pekerjaan Ibu</label>
                          <input 
                            type="text" 
                            value={pekerjaanIbu}
                            onChange={(e) => setPekerjaanIbu(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
                            placeholder="IRT, PNS, Dagang, Tani dll"
                          />
                        </div>

                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="block text-slate-500 uppercase text-[10px] tracking-wider">Penghasilan Ibu</label>
                          <select
                            value={penghasilanIbu}
                            onChange={(e) => setPekerjaanIbu(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none font-sans"
                          >
                            <option value="">-- Pilih Range Penghasilan bulanan --</option>
                            <option value="< Rp 1.000.000">&lt; Rp 1.000.000</option>
                            <option value="Rp 1.000.000 - Rp 2.000.000">Rp 1.000.000 - Rp 2.000.000</option>
                            <option value="Rp 2.000.000 - Rp 5.000.000">Rp 2.000.000 - Rp 5.000.000</option>
                            <option value="> Rp 5.000.000">&gt; Rp 5.000.000</option>
                            <option value="Tidak ada/ Tidak Bekerja">Tidak Ada Penghasilan tetap / Tidak Bekerja</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* WALI SUB-FORM */}
                    {activeParentTab === 'wali' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="block text-slate-500 uppercase text-[10px] tracking-wider">Nama Wali (Optional)</label>
                          <input 
                            type="text" 
                            value={namaWali}
                            onChange={(e) => setNamaWali(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
                            placeholder="Tulis nama wali jika ada"
                          />
                        </div>

                        <div className="space-y-1.5 font-mono">
                          <label className="block text-slate-500 uppercase text-[10px] tracking-wider font-sans">NIK Wali</label>
                          <input 
                            type="text" 
                            value={nikWali}
                            onChange={(e) => setNikWali(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
                            placeholder="16 Digit NIK Wali"
                          />
                        </div>

                        <div className="space-y-1.5 font-mono">
                          <label className="block text-slate-500 uppercase text-[10px] tracking-wider font-sans">Tanggal Lahir Wali</label>
                          <input 
                            type="date" 
                            value={tanggalLahirWali}
                            onChange={(e) => setTanggalLahirWali(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-slate-500 uppercase text-[10px] tracking-wider">Pendidikan Wali</label>
                          <select
                            value={pendidikanWali}
                            onChange={(e) => setPendidikanWali(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
                          >
                            <option value="">-- Pilih Pendidikan --</option>
                            <option value="SD">SD / Sederajat</option>
                            <option value="SMP">SMP / Sederajat</option>
                            <option value="SMA">SMA / Sederajat</option>
                            <option value="Diploma">Diploma (D1-D4)</option>
                            <option value="Sarjana S1">Sarjana (S1)</option>
                            <option value="Magister S2">Magister (S2)</option>
                            <option value="Doktor S3">Doktor (S3)</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-slate-500 uppercase text-[10px] tracking-wider">Pekerjaan Wali</label>
                          <input 
                            type="text" 
                            value={pekerjaanWali}
                            onChange={(e) => setPekerjaanWali(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
                            placeholder="Tulis pekerjaan Wali"
                          />
                        </div>

                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="block text-slate-500 uppercase text-[10px] tracking-wider">Penghasilan Wali</label>
                          <select
                            value={penghasilanWali}
                            onChange={(e) => setPenghasilanWali(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none font-sans"
                          >
                            <option value="">-- Pilih Range Penghasilan bulanan --</option>
                            <option value="< Rp 1.000.000">&lt; Rp 1.000.000</option>
                            <option value="Rp 1.000.000 - Rp 2.000.000">Rp 1.000.000 - Rp 2.000.000</option>
                            <option value="Rp 2.000.000 - Rp 5.000.000">Rp 2.000.000 - Rp 5.000.000</option>
                            <option value="> Rp 5.000.000">&gt; Rp 5.000.000</option>
                          </select>
                        </div>
                      </div>
                    )}

                  </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-6 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Simpan Semua Data Ortu/Wali
                  </button>
                </div>
              </form>
            )}

          </div>

        </div>

      </div>

      {/* Visual Crop Modal Popups */}
      <AnimatePresence>
        {showCropModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-205 shadow-2xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-5 border-b border-slate-150 flex justify-between items-center bg-slate-50">
                <span className="font-bold text-xs text-slate-800 uppercase tracking-widest">Atur Pas Foto</span>
                <button 
                  onClick={() => {
                    setShowCropModal(false);
                    setTempPhoto(null);
                  }}
                  className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <p className="text-[11px] text-slate-400 text-center uppercase tracking-wide font-semibold">Posisikan wajah tepat di tengah</p>
                <div className="w-40 h-40 rounded-full border-4 border-dashed border-emerald-400 overflow-hidden mx-auto shadow-inner relative flex items-center justify-center bg-slate-50 p-1">
                  {tempPhoto && (
                    <img src={tempPhoto} alt="crop-review" className="w-full h-full object-cover" />
                  )}
                </div>

                <div className="pt-3 flex gap-2">
                  <button 
                    onClick={() => {
                      setShowCropModal(false);
                      setTempPhoto(null);
                    }}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-650 font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleConfirmCrop}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Gunakan Foto
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
