import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/admin/Dashboard';
import MahasantriList from './pages/admin/MahasantriList';
import PengajarList from './pages/admin/PengajarList';
import MatakuliahList from './pages/admin/MatakuliahList';
import KelasList from './pages/admin/KelasList';
import JadwalList from './pages/admin/JadwalList';
import RekapAbsensi from './pages/admin/RekapAbsensi';
import PengumumanList from './pages/admin/PengumumanList';
import AbsensiPengajar from './pages/pengajar/AbsensiPengajar';
import DashboardPengajar from './pages/pengajar/DashboardPengajar';
import MatakuliahPengajar from './pages/pengajar/MatakuliahPengajar';
import JadwalPengajar from './pages/pengajar/JadwalPengajar';
import PenilaianPengajar from './pages/pengajar/PenilaianPengajar';
import DashboardMahasantri from './pages/mahasantri/DashboardMahasantri';
import SetupGuide from './pages/SetupGuide';

function AppRoot() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/dashboard" replace />;
  if (user.role === 'mahasantri') return <Navigate to="/dashboard-mahasantri" replace />;
  return <Navigate to="/dashboard-pengajar" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/setup" element={<SetupGuide />} />
          
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<AppRoot />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/mahasantri" element={<MahasantriList />} />
            
            {/* CRUD Data Master */}
            <Route path="/pengajar" element={<PengajarList />} />
            <Route path="/matakuliah" element={<MatakuliahList />} />
            <Route path="/kelas" element={<KelasList />} />
            <Route path="/jadwal" element={<JadwalList />} />
            <Route path="/rekap" element={<RekapAbsensi />} />
            <Route path="/pengumuman" element={<PengumumanList />} />
            
            {/* Pengajar Routes */}
            <Route path="/dashboard-pengajar" element={<DashboardPengajar />} />
            <Route path="/matakuliah-pengajar" element={<MatakuliahPengajar />} />
            <Route path="/jadwal-pengajar" element={<JadwalPengajar />} />
            <Route path="/absensi-pengajar" element={<AbsensiPengajar />} />
            <Route path="/penilaian-pengajar" element={<PenilaianPengajar />} />

            {/* Mahasantri Routes */}
            <Route path="/dashboard-mahasantri" element={<DashboardMahasantri currentTab="beranda" />} />
            <Route path="/absensi-mahasantri" element={<DashboardMahasantri currentTab="absensi" />} />
            <Route path="/jadwal-mahasantri" element={<DashboardMahasantri currentTab="jadwal" />} />
            <Route path="/nilai-mahasantri" element={<DashboardMahasantri currentTab="nilai" />} />
            <Route path="/pengumuman-mahasantri" element={<DashboardMahasantri currentTab="pengumuman" />} />
            <Route path="/profil-mahasantri" element={<DashboardMahasantri currentTab="profil" />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
