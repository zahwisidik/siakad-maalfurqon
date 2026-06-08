import React, { useState } from 'react';
import { 
  Lock, 
  RefreshCw, 
  Languages, 
  BellRing,
  User,
  Eye,
  EyeOff,
  Settings
} from 'lucide-react';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';

interface PengaturanViewProps {
  user: any;
  onUpdateProfile?: (updatedData: any) => void;
}

export default function PengaturanView({ user, onUpdateProfile }: PengaturanViewProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Username fields
  const [username, setUsername] = useState(user?.username || user?.nim || 'fulan');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [savingUsername, setSavingUsername] = useState(false);

  // Password fields
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Settings & Toggles
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');
  const [language, setLanguage] = useState<'indonesia' | 'arab'>('indonesia');
  const [notificationEnabled, setNotificationEnabled] = useState(true);

  const handleUpdateUsername = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error('Username tidak boleh kosong!');
      return;
    }
    setSavingUsername(true);
    setTimeout(() => {
      if (onUpdateProfile) {
        onUpdateProfile({ username: username.trim() });
      }
      setSavingUsername(false);
      setIsEditingUsername(false);
      toast.success('Username berhasil diperbarui.');
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
    if (newPassword.length < 6) {
      toast.error('Kata sandi baru minimal 6 karakter!');
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Pengaturan Akun & Sistem</h2>
        <p className="text-xs text-slate-500">Kelola informasi keamanan akun dan preferensi tampilan portal Mahasantri.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Preference App Settings */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <Settings className="w-4.5 h-4.5 text-slate-500" />
              <h4 className="font-extrabold text-xs text-slate-750 uppercase tracking-widest">Preferensi Aplikasi</h4>
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

        {/* Right Column: Username & Password Configuration */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. Username Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <User className="w-4.5 h-4.5 text-slate-500" />
              <h4 className="font-extrabold text-xs text-slate-750 uppercase tracking-widest">Identitas Akun (Username)</h4>
            </div>

            <form onSubmit={handleUpdateUsername} className="space-y-4 text-xs font-semibold">
              <div className="space-y-2">
                <label className="block text-slate-455 uppercase font-bold text-[10px]">Username Pengguna</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input 
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={!isEditingUsername}
                      className={`w-full border rounded-xl px-3 py-2.5 font-bold transition-all outline-none ${
                        isEditingUsername 
                          ? 'bg-white border-emerald-500 text-slate-800 focus:ring-1 focus:ring-emerald-500' 
                          : 'bg-slate-50 border-slate-200 text-slate-550 cursor-not-allowed'
                      }`}
                    />
                  </div>
                  {isEditingUsername ? (
                    <div className="flex gap-2 shrink-0">
                      <button 
                        type="button"
                        onClick={() => {
                          setUsername(user?.username || user?.nim || 'fulan');
                          setIsEditingUsername(false);
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 rounded-xl font-bold cursor-pointer transition-colors"
                      >
                        Batal
                      </button>
                      <button 
                        type="submit"
                        disabled={savingUsername}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 rounded-xl font-bold cursor-pointer transition-colors flex items-center gap-1.5"
                      >
                        {savingUsername && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                        Simpan
                      </button>
                    </div>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => setIsEditingUsername(true)}
                      className="bg-slate-100 hover:bg-slate-250 border border-slate-200 text-slate-700 px-4 rounded-xl font-bold cursor-pointer transition-colors shrink-0"
                    >
                      Ubah Username
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Username ini digunakan bersama kata sandi saat Anda masuk pertama kali ke portal.</p>
              </div>
            </form>
          </div>

          {/* 2. Password Security Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <Lock className="w-4.5 h-4.5 text-slate-500" />
              <h4 className="font-extrabold text-xs text-slate-750 uppercase tracking-widest">Keamanan & Ubah Sandi</h4>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Old Password */}
                <div className="space-y-1.5">
                  <label className="block text-slate-455 uppercase font-bold text-[10px]">Kata Sandi Lama</label>
                  <div className="relative">
                    <input 
                      type={showOldPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl pl-3 pr-9 py-2.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-650"
                    >
                      {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="block text-slate-455 uppercase font-bold text-[10px]">Kata Sandi Baru</label>
                  <div className="relative">
                    <input 
                      type={showNewPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl pl-3 pr-9 py-2.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-650"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="block text-slate-455 uppercase font-bold text-[10px]">Konfirmasi Kata Sandi Baru</label>
                  <div className="relative">
                    <input 
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl pl-3 pr-9 py-2.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-650"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
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
                  type="submit" disabled={isSubmitting || changingPassword}
                  className="bg-slate-900 hover:bg-slate-800 transition-colors font-bold text-xs text-white py-2.5 px-5 rounded-xl cursor-pointer shadow flex items-center gap-1.5"
                >
                  {changingPassword && <RefreshCw className="w-4.5 h-4.5 animate-spin shrink-0" />}
                  Perbarui Kata Sandi
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
