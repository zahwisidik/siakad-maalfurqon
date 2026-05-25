import { useState } from 'react';
import { 
  QrCode, 
  MapPin, 
  CheckCircle2, 
  Calendar, 
  Filter, 
  RefreshCw, 
  X, 
  Camera, 
  Compass, 
  ArrowRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

// Allowed date range for self study attendance semester
export const SEMESTER_START_DATE = '2026-02-01'; // 1 Feb 2026
export const SEMESTER_END_DATE = '2026-07-20';   // 20 Jul 2026

export const TIME_SLOTS: Record<string, { start: string; end: string }> = {
  '1': { start: '07:30', end: '08:15' },
  '2': { start: '08:15', end: '09:00' },
  '3': { start: '09:00', end: '09:45' },
  '4': { start: '09:45', end: '10:30' },
  '5': { start: '10:30', end: '11:15' },
  '6': { start: '11:15', end: '12:00' },
};

export const getDeviceTimeValidation = (jamKe: string) => {
  const slot = TIME_SLOTS[jamKe];
  if (!slot) return { valid: true, errorMsg: '', text: '' };

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeString = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

  const slotStartVal = slot.start.replace(':', '');
  const slotEndVal = slot.end.replace(':', '');
  const currentVal = currentTimeString.replace(':', '');

  const startFormatted = slot.start.replace(':', '.');
  const endFormatted = slot.end.replace(':', '.');
  const currentFormatted = currentTimeString.replace(':', '.');

  if (currentVal < slotStartVal) {
    return {
      valid: false,
      errorMsg: `Waktu di device Anda (${currentFormatted}) kurang dari rentang Jam ke-${jamKe} (${startFormatted} - ${endFormatted})!`,
      text: `⚠️ Kurang dari rentang: Jam ke-${jamKe} adalah ${startFormatted} - ${endFormatted}, waktu device Anda ${currentFormatted}.`
    };
  } else if (currentVal > slotEndVal) {
    return {
      valid: false,
      errorMsg: `Waktu di device Anda (${currentFormatted}) melebihi rentang Jam ke-${jamKe} (${startFormatted} - ${endFormatted})!`,
      text: `⚠️ Melebihi rentang: Jam ke-${jamKe} adalah ${startFormatted} - ${endFormatted}, waktu device Anda ${currentFormatted}.`
    };
  }

  return {
    valid: true,
    errorMsg: '',
    text: `✓ Waktu device (${currentFormatted}) sesuai dengan rentang Jam ke-${jamKe} (${startFormatted} - ${endFormatted}).`
  };
};

interface AbsensiViewProps {
  user: any;
  scheduleList: any[];
  attendanceList: any[];
  onAddAbsensi: (newRecord: any) => Promise<void>;
  loadingData: boolean;
}

export default function AbsensiView({ 
  user, 
  scheduleList, 
  attendanceList, 
  onAddAbsensi,
  loadingData 
}: AbsensiViewProps) {
  const [selectedSemester, setSelectedSemester] = useState('Genap');
  const [selectedMK, setSelectedMK] = useState('Semua');
  const [dateRange, setDateRange] = useState('');
  
  // Interactive features
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [checkInMethod, setCheckInMethod] = useState<'qr' | 'button' | 'gps' | null>(null);
  const [selectedCheckInMK, setSelectedCheckInMK] = useState('');
  const [selectedCheckInKelas, setSelectedCheckInKelas] = useState('');
  const [selectedCheckInJamKe, setSelectedCheckInJamKe] = useState('1');
  const [selectedCheckInTanggal, setSelectedCheckInTanggal] = useState('');
  const [notes, setNotes] = useState('');
  const [submittingCheckIn, setSubmittingCheckIn] = useState(false);

  // Detail Modal
  const [selectedAttendance, setSelectedAttendance] = useState<any | null>(null);

  // Scanning QR flow
  const [isScanning, setIsScanning] = useState(false);
  const [gpsVerified, setGpsVerified] = useState(false);

  const uniqueCourses = Array.from(
    new Set(
      scheduleList
        .map(item => (item.nama_mk || item.matakuliah || '').trim())
        .filter(Boolean)
    )
  );

  const uniqueClassesOptions = Array.from(
    new Set([
      ...(user?.kelas ? [user.kelas] : []),
      ...scheduleList.map(item => item.kelas).filter(Boolean),
      "Semester 2 - Putra",
      "Semester 1 - Putri"
    ])
  );

  const validateCheckInForm = () => {
    if (!selectedCheckInMK) {
      toast.error('Harap pilih Mata Kuliah terlebih dahulu!');
      return false;
    }
    if (!selectedCheckInKelas) {
      toast.error('Harap pilih Kelas terlebih dahulu!');
      return false;
    }
    if (!selectedCheckInJamKe) {
      toast.error('Harap pilih Jam Ke terlebih dahulu!');
      return false;
    }
    if (!selectedCheckInTanggal) {
      toast.error('Harap isi Tanggal absensi terlebih dahulu!');
      return false;
    }
    
    if (selectedCheckInTanggal < SEMESTER_START_DATE) {
      toast.error('Gagal: Tanggal absensi kurang dari rentang jadwal kuliah aktif (sebelum 1 Februari 2026)!');
      return false;
    }
    if (selectedCheckInTanggal > SEMESTER_END_DATE) {
      toast.error('Gagal: Tanggal absensi melebihi rentang jadwal kuliah aktif (setelah 20 Juli 2026)!');
      return false;
    }

    // Check device time matches the selected Jam Ke
    const timeVal = getDeviceTimeValidation(selectedCheckInJamKe);
    if (!timeVal.valid) {
      toast.error(`Gagal: ${timeVal.errorMsg}`);
      return false;
    }

    return true;
  };

  // Filter attendance
  const filteredAttendance = attendanceList.filter((att) => {
    // filter by course if selected
    if (selectedMK !== 'Semua' && att.nama_mk !== selectedMK) return false;
    
    // filter by date range prefix if set
    if (dateRange && att.tanggal !== dateRange) return false;

    return true;
  });

  // Calculate Rekap Kehadiran progress bars per subject in schedule
  const subjectProgress = uniqueCourses.map((mk) => {
    const totalSubjectSessions = attendanceList.filter(a => a.nama_mk === mk).length;
    const presentCount = attendanceList.filter(a => a.nama_mk === mk && (a.status === 'hadir' || a.status === 'terlambat')).length;
    
    const sessions = totalSubjectSessions;
    const presents = presentCount;
    const percentage = sessions > 0 ? Math.round((presents / sessions) * 100) : 100;

    return {
      name: mk,
      percentage,
      sessions,
      presents,
    };
  });

  // Execute check in
  const handlePerformCheckIn = async (status: 'hadir' | 'izin' | 'sakit' = 'hadir') => {
    if (!validateCheckInForm()) {
      return;
    }

    setSubmittingCheckIn(true);
    const toastId = toast.loading('Sedang mengirim data presensi...');
    try {
      const cleanNotes = notes.trim();
      const newRecord = {
        tanggal: selectedCheckInTanggal,
        jam_ke: selectedCheckInJamKe,
        nama_mk: selectedCheckInMK,
        program: user?.program || "I'dad Lughowi",
        kelas: selectedCheckInKelas,
        mahasiswa_id: user?.id || 'm1',
        status: status,
        pembahasan: cleanNotes,
        timestamp: new Date().toISOString()
      };

      await onAddAbsensi(newRecord);
      toast.success(`Berhasil! Presensi "${status.toUpperCase()}" telah tercatat.`, { id: toastId });
      setShowCheckInModal(false);
      setCheckInMethod(null);
      setGpsVerified(false);
      setSelectedCheckInMK('');
      setSelectedCheckInKelas('');
      setSelectedCheckInJamKe('1');
      setSelectedCheckInTanggal('');
      setNotes('');
    } catch (err: any) {
      toast.error('Gagal mencatat kehadiran: ' + err.message, { id: toastId });
    } finally {
      setSubmittingCheckIn(false);
    }
  };

  // Fake QR scan
  const startScanningQR = () => {
    setIsScanning(true);
    const toastId = toast.loading('Sedang memindai QR Code kelas...');
    setTimeout(() => {
      setIsScanning(false);
      toast.success('Kamera berhasil memindai! Pasangan QR Code cocok.', { id: toastId });
      handlePerformCheckIn('hadir');
    }, 2500);
  };

  // Fake GPS scan
  const verifyLocationGPS = () => {
    const toastId = toast.loading('Sedang mendeteksi sinyal GPS & koordinat lokasi...', { icon: '🛰️' });
    setTimeout(() => {
      setGpsVerified(true);
      toast.success('Berhasil! Lokasi terdeteksi di Kampus Utama Ma’had (Radius 15 Mtr).', { id: toastId });
    }, 1800);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner and Realtime Check-in trigger */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Presensi Kuliah Digital</h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Lakukan input dan verifikasi kehadiran Anda secara instan menggunakan metode Scan QR kelas, GPS koordinat, atau tombol hadir mandiri.
          </p>
        </div>
        <button 
          onClick={() => {
            if (uniqueCourses.length > 0) setSelectedCheckInMK(uniqueCourses[0]);
            setSelectedCheckInKelas(user?.kelas || (uniqueClassesOptions[0] || ''));
            setSelectedCheckInJamKe('1');
            setSelectedCheckInTanggal(new Date().toISOString().split('T')[0]);
            setShowCheckInModal(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-100 shadow transition-all cursor-pointer font-bold text-sm text-white px-5 py-2.5 rounded-xl inline-flex items-center gap-2"
        >
          <QrCode className="w-5 h-5" />
          Absen Sekarang
        </button>
      </div>

      {/* Grid: Progressive Rekap and Filters & Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Progress bars (Rekap Kehadiran) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-5">
          <div>
            <h3 className="font-bold text-slate-850 text-sm">Persentase Kehadiran Per Mata Kuliah</h3>
            <p className="text-[11px] text-slate-400 mt-1">Syarat wajib kelulusan kelas / akses UAS minimal adalah 70%.</p>
          </div>

          <div className="space-y-4">
            {subjectProgress.map((prog, index) => {
              const isWarning = prog.percentage < 75;
              return (
                <div key={index} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-705 leading-none shrink-0">{prog.name}</span>
                    <span className={`font-mono font-bold shrink-0 ${isWarning ? 'text-rose-600' : 'text-emerald-750'}`}>
                      {prog.percentage}% ({prog.presents}/{prog.sessions} Sesi)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${
                        isWarning ? 'bg-gradient-to-r from-red-500 to-rose-400' : 'bg-gradient-to-r from-emerald-600 to-teal-400'
                      }`}
                      style={{ width: `${prog.percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>


        </div>

        {/* Filters and Table List of Presensi */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-emerald-600" />
              Daftar Riwayat Kehadiran
            </h3>

            <div className="flex flex-wrap items-center gap-2">
              {/* MK Filter */}
              <select 
                value={selectedMK} 
                onChange={(e) => setSelectedMK(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="Semua">Semua Mata Kuliah</option>
                {uniqueCourses.map((c, idx) => (
                  <option key={idx} value={c}>{c}</option>
                ))}
              </select>

              {/* Date Input Filter */}
              <input 
                type="date" 
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Table / List */}
          {loadingData ? (
            <div className="flex justify-center items-center py-10 text-emerald-600">
              <RefreshCw className="animate-spin w-6 h-6" />
            </div>
          ) : filteredAttendance.length === 0 ? (
            <div className="py-14 text-center text-slate-450 text-xs font-semibold">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              Tidak ada data riwayat presensi yang sesuai dengan filter Anda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-150">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tanggal</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mata Kuliah / Pembahasan</th>
                    <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jam Ke-</th>
                    <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAttendance.slice().reverse().map((att, i) => (
                    <tr 
                      key={att.id || i}
                      className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedAttendance(att)}
                    >
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs font-semibold text-slate-600 font-mono">
                        {att.tanggal}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-xs font-bold text-slate-800 line-clamp-1">{att.nama_mk}</p>
                        {att.pembahasan && (
                          <p className="text-[10px] text-slate-400 line-clamp-1 italic mt-0.5 font-mono">
                            Materi: {att.pembahasan}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center text-xs font-mono font-bold text-slate-600 bg-slate-50/20">
                        {att.jam_ke}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-center text-xs">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border leading-tight inline-block ${
                          att.status === 'hadir' 
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-150'
                            : att.status === 'izin' || att.status === 'sakit'
                            ? 'text-sky-700 bg-sky-50 border-sky-150'
                            : 'text-rose-700 bg-rose-50 border-rose-150'
                        }`}>
                          {att.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Main Check-In Modal */}
      <AnimatePresence>
        {showCheckInModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg md:max-w-2xl max-h-[90vh] md:max-h-[85vh] flex flex-col overflow-hidden relative font-sans"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm md:text-base">Check-In Presensi Kelas</h3>
                  <p className="text-[10px] md:text-xs text-slate-400 mt-0.5">Formulir Kehadiran Jam Kuliah Mandiri</p>
                </div>
                <button 
                  onClick={() => {
                    setShowCheckInModal(false);
                    setCheckInMethod(null);
                    setGpsVerified(false);
                  }}
                  className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body Helper wrapper */}
              <div className="overflow-y-auto flex-1 p-5 md:p-6 space-y-4">
                {/* No Method Selected (Main Input Form) */}
                {!checkInMethod ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                    {/* Left Column - Academic & Schedule Settings */}
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Mata Kuliah</label>
                        <select 
                          value={selectedCheckInMK}
                          onChange={(e) => setSelectedCheckInMK(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          {uniqueCourses.map((c, idx) => (
                            <option key={idx} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Kelas</label>
                        <select 
                          value={selectedCheckInKelas}
                          onChange={(e) => setSelectedCheckInKelas(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          {uniqueClassesOptions.map((k, idx) => (
                            <option key={idx} value={k}>{k}</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {/* Jam Ke Dropdown */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Jam Ke-</label>
                          <select 
                            value={selectedCheckInJamKe}
                            onChange={(e) => setSelectedCheckInJamKe(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          >
                            {["1", "2", "3", "4", "5"].map((j) => (
                              <option key={j} value={j}>{j}</option>
                            ))}
                          </select>
                        </div>

                        {/* Tanggal Input */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Tanggal</label>
                          <input 
                            type="date"
                            value={selectedCheckInTanggal}
                            onChange={(e) => setSelectedCheckInTanggal(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Catatan Perkuliahan / Materi</label>
                        <input 
                          type="text"
                          placeholder="Contoh: Pembahasan Al-Ahwal Al-Syakhshiyyah"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Right Column - Rentang Validasi & Metode Absen */}
                    <div className="flex flex-col justify-between space-y-5">
                      {/* Live Time status validation message */}
                      <div className="space-y-1.5 text-[11px] font-sans">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Status Validasi Jadwal</label>

                        {(() => {
                          const timeVal = getDeviceTimeValidation(selectedCheckInJamKe);
                          if (!timeVal.valid) {
                            return (
                              <div className="text-rose-700 font-bold bg-rose-50 border border-rose-100 p-3 rounded-xl flex items-center justify-between">
                                <span className="text-slate-600 font-semibold">Kesesuaian Waktu Kuliah</span>
                                <span className="bg-rose-100/80 text-rose-800 px-3 py-1 rounded-full text-[10px] uppercase font-extrabold tracking-wider">Tidak Sesuai</span>
                              </div>
                            );
                          }
                          return (
                            <div className="text-emerald-850 font-bold bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex items-center justify-between">
                              <span className="text-slate-600 font-semibold">Kesesuaian Waktu Kuliah</span>
                              <span className="bg-emerald-100/80 text-emerald-800 px-3 py-1 rounded-full text-[10px] uppercase font-extrabold tracking-wider">Sesuai</span>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Direct Clickable Verification Methods */}
                      <div className="space-y-2.5">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Pilih Cara Submit Absen:</p>
                        
                        {/* Method 1: Scan QR */}
                        <button 
                          onClick={() => {
                            if (validateCheckInForm()) setCheckInMethod('qr');
                          }}
                          className="w-full p-3 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/20 cursor-pointer text-left flex items-center justify-between transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <QrCode className="w-5 h-5 text-emerald-600 shrink-0 group-hover:scale-110 transition-transform" />
                            <div>
                              <p className="text-xs font-bold text-slate-800 leading-snug">Scan QR Code Kelas</p>
                              <p className="text-[10px] text-slate-450 mt-0.5">Scan proyektor kelas ustadz</p>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-350 transition-transform group-hover:translate-x-1" />
                        </button>
     
                        {/* Method 2: GPS Validasi */}
                        <button 
                          onClick={() => {
                            if (validateCheckInForm()) setCheckInMethod('gps');
                          }}
                          className="w-full p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/20 cursor-pointer text-left flex items-center justify-between transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <MapPin className="w-5 h-5 text-indigo-600 shrink-0 group-hover:scale-110 transition-transform" />
                            <div>
                              <p className="text-xs font-bold text-slate-800 leading-snug">Deteksi Lokasi (GPS)</p>
                              <p className="text-[10px] text-slate-455 mt-0.5">Verifikasi koordinat di lokasi Ma'had</p>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-350 transition-transform group-hover:translate-x-1" />
                        </button>
     
                        {/* Method 3: Tombol Hadir direct */}
                        <button 
                          onClick={() => {
                            if (validateCheckInForm()) setCheckInMethod('button');
                          }}
                          className="w-full p-3 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/20 cursor-pointer text-left flex items-center justify-between transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-sky-600 shrink-0 group-hover:scale-110 transition-transform" />
                            <div>
                              <p className="text-xs font-bold text-slate-800 leading-snug">Unggah Lembar Cepat / Sakit / Izin</p>
                              <p className="text-[10px] text-slate-450 mt-0.5">Laporkan status kehadiran instan</p>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-355 transition-transform group-hover:translate-x-1" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 py-2">
                    {/* QR Method Layout */}
                    {checkInMethod === 'qr' && (
                      <div className="text-center space-y-4 max-w-sm mx-auto">
                        <div className="max-w-[180px] aspect-square rounded-2xl border-2 border-dashed border-emerald-400 bg-slate-50/50 mx-auto flex flex-col justify-center items-center p-3 relative overflow-hidden shadow-inner">
                          {isScanning ? (
                            <>
                              <Camera className="w-8 h-8 text-emerald-600 animate-pulse" />
                              <span className="text-[10px] font-bold text-emerald-600 mt-2 font-mono uppercase tracking-widest">Memindai...</span>
                              <div className="absolute top-0 bottom-0 left-0 right-0 border-t-2 border-emerald-500 animate-[bounce_2s_infinite]"></div>
                            </>
                          ) : (
                            <>
                              <QrCode className="w-10 h-10 text-slate-300" />
                              <button 
                                onClick={startScanningQR}
                                className="mt-3 bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 px-3.5 rounded-lg text-[11px] font-bold transition-all shadow-sm cursor-pointer"
                              >
                                Aktifkan Kamera
                              </button>
                            </>
                          )}
                        </div>
                        <p className="text-[11px] font-medium text-slate-500 leading-relaxed px-2">
                          Arahkan kamera ke QR Code kelas yang disediakan oleh Ustadz di papan tulis atau lembar digital.
                        </p>
                      </div>
                    )}

                    {/* GPS Method Layout */}
                    {checkInMethod === 'gps' && (
                      <div className="text-center space-y-4 max-w-sm mx-auto">
                        <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-200 mx-auto flex items-center justify-center text-slate-400 relative">
                          {gpsVerified ? (
                            <motion.div 
                              initial={{ scale: 0.5, opacity: 0 }} 
                              animate={{ scale: 1, opacity: 1 }}
                              className="bg-emerald-100 text-emerald-700 w-full h-full rounded-full flex items-center justify-center border border-emerald-350"
                            >
                              <CheckCircle2 className="w-8 h-8" />
                            </motion.div>
                          ) : (
                            <MapPin className="w-8 h-8 text-rose-500 animate-bounce" />
                          )}
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-800">
                            {gpsVerified ? 'Satelit Terkunci' : 'Mencari Lokasi Perangkat'}
                          </p>
                          <p className="text-[10px] text-slate-400 leading-relaxed px-4">
                            {gpsVerified 
                              ? 'Lokasi Anda terverifikasi di wilayah koordinat kampus utama mahad.' 
                              : 'Pastikan sinyal stabil & setelan "Izinkan lokasi" di browser sudah aktif.'
                            }
                          </p>
                        </div>

                        {gpsVerified ? (
                          <button 
                            onClick={() => handlePerformCheckIn('hadir')}
                            disabled={submittingCheckIn}
                            className="w-full bg-emerald-600 hover:bg-emerald-750 text-white font-bold text-xs py-2.5 rounded-xl shadow cursor-pointer transition-colors"
                          >
                            Kirim Kehadiran G-Sheets
                          </button>
                        ) : (
                          <button 
                            onClick={verifyLocationGPS}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl shadow cursor-pointer transition-colors"
                          >
                            Verifikasi GPS Sekarang
                          </button>
                        )}
                      </div>
                    )}

                    {/* Direct Buttons Method */}
                    {checkInMethod === 'button' && (
                      <div className="space-y-4 max-w-sm mx-auto">
                        <p className="text-[10px] font-bold text-slate-400 uppercase text-center tracking-widest leading-none">PILIH STATUS KEHADIRAN:</p>
                        <div className="grid grid-cols-3 gap-2 pb-1">
                          <button 
                            onClick={() => handlePerformCheckIn('hadir')}
                            className="p-3 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100/80 rounded-xl font-bold text-xs text-emerald-800 transition-all cursor-pointer text-center"
                          >
                            Hadir
                          </button>
                          <button 
                            onClick={() => handlePerformCheckIn('izin')}
                            className="p-3 bg-sky-50 border border-sky-200 hover:bg-sky-100/85 rounded-xl font-bold text-xs text-sky-800 transition-all cursor-pointer text-center"
                          >
                            Izin
                          </button>
                          <button 
                            onClick={() => handlePerformCheckIn('sakit')}
                            className="p-3 bg-rose-50 border border-rose-205 hover:bg-rose-100/85 rounded-xl font-bold text-xs text-rose-800 transition-all cursor-pointer text-center"
                          >
                            Sakit
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400 italic text-center leading-normal px-2">
                          ✓ Apabila memilih status "Izin" atau "Sakit", Anda wajib melampirkan keterangan pada isian kolom catatan sebelumnya.
                        </p>
                      </div>
                    )}

                    {/* Back Link to options screen */}
                    <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                      <button 
                        onClick={() => {
                          setCheckInMethod(null);
                          setGpsVerified(false);
                        }}
                        className="text-xs font-bold text-slate-500 hover:text-slate-800 hover:underline cursor-pointer transition-all"
                      >
                        Kembali ke Pilihan Metode
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Detail Record Attendance Modal */}
      <AnimatePresence>
        {selectedAttendance && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <span className="font-bold text-xs text-slate-805">Detail Presensi Pertemuan</span>
                <button 
                  onClick={() => setSelectedAttendance(null)}
                  className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-4 text-xs select-none">
                <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-slate-400 font-semibold block tracking-wide">TANGGAL</span>
                    <span className="text-slate-800 font-bold font-mono text-xs">{selectedAttendance.tanggal}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block tracking-wide">STATUS</span>
                    <span className="text-slate-800 font-bold uppercase">{selectedAttendance.status}</span>
                  </div>
                </div>

                <div className="space-y-1 bg-slate-50 border border-slate-150 p-3 rounded-xl">
                  <span className="text-slate-400 font-bold block shrink-0">MATA KULIAH</span>
                  <span className="text-[13px] font-extrabold text-slate-850 block">{selectedAttendance.nama_mk}</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400 font-semibold block">JAM KE</span>
                    <span className="text-slate-800 font-mono font-bold">Jam ke-{selectedAttendance.jam_ke}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">KELAS</span>
                    <span className="text-slate-800 font-semibold">{selectedAttendance.kelas}</span>
                  </div>
                </div>

                <div className="space-y-1 pt-1.5">
                  <span className="text-slate-450 font-bold block">MATERI PEMBAHASAN / REMARKS</span>
                  <p className="text-slate-600 bg-indigo-50/20 p-2.5 rounded-lg border border-indigo-100/55 text-[11px] font-mono leading-relaxed select-text">
                    {selectedAttendance.pembahasan || 'Pembahasan materi dasar.'}
                  </p>
                </div>

                <div className="pt-2 text-slate-400 text-[10px] text-center font-mono">
                  Timestamp: {selectedAttendance.timestamp || '-'}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
