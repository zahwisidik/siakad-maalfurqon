import { useState } from 'react';
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
  CalendarDays
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
  const [showNotifications, setShowNotifications] = useState(false);

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
  const checkAttendanceStatus = (courseName: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const attended = attendanceList.find(a => 
      a.nama_mk === courseName && 
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

        {/* Lonceng Notifikasi */}
        <div className="relative shrink-0">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors relative cursor-pointer"
          >
            <Bell className="w-5 h-5 text-slate-500" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 border border-white"></span>
          </button>

          {/* Dropdown Notifikasi */}
          <AnimatePresence>
            {showNotifications && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowNotifications(false)}></div>
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-slate-150 shadow-xl overflow-hidden z-40 text-left"
                >
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <span className="font-bold text-xs text-slate-800">Pusat Notifikasi</span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold">2 Baru</span>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                    {notificationList.map((notif) => (
                      <div key={notif.id} className={`p-4 hover:bg-slate-50/50 transition-colors ${notif.unread ? 'bg-emerald-50/10' : ''}`}>
                        <div className="flex justify-between gap-2">
                          <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            {notif.unread && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>}
                            {notif.title}
                          </p>
                          <span className="text-[10px] text-slate-400 shrink-0">{notif.time}</span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-1 line-clamp-2">{notif.desc}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
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
              <p className="text-slate-500 text-sm font-medium">Alhamdulillah, tidak ada jadwal kuliah hari ini.</p>
              <p className="text-xs text-slate-400">Silakan manfaatkan untuk murojaah atau tugas mandiri.</p>
            </div>
          ) : (
            <div className="space-y-3.5 pt-1">
              {todaySchedules.map((item) => {
                const status = checkAttendanceStatus(item.nama_mk);
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
                        {item.jam_mulai} - {item.jam_berakhir}
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

          <div className="space-y-3">
            {announcements.slice(0, 3).map((item) => (
              <div 
                key={item.id} 
                className="p-3.5 rounded-xl border border-slate-150 hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => onTabChange('pengumuman')}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider ${
                    item.kategori === 'Akademik' ? 'bg-blue-50 text-blue-750 border border-blue-200' :
                    item.kategori === 'Ujian' ? 'bg-rose-50 text-rose-750 border border-rose-200' :
                    'bg-amber-50 text-amber-750 border border-amber-200'
                  }`}>
                    {item.kategori}
                  </span>
                  {item.penting && (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                  )}
                </div>
                <h4 className="font-semibold text-slate-800 text-xs line-clamp-1">{item.judul}</h4>
                <p className="text-[10px] text-slate-400 mt-1 font-medium">{item.tanggal}</p>
              </div>
            ))}
          </div>
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
            <p className="text-slate-350 text-xs mt-1">Lakukan absen mandiri, cek transkrip nilai, jadwal harian, atau sunting biodata instan.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <button 
              onClick={() => onTabChange('absensi')}
              className="bg-white/10 hover:bg-white/15 transition-colors border border-white/15 p-3 rounded-xl flex items-center justify-between text-left text-xs font-bold font-sans cursor-pointer group"
            >
              <span>Absen Sekarang</span>
              <QrCode className="w-4 h-4 text-emerald-450 group-hover:scale-110 transition-transform" />
            </button>
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
