import React, { useState, useRef } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  GraduationCap, 
  Lock, 
  Camera, 
  Compass, 
  CheckCircle2, 
  RefreshCw, 
  Monitor, 
  Globe, 
  Sliders,
  Settings,
  Eye,
  LogOut,
  X,
  Languages,
  BellRing
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

interface ProfilViewProps {
  user: any;
  onUpdateProfile: (updatedData: any) => void;
  onLogout: () => void;
}

export default function ProfilView({ user, onUpdateProfile, onLogout }: ProfilViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile forms
  const [phone, setPhone] = useState(user?.no_hp || '0812-3456-7890');
  const [email, setEmail] = useState(user?.email || 'fulan@mahasantri.com');
  const [savingPersonal, setSavingPersonal] = useState(false);

  // Password fields
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Settings & Toggles
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');
  const [language, setLanguage] = useState<'indonesia' | 'arab'>('indonesia');
  const [notificationEnabled, setNotificationEnabled] = useState(true);

  // Profil Photo editor
  const [avatarSrc, setAvatarSrc] = useState<string | null>(user?.avatar || null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [tempPhoto, setTempPhoto] = useState<string | null>(null);

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

  // Simulating Cropping
  const handleConfirmCrop = () => {
    if (tempPhoto) {
      setAvatarSrc(tempPhoto);
      onUpdateProfile({ avatar: tempPhoto });
      setShowCropModal(false);
      setTempPhoto(null);
      toast.success('Foto profil berhasil diunggah & dipotong.');
    }
  };

  const handleSavePersonalInfo = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPersonal(true);
    setTimeout(() => {
      onUpdateProfile({ email, no_hp: phone });
      setSavingPersonal(false);
      toast.success('Pembaruan data pribadi berhasil disimpan.');
    }, 1000);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error('Harap lengkapi seluruh formulir kata sandi!');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Kata sandi baru & konfirmasi tidak cocok!');
      return;
    }
    setChangingPassword(true);
    setTimeout(() => {
      setChangingPassword(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Kata sandi berhasil diperbarui.');
    }, 1200);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* 1. Left Sidebar: Personal summary and configuration */}
      <div className="space-y-6">
        
        {/* Foto Profil & Utama Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center space-y-4 shadow-sm relative overflow-hidden">
          <div className="relative w-24 h-24 mx-auto group">
            <div className="w-full h-full rounded-full border-3 border-emerald-500/20 bg-slate-100 overflow-hidden flex items-center justify-center shadow-lg">
              {avatarSrc ? (
                <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-slate-400" />
              )}
            </div>
            
            {/* Upload Circle trigger */}
            <button 
              onClick={triggerUploadClick}
              className="absolute bottom-0 right-0 p-2 rounded-full bg-emerald-600 border border-white text-white hover:bg-emerald-700 transition-colors shadow shadow-emerald-500/30 cursor-pointer"
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
            <h3 className="text-base font-extrabold text-slate-805 leading-none">{user?.nama}</h3>
            <p className="text-[11px] text-slate-400 font-mono">NIM {user?.nim}</p>
          </div>

          <div className="bg-slate-50/80 rounded-xl p-4 text-left divide-y divide-slate-150 text-[11px] space-y-2.5 pt-3">
            <div className="flex justify-between pb-2.5">
              <span className="text-slate-450 font-bold">Status Akademik</span>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border font-bold uppercase text-[9px] leading-none ${
                user?.status?.toLowerCase() === 'aktif' 
                  ? 'bg-emerald-50 border-emerald-150 text-emerald-750' 
                  : 'bg-red-50 border-red-150 text-red-750'
              }`}>
                <CheckCircle2 className={`w-2.5 h-2.5 ${user?.status?.toLowerCase() === 'aktif' ? 'text-emerald-600' : 'text-red-600'}`} />
                {user?.status || 'Aktif'}
              </span>
            </div>
            <div className="flex justify-between pt-2.5">
              <span className="text-slate-450 font-bold">Tahun Masuk</span>
              <span className="text-slate-800 font-extrabold font-mono">{user?.tahun_masuk || '-'}</span>
            </div>
            <div className="flex justify-between pt-2.5">
              <span className="text-slate-450 font-bold">Program Studi</span>
              <span className="text-slate-800 font-bold">{user?.program || '-'} {user?.kelas ? `(${user.kelas})` : ''}</span>
            </div>
          </div>
        </div>

        {/* Global System Preferences Configuration */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
            <Settings className="w-4.5 h-4.5 text-slate-500" />
            <h4 className="font-extrabold text-xs text-slate-750 uppercase tracking-widest">Pengaturan Aplikasi</h4>
          </div>

          <div className="space-y-4 text-xs font-semibold text-slate-705">
            {/* Dark & Light Theme Mode Selection */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold">Mode Tampilan</p>
                <p className="text-[10px] text-slate-400 font-medium">Ubah preset warna tema.</p>
              </div>
              <div className="bg-slate-50 p-0.5 rounded-lg border border-slate-200 flex gap-1">
                <button 
                  onClick={() => {
                    setThemeMode('light');
                    toast.success('Preset visual beralih ke Mode Terang (Default).');
                  }}
                  className={`px-2 py-1 rounded text-[10px] uppercase font-bold cursor-pointer transition-all ${
                    themeMode === 'light' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Terang
                </button>
                <button 
                  onClick={() => {
                    setThemeMode('dark');
                    toast.error('Mode Gelap sedang dikonsep. Kembali ke Mode Terang (Default).');
                  }}
                  className={`px-2 py-1 rounded text-[10px] uppercase font-bold cursor-pointer transition-all ${
                    themeMode === 'dark' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Gelap
                </button>
              </div>
            </div>

            {/* Language Selection Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold flex items-center gap-1"><Languages className="w-4 h-4 text-slate-500" /> Preferensi Bahasa</p>
                <p className="text-[10px] text-slate-400 font-medium">Atur navigasi istilah syariah.</p>
              </div>
              <select 
                value={language}
                onChange={(e) => {
                  const lang = e.target.value as any;
                  setLanguage(lang);
                  toast.success(lang === 'indonesia' ? 'Bahasa navigasi disetel ke Indonesia.' : 'Arab disimulasikan.');
                }}
                className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[11px] font-bold focus:outline-none"
              >
                <option value="indonesia">Indonesia</option>
                <option value="arab">العربية (Arab)</option>
              </select>
            </div>

            {/* Notification Activation */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold flex items-center gap-1"><BellRing className="w-4 h-4 text-slate-500" /> Notifikasi Portal</p>
                <p className="text-[10px] text-slate-400 font-medium">Dapatkan pengingat jadwal.</p>
              </div>
              <button 
                onClick={() => {
                  setNotificationEnabled(!notificationEnabled);
                  toast.success(!notificationEnabled ? 'Notifikasi sistem diaktifkan.' : 'Notifikasi sistem dimatikan.');
                }}
                className={`w-10 h-5.5 rounded-full p-0.5 transition-colors cursor-pointer flex items-center ${
                  notificationEnabled ? 'bg-emerald-600 justify-end' : 'bg-slate-200 justify-start'
                }`}
              >
                <span className="w-4.5 h-4.5 bg-white rounded-full shadow-2xs block"></span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* 2. Right panels: Personal information form & Security passwords */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Personal Details Information Fields */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
            <User className="w-4.5 h-4.5 text-slate-500" />
            <h4 className="font-extrabold text-xs text-slate-750 uppercase tracking-widest">Informasi Kontak & Pribadi</h4>
          </div>

          <form onSubmit={handleSavePersonalInfo} className="space-y-4 text-xs font-semibold">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="block text-slate-450 uppercase font-bold text-[10px]">Nama Mahasantri (Resmi)</label>
                <input 
                  type="text" 
                  value={user?.nama} 
                  disabled 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-500 cursor-not-allowed cursor"
                />
              </div>

              {/* NIM */}
              <div className="space-y-1.5">
                <label className="block text-slate-450 uppercase font-bold text-[10px]">Nomor Induk Mahasantri (NIM)</label>
                <input 
                  type="text" 
                  value={user?.nim} 
                  disabled 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold font-mono text-slate-500 cursor-not-allowed"
                />
              </div>

              {/* Prodi / Program */}
              <div className="space-y-1.5">
                <label className="block text-slate-455 uppercase font-bold text-[10px]">Program Studi</label>
                <input 
                  type="text" 
                  value={user?.program} 
                  disabled 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-500 cursor-not-allowed"
                />
              </div>

              {/* Kelas */}
              <div className="space-y-1.5">
                <label className="block text-slate-455 uppercase font-bold text-[10px]">Kelas & Asrama</label>
                <input 
                  type="text" 
                  value={user?.kelas} 
                  disabled 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-500 cursor-not-allowed"
                />
              </div>

              {/* No Handphone */}
              <div className="space-y-1.5">
                <label className="block text-slate-455 uppercase font-bold text-[10px]">No Handphone / WhatsApp</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="block text-slate-455 uppercase font-bold text-[10px]">Alamat Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="text-right pt-2">
              <button 
                type="submit" 
                disabled={savingPersonal}
                className="bg-emerald-600 hover:bg-emerald-750 transition-colors font-bold text-xs text-white py-2 px-5 rounded-xl cursor-pointer shadow flex items-center gap-1.5 inline-flex"
              >
                {savingPersonal && <RefreshCw className="w-4.5 h-4.5 animate-spin shrink-0" />}
                Simpan Pembaruan Data
              </button>
            </div>
          </form>
        </div>

        {/* Account Security (Form Ubah Password & Session action) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
            <Lock className="w-4.5 h-4.5 text-slate-500" />
            <h4 className="font-extrabold text-xs text-slate-750 uppercase tracking-widest">Keamanan Akun</h4>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4 text-xs font-semibold">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Old Password */}
              <div className="space-y-1.5">
                <label className="block text-slate-455 uppercase font-bold text-[10px]">Kata Sandi Lama</label>
                <input 
                  type="password"
                  placeholder="••••••••"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="block text-slate-455 uppercase font-bold text-[10px]">Kata Sandi Baru</label>
                <input 
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="block text-slate-455 uppercase font-bold text-[10px]">Konfirmasi Kata Sandi Baru</label>
                <input 
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-1.5">
              <button 
                type="button" 
                onClick={() => {
                  toast.success('Sesi login dari perangkat lain berhasil ditutup.', { icon: '🛡️' });
                }}
                className="text-stone-600 hover:text-stone-800 underline uppercase tracking-wider font-bold text-[10px] cursor-pointer"
              >
                Logout dari seluruh perangkat lain
              </button>

              <button 
                type="submit" 
                disabled={changingPassword}
                className="bg-slate-900 hover:bg-slate-800 transition-colors font-bold text-xs text-white py-2 px-5 rounded-xl cursor-pointer shadow flex items-center gap-1.5"
              >
                {changingPassword && <RefreshCw className="w-4.5 h-4.5 animate-spin shrink-0" />}
                Perbarui Kata Sandi
              </button>
            </div>
          </form>
        </div>

        {/* Global Exit logout buttons */}
        <div className="bg-rose-50/50 border border-rose-100/55 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <h4 className="font-extrabold text-xs text-rose-805">Ingin Mengakhiri Sesi Akun?</h4>
            <p className="text-[11px] text-rose-650 mt-1">Pastikan seluruh lembar absensi & tugas perkuliahan telah tuntas tersimpan.</p>
          </div>
          <button 
            type="button"
            onClick={onLogout}
            className="bg-rose-650 hover:bg-rose-700 transition-colors font-bold text-xs text-white py-2 px-5 rounded-xl cursor-pointer shadow-sm flex items-center gap-1.5 shrink-0"
          >
            <LogOut className="w-4 h-4" />
            Keluar dari Sistem
          </button>
        </div>

      </div>

      {/* Visual Crop Simulator Modal popups */}
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
                <span className="font-bold text-xs text-slate-800 uppercase tracking-widest">Crop / Pas Foto Diri</span>
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
                <p className="text-[11px] text-slate-400 text-center uppercase tracking-wide font-semibold">Posisikan wajah tepat di dalam lingkaran crop</p>
                <div className="w-40 h-40 rounded-full border-4 border-dashed border-emerald-400 overflow-hidden mx-auto shadow-inner relative flex items-center justify-center bg-slate-50 p-1">
                  {tempPhoto && (
                    <img src={tempPhoto} alt="crop-review" className="w-full h-full object-cover animate-pulse" />
                  )}
                  {/* Grid crop circle overlays */}
                  <div className="absolute inset-4 rounded-full border border-white/40 pointer-events-none"></div>
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
                    Simpan Foto
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
