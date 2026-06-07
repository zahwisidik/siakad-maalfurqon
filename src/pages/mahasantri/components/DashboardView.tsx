import { useState, useEffect } from 'react';
import { formatToIndonesianDate, formatTimeDisplay } from '../../../utils/time';
import { 
  CheckCircle2, 
  BookOpen, 
  TrendingUp, 
  Clock, 
  Award, 
  Megaphone,
  Bell,
  ArrowRight,
  User,
  MapPin,
  QrCode,
  CalendarDays,
  Download,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardViewProps {
  user: any;
  scheduleList: any[];
  gradeList: any[];
  attendanceList: any[];
  courseList?: any[];
  onTabChange: (tab: 'beranda' | 'absensi' | 'jadwal' | 'nilai' | 'pengumuman' | 'profil') => void;
  announcements: any[];
}

export default function DashboardView({ 
  user, 
  scheduleList, 
  gradeList, 
  attendanceList, 
  courseList,
  onTabChange,
  announcements 
}: DashboardViewProps) {

  const DEFAULT_DOCUMENTS = [
    { id: '1', nama: 'Kalender Akademik Tahun Ajaran 2025/2026', file_path: '/dokumen/kalender_akademik_2025_2026.pdf' },
    { id: '2', nama: 'Buku Panduan Akademik dan Tata Tertib Mahasantri', file_path: '/dokumen/buku_panduan_mahasantri.pdf' },
    { id: '3', nama: 'Formulir Pengajuan Izin Keluar Lingkungan Pesantren', file_path: '/dokumen/formulir_izin_luar_pesantren.pdf' },
    { id: '4', nama: 'Panduan Penggunaan Portal SIAKAD Mahasantri', file_path: '/dokumen/panduan_siakad_mahasantri.pdf' },
  ];

  const [docs, setDocs] = useState<any[]>([]);

  useEffect(() => {
    const getStoredDocs = () => {
      const stored = localStorage.getItem('akademik_dokumen_list');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          return DEFAULT_DOCUMENTS;
        }
      }
      localStorage.setItem('akademik_dokumen_list', JSON.stringify(DEFAULT_DOCUMENTS));
      return DEFAULT_DOCUMENTS;
    };
    setDocs(getStoredDocs());
  }, []);

  // Calculate stats
  const totalPresence = attendanceList.filter(a => a.status === 'hadir' || a.status === 'terlambat').length;
  const totalAbsenceSessions = attendanceList.length;
  const attendancePercentage = totalAbsenceSessions > 0 
    ? Math.round((totalPresence / totalAbsenceSessions) * 100) 
    : 100;

  // Filter courses by student program and kelas
  const targetProgram = (user?.program || '').toString().trim().toLowerCase();
  const targetKelas = (user?.kelas || '').toString().trim().toLowerCase();

  const activeCoursesFromDb = (courseList || []).filter((mk: any) => {
    const p = (mk.program || '').toString().trim().toLowerCase();
    const k = (mk.kelas || '').toString().trim().toLowerCase();
    return p === targetProgram && k === targetKelas;
  });

  const uniqueCourseNames = Array.from(new Set([
    ...activeCoursesFromDb.map((c: any) => c.nama_mk || c.nama || ''),
    ...scheduleList.map((j: any) => j.nama_mk || '')
  ].filter(Boolean)));

  const totalSKS = uniqueCourseNames.reduce((sum, courseName) => {
    const foundCourse = (courseList || []).find((c: any) => 
      (c.nama_mk || c.nama || '').toString().trim().toLowerCase() === courseName.toString().trim().toLowerCase()
    );
    const value = foundCourse ? Number(foundCourse.sks || foundCourse.SKS || 3) : 3;
    return sum + value;
  }, 0);

  const totalCourses = uniqueCourseNames.length;

  // Today's Day in Indonesian
  const todayIndonesian = () => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[new Date().getDay()];
  };
  const currentDay = todayIndonesian();

  // Highlight today's schedules
  const todaySchedules = scheduleList.filter(s => s.hari?.toLowerCase() === currentDay.toLowerCase());

  // Check if student has already checked in today for each course
  const checkAttendanceStatus = (courseName: string, jamKe: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const attended = attendanceList.find(a => 
      a.nama_mk === courseName && 
      String(a.jam_ke) === String(jamKe) &&
      (a.tanggal === todayStr || a.tanggal?.startsWith(todayStr))
    );
    if (attended) {
      return { 
        text: 'Sudah Absen', 
        color: 'text-emerald-700 bg-emerald-55 border-emerald-250',
        dot: 'bg-emerald-500'
      };
    }
    return { 
      text: 'Belum Absen', 
      color: 'text-amber-750 bg-amber-50 border-amber-200',
      dot: 'bg-amber-500'
    };
  };

  const notificationList = [
    { id: 1, title: 'Presensi Dibuka', desc: 'Presensi kelas Bahasa Arab jam ke-1 sudah dibuka.', time: 'Baru saja', unread: true },
    { id: 2, title: 'Nilai UTS Diperbarui', desc: 'Ust. Ahmad memperbarui nilai UTS Fiqih Munakahat.', time: '2 jam yang lalu', unread: true },
    { id: 3, title: 'Pengumuman Penting', desc: 'Pengumuman resmi mengenai libur lebaran Idul Adha.', time: '1 hari yang lalu', unread: false }
  ];

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          {/* Avatar Akun */}
          <div className="w-14 h-14 rounded-full border border-slate-200 bg-slate-100 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
            {user?.avatar ? (
              <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-7 h-7 text-slate-400" />
            )}
          </div>
          
          {/* Keterangan Nama, NIM, Program, Kelas */}
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-black text-slate-850 leading-tight">
              {user?.nama || "Adnan"}
            </h2>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500 font-semibold font-sans">
              <span className="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                NIM: {user?.nim || "529.01.05.25"}
              </span>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span>
                Program: <strong className="text-slate-700">{user?.program || "I'dad Lughowi"}</strong>
              </span>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span>
                Kelas: <strong className="text-slate-700">{user?.kelas || "Semester 2 - Putra"}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Jadwal Hari ini & Pengumuman */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Jadwal Hari Ini */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-800">Jadwal Kuliah Hari Ini ({currentDay})</h3>
            </div>
            <span className="text-[11px] bg-slate-105 px-2 py-0.5 rounded-full font-bold text-slate-500">{todaySchedules.length} Kuliah</span>
          </div>

          {todaySchedules.length === 0 ? (
            <div className="py-14 text-center space-y-2">
              <CalendarDays className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-slate-500 text-sm font-medium">Tidak ada jadwal kuliah hari ini.</p>
              <p className="text-xs text-slate-400">Silakan manfaatkan untuk murojaah atau tugas mandiri.</p>
            </div>
          ) : (
            <div className="space-y-3.5 pt-1">
              {todaySchedules.map((item) => {
                const status = checkAttendanceStatus(item.nama_mk, item.jam_ke);
                return (
                  <div key={item.id} className="p-4 rounded-xl border border-slate-150 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-800 text-sm">{item.nama_mk}</p>
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] rounded-full border font-bold ${status.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`}></span>
                          {status.text}
                        </span>
                      </div>
                      <p className="text-slate-450 text-xs font-semibold">{item.pengajar} • Jam Ke-{item.jam_ke}</p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-0 pt-2 sm:pt-0 border-slate-100">
                      <div className="font-mono text-xs font-bold bg-white text-slate-700 py-1 px-2 border border-slate-150 rounded-lg shadow-sm">
                        {formatTimeDisplay(item.jam_mulai)} - {formatTimeDisplay(item.jam_berakhir)}
                      </div>

                      {status.text === 'Belum Absen' && (
                        <button 
                          onClick={() => onTabChange('absensi')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-1.5 px-3 rounded-lg shadow-sm cursor-pointer transition-colors"
                        >
                          Absen
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pengumuman Terbaru */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-emerald-600" />
              Pengumuman Terbaru
            </h3>
            <button 
              onClick={() => onTabChange('pengumuman')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
            >
              Semua
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-150 rounded-xl">
            <table className="min-w-full divide-y divide-slate-150 text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr className="divide-x divide-slate-150">
                  <th scope="col" className="px-3 py-2 text-center w-12">No</th>
                  <th scope="col" className="px-3 py-2 text-left w-24">Kategori</th>
                  <th scope="col" className="px-3 py-2 text-left">Judul Pengumuman</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 bg-white text-slate-700">
                {announcements.slice(0, 3).map((item, index) => (
                  <tr 
                    key={item.id} 
                    onClick={() => onTabChange('pengumuman')}
                    className="divide-x divide-slate-150 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="px-3 py-3 text-center font-mono font-bold text-slate-400">
                      {index + 1}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider ${
                        item.kategori === 'Akademik' ? 'bg-blue-50 text-blue-750 border border-blue-200' :
                        item.kategori === 'Ujian' ? 'bg-rose-50 text-rose-750 border border-rose-200' :
                        'bg-amber-50 text-amber-750 border border-amber-200'
                      }`}>
                        {item.kategori}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-slate-800 line-clamp-1">{item.judul}</p>
                          {item.penting && (
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0"></span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {formatToIndonesianDate(item.tanggal)}
                        </p>
                      </div>
                    </td>
                  </tr>
                ))}
                {announcements.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-3 py-8 text-center text-slate-400 font-medium italic">
                      Tidak ada pengumuman terbaru
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Daftar Dokumen Penting */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            Dokumen Penting & Panduan Akademik
          </h3>
          <span className="text-[11px] bg-slate-105 px-2 py-0.5 rounded-full font-bold text-slate-500">{docs.length} Dokumen</span>
        </div>

        <div className="overflow-x-auto border border-slate-150 rounded-xl">
          <table className="min-w-full divide-y divide-slate-150 text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr className="divide-x divide-slate-150">
                <th scope="col" className="px-3 py-2.5 text-center w-12">No</th>
                <th scope="col" className="px-4 py-2.5 text-left">Nama Dokumen</th>
                <th scope="col" className="px-3 py-2.5 text-center w-24">Link Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 bg-white text-slate-700 font-medium">
              {docs.map((doc: any, index: number) => (
                <tr key={doc.id || index} className="divide-x divide-slate-150 hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-3.5 text-center font-mono font-bold text-slate-400">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-850 text-[13px]">{doc.nama}</p>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-center whitespace-nowrap">
                    <a
                      href={doc.file_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-55 hover:bg-emerald-100 border border-emerald-250 text-emerald-700 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </a>
                  </td>
                </tr>
              ))}
              {docs.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-slate-400 italic">
                    Belum ada dokumen yang diunggah oleh admin.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Action Drawer */}
      <div className="bg-gradient-to-r from-emerald-800 to-slate-900 rounded-2xl p-6 text-white relative overflow-hidden shadow-md">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <QrCode className="w-56 h-56 rotate-12" />
        </div>
        <div className="relative z-10 space-y-4">
          <div>
            <h3 className="font-bold text-base">Akses Cepat Kebutuhan Akademik</h3>
            <p className="text-slate-350 text-xs mt-1 font-medium">Cek transkrip nilai, jadwal harian, atau sunting biodata instan.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <button 
              onClick={() => onTabChange('jadwal')}
              className="bg-white/10 hover:bg-white/15 transition-colors border border-white/15 p-3 rounded-xl flex items-center justify-between text-left text-xs font-bold font-sans cursor-pointer group"
            >
              <span>Lihat Jadwal</span>
              <Clock className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
            </button>
            <button 
              onClick={() => onTabChange('nilai')}
              className="bg-white/10 hover:bg-white/15 transition-colors border border-white/15 p-3 rounded-xl flex items-center justify-between text-left text-xs font-bold font-sans cursor-pointer group"
            >
              <span>Nilai Semester</span>
              <TrendingUp className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            </button>
            <button 
              onClick={() => onTabChange('profil')}
              className="bg-white/10 hover:bg-white/15 transition-colors border border-white/15 p-3 rounded-xl flex items-center justify-between text-left text-xs font-bold font-sans cursor-pointer group"
            >
              <span>Profil Santri</span>
              <User className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
