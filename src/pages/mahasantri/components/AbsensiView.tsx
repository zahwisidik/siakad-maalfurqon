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
  const [notes, setNotes] = useState('');
  const [submittingCheckIn, setSubmittingCheckIn] = useState(false);

  // Detail Modal
  const [selectedAttendance, setSelectedAttendance] = useState<any | null>(null);

  // Scanning QR flow
  const [isScanning, setIsScanning] = useState(false);
  const [gpsVerified, setGpsVerified] = useState(false);

  const uniqueCourses = Array.from(new Set(scheduleList.map(item => item.nama_mk)));

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
    if (!selectedCheckInMK) {
      toast.error('Harap pilih Mata Kuliah terlebih dahulu!');
      return;
    }

    setSubmittingCheckIn(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const selectedMKRecord = scheduleList.find(s => s.nama_mk === selectedCheckInMK);
      
      const newRecord = {
        tanggal: todayStr,
        jam_ke: selectedMKRecord?.jam_ke || '1',
        nama_mk: selectedCheckInMK,
        program: user?.program || "I'dad Lughowi",
        kelas: user?.kelas || "Semester 2 - Putra",
        mahasiswa_id: user?.id || 'm1',
        status: status,
        pembahasan: notes || 'Hadir Kuliah Mandiri',
        timestamp: new Date().toISOString()
      };

      await onAddAbsensi(newRecord);
      setShowCheckInModal(false);
      setCheckInMethod(null);
      setGpsVerified(false);
      setSelectedCheckInMK('');
      setNotes('');
    } catch (err: any) {
      toast.error('Gagal mencatat kehadiran: ' + err.message);
    } finally {
      setSubmittingCheckIn(false);
    }
  };

  // Fake QR scan
  const startScanningQR = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      toast.success('QR Code berhasil diverifikasi!');
      handlePerformCheckIn('hadir');
    }, 2500);
  };

  // Fake GPS scan
  const verifyLocationGPS = () => {
    toast.success('Mengidentifikasi koordinat GPS...', { icon: '🛰️' });
    setTimeout(() => {
      setGpsVerified(true);
      toast.success('Lokasi terverifikasi di area Ma’had Aly (Radius 15m).');
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
            <p className="text-[11px] text-slate-400 mt-1">Syarat wajib kelulusan kelas / akses UAS minimal adalah 75%.</p>
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

          <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-100/70 text-[11px] text-amber-855 flex items-start gap-2 leading-relaxed">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>Jika kehadiran di bawah 75%, modul ujian (KHS) akan tertangguhkan otomatis hingga memperoleh izin khusus dewan mahad.</span>
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
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden relative"
            >
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                  <h3 className="font-bold text-slate-850 text-sm">Check-In Presensi Kelas</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Metode Kehadiran Jam Kuliah Mandiri</p>
                </div>
                <button 
                  onClick={() => {
                    setShowCheckInModal(false);
                    setCheckInMethod(null);
                    setGpsVerified(false);
                  }}
                  className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* No Method Selected */}
              {!checkInMethod ? (
                <div className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase">Mata Kuliah</label>
                    <select 
                      value={selectedCheckInMK}
                      onChange={(e) => setSelectedCheckInMK(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      {uniqueCourses.map((c, idx) => (
                        <option key={idx} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase">Catatan Perkuliahan / Materi</label>
                    <input 
                      type="text"
                      placeholder="Contoh: Pembahasan Al-Ahwal Al-Syakhshiyyah"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="space-y-3 pt-3">
                    <p className="text-xs font-bold text-slate-550 mb-1 leading-none">PILIH METODE VERIFIKASI:</p>
                    
                    {/* Method 1: Scan QR */}
                    <button 
                      onClick={() => setCheckInMethod('qr')}
                      className="w-full p-4.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/10 cursor-pointer text-left flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <QrCode className="w-6 h-6 text-emerald-600" />
                        <div>
                          <p className="text-xs font-bold text-slate-800">Scan QR Code Kelas</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Pindai QR dari proyektor atau kertas Ustadz.</p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-350" />
                    </button>

                    {/* Method 2: GPS Validasi */}
                    <button 
                      onClick={() => setCheckInMethod('gps')}
                      className="w-full p-4.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/10 cursor-pointer text-left flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <MapPin className="w-6 h-6 text-indigo-600" />
                        <div>
                          <p className="text-xs font-bold text-slate-800">Uji Lokasi (GPS Presensi)</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Verifikasi geo-lokasi bahwa Anda berada di komplek mahad.</p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-350" />
                    </button>

                    {/* Method 3: Tombol Hadir direct */}
                    <button 
                      onClick={() => setCheckInMethod('button')}
                      className="w-full p-4.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/10 cursor-pointer text-left flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-6 h-6 text-sky-600" />
                        <div>
                          <p className="text-xs font-bold text-slate-800">Tombol Hadir Cepat</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Satu klik laporkan kehadiran, sakit, atau izin instan.</p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-355" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  {/* QR Method Layout */}
                  {checkInMethod === 'qr' && (
                    <div className="text-center space-y-5">
                      <div className="max-w-[200px] aspect-square rounded-2xl border-2 border-dashed border-emerald-400 bg-slate-50/50 mx-auto flex flex-col justify-center items-center p-3 relative overflow-hidden shadow-inner">
                        {isScanning ? (
                          <>
                            <Camera className="w-10 h-10 text-emerald-600 animate-pulse" />
                            <span className="text-[10px] font-bold text-emerald-600 mt-2 font-mono uppercase tracking-widest">Memindai...</span>
                            <div className="absolute top-0 bottom-0 left-0 right-0 border-t-2 border-emerald-500 animate-[bounce_2s_infinite]"></div>
                          </>
                        ) : (
                          <>
                            <QrCode className="w-12 h-12 text-slate-300" />
                            <button 
                              onClick={startScanningQR}
                              className="mt-3 bg-emerald-600 hover:bg-emerald-755 text-white py-1 px-3.5 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                            >
                              Gunakan Kamera
                            </button>
                          </>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                        Arahkan kamera ke QR Code kelas yang ditampilkan di papan tulis atau lembar lembar kehadiran.
                      </p>
                    </div>
                  )}

                  {/* GPS Method Layout */}
                  {checkInMethod === 'gps' && (
                    <div className="text-center space-y-5">
                      <div className="w-20 h-20 rounded-full bg-slate-50 border border-slate-200 mx-auto flex items-center justify-center text-slate-400 relative">
                        {gpsVerified ? (
                          <motion.div 
                            initial={{ scale: 0.5, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-emerald-100 text-emerald-700 w-full h-full rounded-full flex items-center justify-center border border-emerald-300"
                          >
                            <CheckCircle2 className="w-10 h-10" />
                          </motion.div>
                        ) : (
                          <MapPin className="w-10 h-10 text-rose-500 animate-bounce" />
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <p className="text-xs font-bold text-slate-800">
                          {gpsVerified ? 'Satelit Ditemukan' : 'Mencari Koordinat Perangkat'}
                        </p>
                        <p className="text-[10px] text-slate-400 leading-relaxed">
                          {gpsVerified 
                            ? 'Koordinat GPS Anda verified: -7.4816154, 110.2198031' 
                            : 'Pastikan setelan izin akses lokasi/GPS di browser sudah menyala.'
                          }
                        </p>
                      </div>

                      {gpsVerified ? (
                        <button 
                          onClick={() => handlePerformCheckIn('hadir')}
                          disabled={submittingCheckIn}
                          className="w-full bg-emerald-600 hover:bg-emerald-755 text-white font-bold text-xs py-2.5 rounded-xl shadow cursor-pointer transition-colors"
                        >
                          Kirim Kehadiran G-Sheets
                        </button>
                      ) : (
                        <button 
                          onClick={verifyLocationGPS}
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl shadow cursor-pointer transition-colors"
                        >
                          Verifikasi Lokasi Sekarang
                        </button>
                      )}
                    </div>
                  )}

                  {/* Direct Buttons Method */}
                  {checkInMethod === 'button' && (
                    <div className="space-y-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase text-center mb-1">PILIH STATUS LEMBAR KEHADIRAN:</p>
                      <div className="grid grid-cols-3 gap-2">
                        <button 
                          onClick={() => handlePerformCheckIn('hadir')}
                          className="p-3 bg-emerald-55 border border-emerald-200 rounded-xl font-bold text-xs text-emerald-750 hover:bg-emerald-100 transition-all cursor-pointer text-center"
                        >
                          Hadir
                        </button>
                        <button 
                          onClick={() => handlePerformCheckIn('izin')}
                          className="p-3 bg-sky-50 border border-sky-200 rounded-xl font-bold text-xs text-sky-750 hover:bg-sky-100 transition-all cursor-pointer text-center"
                        >
                          Izin
                        </button>
                        <button 
                          onClick={() => handlePerformCheckIn('sakit')}
                          className="p-3 bg-rose-50 border border-rose-200 rounded-xl font-bold text-xs text-rose-750 hover:bg-rose-100 transition-all cursor-pointer text-center"
                        >
                          Sakit
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 italic text-center text-slate-450 mt-2">
                        Pilihan status "Izin" atau "Sakit" harap menyertakan keterangan di kolom catatan sebelumnya.
                      </p>
                    </div>
                  )}

                  {/* Back Link */}
                  <div className="mt-5 pt-3.5 border-t border-slate-100 text-center">
                    <button 
                      onClick={() => {
                        setCheckInMethod(null);
                        setGpsVerified(false);
                      }}
                      className="text-xs font-bold text-slate-500 hover:text-slate-800 underline cursor-pointer"
                    >
                      Kembali ke Pilihan Metode
                    </button>
                  </div>
                </div>
              )}
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
