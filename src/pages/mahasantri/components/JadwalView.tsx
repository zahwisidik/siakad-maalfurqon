import { useState } from 'react';
import { 
  Calendar, 
  MapPin, 
  User, 
  ExternalLink, 
  Clock, 
  FileText, 
  Grid, 
  List, 
  CalendarDays,
  ChevronRight,
  Info,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { formatTimeDisplay } from '../../../utils/time';

interface JadwalViewProps {
  scheduleList: any[];
}

export default function JadwalView({ scheduleList }: JadwalViewProps) {
  const [viewMode, setViewMode] = useState<'harian' | 'mingguan' | 'kalender'>('harian');
  const [selectedJadwal, setSelectedJadwal] = useState<any | null>(null);

  const daysOfWeek = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  // Current Indonesian day
  const todayIndo = () => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[new Date().getDay()];
  };
  const currentDay = todayIndo();

  // Academic Calendar dates mockup
  const academicEvents = [
    { tanggal: '15 - 20 Juni 2026', event: 'Ujian Tengah Semester (UTS)', status: 'Mendatang', type: 'uts', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { tanggal: '13 - 18 Juli 2026', event: 'Hari Tenang Persiapan UAS', status: 'Mendatang', type: 'tenang', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { tanggal: '20 - 25 Juli 2026', event: 'Ujian Akhir Semester (UAS)', status: 'Mendatang', type: 'uas', color: 'bg-rose-50 text-rose-700 border-rose-200' },
    { tanggal: '26 Juli - 15 Agust 2026', event: 'Libur Panjang & Evaluasi Syahadah', status: 'Mendatang', type: 'libur', color: 'bg-emerald-50 text-emerald-700 border-emerald-250' },
  ];

  // Helper mock room
  const getRuangClass = (mk: string) => {
    if (mk.toLowerCase().includes('nahwu')) return 'Lantai 1 - Ruang Syafii';
    if (mk.toLowerCase().includes('fiqih')) return 'Lantai 2 - Ruang Ghazali';
    if (mk.toLowerCase().includes('arab')) return 'Lantai 1 - Ruang Hambali';
    return 'Lantai 2 - Ruang Maudi';
  };

  const downloadMaterial = (mk: string) => {
    toast.success(`Mengunduh Silabus & Diktat Kitab ${mk}...`, { icon: '📖' });
  };

  return (
    <div className="space-y-6">

      {/* Top Controller */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-805">Jadwal Perkuliahan & Kalender Akademik</h2>
          <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Atur prioritas belajar dengan memantau jadwal harian, mingguan, maupun agenda penting madrasah.</p>
        </div>

        {/* View Mode Selectors */}
        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-150 gap-1 w-full sm:w-auto overflow-x-auto shrink-0">
          <button 
            onClick={() => setViewMode('harian')}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
              viewMode === 'harian' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <List className="w-4.5 h-4.5" />
            Hari Ini
          </button>
          <button 
            onClick={() => setViewMode('mingguan')}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
              viewMode === 'mingguan' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Grid className="w-4.5 h-4.5" />
            Mingguan
          </button>
          <button 
            onClick={() => setViewMode('kalender')}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
              viewMode === 'kalender' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4.5 h-4.5" />
            Milestones
          </button>
        </div>
      </div>

      {/* 1. VIEW HARIAN (TODAY'S VIEW) */}
      {viewMode === 'harian' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-805 text-sm flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-600" />
                Daftar Mata Kuliah - Hari Ini ({currentDay})
              </h3>
              <span className="text-[11px] font-mono text-slate-400 font-bold uppercase">TA. 2025/2026</span>
            </div>

            {scheduleList.filter(s => s.hari?.toLowerCase() === currentDay.toLowerCase()).length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <CalendarDays className="w-8 h-8 text-slate-305 mx-auto" />
                <p className="text-slate-500 text-xs font-semibold">Tidakan ada agenda perkuliahan hari ini.</p>
                <p className="text-[10px] text-slate-400">Silakan tengok jadwal hari lainnya pada menu "Mingguan".</p>
              </div>
            ) : (
              <div className="space-y-4 pt-1">
                {scheduleList
                  .filter(s => s.hari?.toLowerCase() === currentDay.toLowerCase())
                  .map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => setSelectedJadwal(item)}
                      className="p-4 rounded-xl border border-slate-150 hover:border-emerald-300 hover:bg-emerald-50/5 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <p className="font-extrabold text-slate-800 text-sm">{item.nama_mk}</p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-450 font-medium">
                          <span className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-slate-400" /> {item.pengajar}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {getRuangClass(item.nama_mk)}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-2.5 border-t sm:border-0 pt-2 sm:pt-0 border-slate-100 font-mono text-xs font-bold text-slate-700">
                        <span className="p-1 px-2.5 bg-slate-50 border border-slate-150 rounded-lg">
                          {formatTimeDisplay(item.jam_mulai)} - {formatTimeDisplay(item.jam_berakhir)}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-350" />
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Quick Academic Tips sidebar */}
          <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white rounded-2xl p-6 relative overflow-hidden shadow-sm flex flex-col justify-between space-y-6">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Calendar className="w-32 h-32" />
            </div>
            
            <div className="space-y-3">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20 font-bold uppercase tracking-wider">
                Adab Penuntut Ilmu
              </span>
              <h4 className="font-bold text-base leading-snug">Menghadiri Majelis Ilmu Tepat Waktu</h4>
              <p className="text-slate-350 text-[11px] leading-relaxed">
                "Barangsiapa menempuh suatu jalan untuk mencari ilmu, maka Allah akan memudahkan baginya jalan menuju surga." (HR. Muslim). Dianjurkan hadir 10 menit sebelum jam perkuliahan di mulai.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-[11px] text-slate-300">
              <span className="font-bold text-emerald-400">Pemberitahuan:</span> Ruang kelas luring dapat berubah sewaktu-waktu tergantung koordinasi dari Pengawas Asrama.
            </div>
          </div>
        </div>
      )}

      {/* 2. VIEW MINGGUAN (WEEKLY MATRIX) */}
      {viewMode === 'mingguan' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-805 text-sm flex items-center gap-1.5">
              <Grid className="w-5 h-5 text-emerald-600" />
              Matriks Jadwal Kuliah Mingguan
            </h3>
            <span className="text-[11px] font-sans text-slate-500">Program: <strong className="text-slate-800">Semester ini</strong></span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {daysOfWeek.map((day) => {
              const schedulesForDay = scheduleList.filter(s => s.hari?.toLowerCase() === day.toLowerCase());
              return (
                <div key={day} className="p-4 rounded-xl border border-slate-150 bg-slate-55 flex flex-col space-y-3 min-h-[160px]">
                  <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/80">
                    <span className="font-extrabold text-sm text-slate-850">{day}</span>
                    <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-500 py-0.5 px-1.5 rounded">
                      {schedulesForDay.length} Pelajaran
                    </span>
                  </div>

                  {schedulesForDay.length === 0 ? (
                    <p className="text-slate-400 font-medium text-[10px] italic py-6 text-center select-none">Kosong</p>
                  ) : (
                    <div className="space-y-2 mt-1">
                      {schedulesForDay.map((item) => (
                        <div 
                          key={item.id} 
                          onClick={() => setSelectedJadwal(item)}
                          className="bg-white p-2.5 rounded-lg border border-slate-200/70 hover:border-emerald-300 shadow-2xs cursor-pointer transition-all space-y-1 text-left"
                        >
                          <p className="font-bold text-slate-800 text-xs truncate leading-tight">{item.nama_mk}</p>
                          <p className="text-slate-450 text-[10px] truncate">{item.pengajar}</p>
                          <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono pt-1 border-t border-slate-100">
                            <span>Jam {item.jam_ke}</span>
                            <span className="font-semibold text-slate-600">{formatTimeDisplay(item.jam_mulai)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. VIEW KALENDER (ACADEMIC CALENDAR) */}
      {viewMode === 'kalender' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-805 text-sm pb-2 border-b border-slate-100 flex items-center gap-1.5">
              <Calendar className="w-5 h-5 text-emerald-600" />
              Agenda Penting & Milestones Akademik
            </h3>

            <div className="space-y-3 pt-1">
              {academicEvents.map((ev, i) => (
                <div key={i} className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between sm:items-center gap-3 ${ev.color}`}>
                  <div className="space-y-1">
                    <p className="font-bold text-sm tracking-tight">{ev.event}</p>
                    <p className="text-[11px] opacity-75 font-mono">{ev.tanggal}</p>
                  </div>
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-white/40 shadow-2xs border border-current">
                      {ev.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SKS Academic policy info */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 text-xs leading-relaxed text-slate-600">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide">Ketentuan Administrasi Ujian</h4>
            <ul className="space-y-2 list-disc pl-4 text-[11px] text-slate-550">
              <li>Pemberian Kartu Evaluasi Ujian (KHS) dikondisikan sisa tunggakan administrasi asrama lunas.</li>
              <li>Wajib mengikuti bimbingan murojaah bersama Dosen wali min. 2 kali dalam 1 semester.</li>
              <li>Kehadiran di bawah 75% otomatis dinyatakan gugur dari kesempatan mengikuti UAS kecuali melampirkan udzur syar'i bermaterai.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Expanded Class Schedule Detail Modal */}
      <AnimatePresence>
        {selectedJadwal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <span className="font-bold text-xs text-slate-805 uppercase tracking-wider">Detail Informasi Jadwal</span>
                <button 
                  onClick={() => setSelectedJadwal(null)}
                  className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">MATA KULIAH</span>
                  <span className="text-sm font-black text-slate-850 mt-1 block leading-tight">{selectedJadwal.nama_mk}</span>
                </div>

                <div className="space-y-1 px-3 py-2.5 bg-slate-55 border border-slate-150 rounded-xl">
                  <span className="text-[10px] text-slate-450 font-bold block">DOSEN / USTADZ PENGAMPU</span>
                  <span className="text-xs font-bold text-slate-800 block">{selectedJadwal.pengajar}</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400 font-semibold block">JAM BELAJAR</span>
                    <span className="text-slate-800 font-bold font-mono">{formatTimeDisplay(selectedJadwal.jam_mulai)} - {formatTimeDisplay(selectedJadwal.jam_berakhir)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">LOKASI KULIAH</span>
                    <span className="text-slate-800 font-bold">{getRuangClass(selectedJadwal.nama_mk)}</span>
                  </div>
                </div>

                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <span className="text-slate-450 font-bold block">DESKRIPSI KULIAH</span>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    Mata kuliah ini membahas pengantar kaidah & metodologi ilmiah kitab-kitab maraji mu'tabaroh, melatih kemampuan thullab dalam menganalisis kaul ulama salafus sholeh secara terperinci.
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex gap-2">
                  <button 
                    onClick={() => downloadMaterial(selectedJadwal.nama_mk)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-center cursor-pointer transition-colors"
                  >
                    Download Diktat
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedJadwal(null);
                      toast.success(`Silabus ${selectedJadwal.nama_mk} disalin ke clipboard.`);
                    }}
                    className="p-2 border border-slate-205 rounded-xl hover:bg-slate-50 cursor-pointer"
                  >
                    <ExternalLink className="w-4.5 h-4.5 text-slate-500" />
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
