import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, isUsingMock } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  BookOpen, 
  Clock, 
  Award, 
  Calendar, 
  CheckCircle2, 
  User, 
  Megaphone,
  LogOut,
  RefreshCw,
  Sparkles,
  QrCode,
  GraduationCap
} from 'lucide-react';
import toast from 'react-hot-toast';

// Subviews
import DashboardView from './components/DashboardView';
import AbsensiView from './components/AbsensiView';
import JadwalView from './components/JadwalView';
import NilaiView from './components/NilaiView';
import PengumumanView from './components/PengumumanView';
import ProfilView from './components/ProfilView';

interface DashboardMahasantriProps {
  currentTab?: 'beranda' | 'absensi' | 'jadwal' | 'nilai' | 'pengumuman' | 'profil';
}

export default function DashboardMahasantri({ currentTab = 'beranda' }: DashboardMahasantriProps) {
  const { user, login: updateSession, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'beranda' | 'absensi' | 'jadwal' | 'nilai' | 'pengumuman' | 'profil'>('beranda');

  useEffect(() => {
    setActiveTab(currentTab);
  }, [currentTab]);

  const [loading, setLoading] = useState(false);
  
  // Data State
  const [scheduleList, setScheduleList] = useState<any[]>([]);
  const [gradeList, setGradeList] = useState<any[]>([]);
  const [attendanceList, setAttendanceList] = useState<any[]>([]);
  const [courseList, setCourseList] = useState<any[]>([]);

  // Announcements State
  const [announcements, setAnnouncements] = useState<any[]>([]);

  // Read Announcements state
  const [readList, setReadList] = useState<string[]>(() => {
    const raw = localStorage.getItem('read_announcements');
    return raw ? JSON.parse(raw) : [];
  });

  const handleMarkAsRead = (id: string) => {
    if (!readList.includes(id)) {
      const updated = [...readList, id];
      setReadList(updated);
      localStorage.setItem('read_announcements', JSON.stringify(updated));
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, [user]);

  const fetchStudentData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [resJadwal, resNilai, resAbsensi, resMK, resMahasantri, resPengumuman] = await Promise.all([
        api.get('getJadwal'),
        api.get('getNilai'),
        api.get('getAbsensi'),
        api.get('getMatakuliah'),
        api.get('getMahasantri'),
        api.get('getPengumuman').catch(() => ({ data: [] }))
      ]);

      let studentProgram = user.program || '';
      let studentKelas = user.kelas || '';

      // Sync user profile details with the real database records
      const foundMahasantri = (resMahasantri.data || []).find((m: any) => 
        (user.nim && m.nim && m.nim.toString().trim() === user.nim.toString().trim()) ||
        (user.nama && m.nama && m.nama.toString().toLowerCase().trim() === user.nama.toString().toLowerCase().trim())
      );

      if (foundMahasantri) {
        studentProgram = foundMahasantri.program || studentProgram;
        studentKelas = foundMahasantri.kelas || studentKelas;

        // If the attributes in the current session are outdated or missing, update the auth session state
        if (user.program !== studentProgram || user.kelas !== studentKelas || user.nama !== foundMahasantri.nama || user.nim !== foundMahasantri.nim) {
          const updatedUser = { 
            ...user, 
            nama: foundMahasantri.nama || user.nama,
            nim: foundMahasantri.nim || user.nim,
            program: studentProgram, 
            kelas: studentKelas 
          };
          updateSession(updatedUser);
        }
      }

      const filteredJadwal = (resJadwal.data || []).filter((j: any) => 
        j.program === studentProgram && j.kelas === studentKelas
      );

      const isMatchingStudent = (dbId: any) => {
        if (!dbId) return false;
        const sDbId = String(dbId).trim().toLowerCase();
        
        // Match against user session context
        if (user.id && String(user.id).trim().toLowerCase() === sDbId) return true;
        if (user.nim && String(user.nim).trim().toLowerCase() === sDbId) return true;
        if (user.nama && String(user.nama).trim().toLowerCase() === sDbId) return true;

        // Match against mahasantri table record details
        if (foundMahasantri) {
          if (foundMahasantri.id && String(foundMahasantri.id).trim().toLowerCase() === sDbId) return true;
          if (foundMahasantri.nim && String(foundMahasantri.nim).trim().toLowerCase() === sDbId) return true;
          if (foundMahasantri.nama && String(foundMahasantri.nama).trim().toLowerCase() === sDbId) return true;
        }
        return false;
      };

      const filteredNilai = (resNilai.data || []).filter((n: any) => 
        isMatchingStudent(n.mahasiswa_id)
      );

      const filteredAbsensi = (resAbsensi.data || []).filter((a: any) => 
        isMatchingStudent(a.mahasiswa_id)
      );

      const filteredCourses = (resMK.data || []).filter((mk: any) => 
        mk.program === studentProgram && mk.kelas === studentKelas
      );

      let finalNilai = filteredNilai;
      if (isUsingMock && filteredNilai.length === 0) {
        // Generate beautiful sample grades for this student so they can preview the Lembar Hasil Studi
        const sampleCourses = filteredCourses.length > 0 ? filteredCourses : filteredJadwal;
        finalNilai = sampleCourses.map((c: any, index: number) => {
          const baseScore = 75 + (index * 5) % 21; // 75, 80, 85, etc.
          return {
            id: 'mock_gen_' + index,
            mahasiswa_id: user.nim || user.id,
            program: studentProgram || "I'dad Lughowi",
            kelas: studentKelas || "Semester 2 - Putra",
            nama_mk: c.nama_mk || c.matakuliah || c.nama || 'Mata Kuliah',
            presensi: 10,
            tugas: 15 + (index % 5),
            uts: 24 + (index % 4),
            uas: 30 + (index % 8),
            total: baseScore,
            tahun_akademik: "2025/2026",
            semester: "Genap"
          };
        });
      }

      setScheduleList(filteredJadwal);
      setGradeList(finalNilai);
      setAttendanceList(filteredAbsensi);
      setCourseList(filteredCourses.length > 0 ? filteredCourses : filteredJadwal);
      setAnnouncements(resPengumuman.data || []);

    } catch (error: any) {
      toast.error('Gagal memuat data portal: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Add absensi record dispatch
  const handleAddAbsensi = async (newRecord: any) => {
    try {
      await api.post('saveAbsensi', {
        tanggal: newRecord.tanggal,
        jam_ke: newRecord.jam_ke,
        nama_mk: newRecord.nama_mk,
        program: newRecord.program,
        kelas: newRecord.kelas,
        pembahasan: newRecord.pembahasan,
        data: [{
          tanggal: newRecord.tanggal,
          jam_ke: newRecord.jam_ke,
          nama_mk: newRecord.nama_mk,
          program: newRecord.program,
          kelas: newRecord.kelas,
          mahasiswa_id: newRecord.mahasiswa_id,
          status: newRecord.status,
          pembahasan: newRecord.pembahasan
        }]
      });
      toast.success('Kehadiran berhasil didaftarkan!');
      await fetchStudentData();
    } catch (err: any) {
      throw new Error(err.message || 'Gagal menyimpan presensi');
    }
  };

  // Profile fields dispatch
  const handleUpdateProfile = (updatedData: any) => {
    if (user) {
      const updatedUser = { ...user, ...updatedData };
      updateSession(updatedUser);
    }
  };

  // Logout handler
  const handleLogout = () => {
    logout();
    toast.success('Berhasil keluar dari Portal Mahasantri.');
  };

  return (
    <div className="space-y-6">

      {activeTab === 'beranda' && (
        <DashboardView 
          user={user}
          scheduleList={scheduleList}
          gradeList={gradeList}
          attendanceList={attendanceList}
          courseList={courseList}
          onTabChange={(target) => navigate(`/${target}-mahasantri`)}
          announcements={announcements}
        />
      )}

      {activeTab === 'absensi' && (
        <AbsensiView 
          user={user}
          scheduleList={scheduleList}
          attendanceList={attendanceList}
          onAddAbsensi={handleAddAbsensi}
          loadingData={loading}
        />
      )}

      {activeTab === 'jadwal' && (
        <JadwalView 
          scheduleList={scheduleList}
        />
      )}

      {activeTab === 'nilai' && (
        <NilaiView 
          gradeList={gradeList}
          courseList={courseList}
        />
      )}

      {activeTab === 'pengumuman' && (
        <PengumumanView 
          announcements={announcements}
          onMarkAsRead={handleMarkAsRead}
          readList={readList}
        />
      )}

      {activeTab === 'profil' && (
        <ProfilView 
          user={user}
          onUpdateProfile={handleUpdateProfile}
          onLogout={handleLogout}
        />
      )}

    </div>
  );
}
