import { useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, UserSquare2, BookOpen, Clock, CalendarDays, ClipboardCheck, LogOut, FileText, Menu, X, Award, Megaphone, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const adminMenus = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Mahasantri', icon: Users, path: '/mahasantri' },
    { name: 'Pengajar', icon: UserSquare2, path: '/pengajar' },
    { name: 'Mata Kuliah', icon: BookOpen, path: '/matakuliah' },
    { name: 'Kelas', icon: CalendarDays, path: '/kelas' },
    { name: 'Jadwal', icon: Clock, path: '/jadwal' },
    { name: 'Rekap Absensi', icon: FileText, path: '/rekap' },
    { name: 'Pengumuman', icon: Megaphone, path: '/pengumuman' },
  ];

  const pengajarMenus = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard-pengajar' },
    { name: 'Mata Kuliah', icon: BookOpen, path: '/matakuliah-pengajar' },
    { name: 'Jadwal Saya', icon: Clock, path: '/jadwal-pengajar' },
    { name: 'Absensi', icon: ClipboardCheck, path: '/absensi-pengajar' },
    { name: 'Penilaian', icon: ClipboardCheck, path: '/penilaian-pengajar' },
  ];

  const mahasantriMenus = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard-mahasantri' },
    { name: 'Absensi', icon: ClipboardCheck, path: '/absensi-mahasantri' },
    { name: 'Jadwal', icon: Clock, path: '/jadwal-mahasantri' },
    { name: 'Nilai', icon: Award, path: '/nilai-mahasantri' },
    { name: 'Pengumuman', icon: Megaphone, path: '/pengumuman-mahasantri' },
    { name: 'Profil', icon: User, path: '/profil-mahasantri' },
  ];

  const menus = user.role === 'admin' 
    ? adminMenus 
    : user.role === 'mahasantri'
      ? mahasantriMenus
      : pengajarMenus;
  const activeMenu = menus.find(m => location.pathname.startsWith(m.path));
  const pageTitle = activeMenu ? activeMenu.name : 'Sistem Akademik';

  return (
    <div className="h-screen w-full bg-[#F8FAFC] font-sans text-slate-800 overflow-hidden flex">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/80 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#0F172A] flex flex-col transform transition-transform duration-300 ease-in-out ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="p-6 border-b border-slate-700/50 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="flex w-14 h-14 flex-shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-800/50 p-1 shadow-inner">
               <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold tracking-tight text-[14px] leading-tight whitespace-nowrap">Ma'had Aly</span>
              <span className="text-emerald-400 font-semibold tracking-tight text-[12px] leading-tight uppercase whitespace-nowrap">Al-furqon</span>
            </div>
          </div>
          <button 
            className="lg:hidden text-slate-400 hover:text-white"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <nav className="p-4 space-y-1">
            {menus.map((menu) => (
              <NavLink
                key={menu.name}
                to={menu.path}
                onClick={() => setIsSidebarOpen(false)} // Close sidebar on click mobile
                className={({ isActive }) =>
                  `px-4 py-3 rounded-xl flex items-center gap-3 font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`
                }
              >
                <menu.icon className="w-5 h-5 flex-shrink-0" />
                {menu.name}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="p-6 mt-auto border-t border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{user.nama || 'User'}</p>
              <p className="text-slate-400 text-xs truncate">
                {user.role === 'admin'
                  ? 'Administrator'
                  : user.role === 'mahasantri'
                  ? 'Mahasantri'
                  : user.role === 'tenaga_kependidikan'
                  ? 'Tenaga Kependidikan'
                  : 'Ustadz / Pengajar'}
              </p>
            </div>
            <button
              onClick={logout}
              className="text-slate-400 hover:text-red-400 transition-colors p-1"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden w-full">
        <header className="h-16 flex-shrink-0 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <button 
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-md"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg sm:text-xl font-bold text-slate-800 truncate">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative hidden xs:block">
              <input type="text" placeholder="Cari data..." className="bg-slate-100 border-none rounded-full px-4 py-2 text-sm w-32 sm:w-48 lg:w-64 focus:ring-2 focus:ring-emerald-500 transition-all outline-none" />
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
