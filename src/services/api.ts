/// <reference types="vite/client" />
import axios from 'axios';
import { User, Mahasantri, Pengajar, Kelas, Jadwal, Absensi } from '../types';

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL || '';

// --- MOCK DATA --- 
// Dipakai jika belum terkoneksi dengan G-Sheets
let mockMahasantri = [
  { id: 'm1', nim: '1001', nama: 'Fulan', jenis_kelamin: 'laki-laki', program: "I'dad Lughowi", kelas: "Semester 2 - Putra", status: 'aktif', tahun_masuk: 2025 },
  { id: 'm2', nim: '1002', nama: 'Fulanah', jenis_kelamin: 'perempuan', program: "Syariah", kelas: "Semester 1 - Putri", status: 'aktif', tahun_masuk: 2025 },
  { id: 'm3', nim: '529.01.05.25', nama: 'Adnan', jenis_kelamin: 'laki-laki', program: "I'dad Lughowi", kelas: "Semester 2 - Putra", status: 'aktif', tahun_masuk: 2025 },
  { id: 'm4', nim: '2022.01.01.028', nama: 'Muhammad Imron', jenis_kelamin: 'laki-laki', program: "I'dad Du'at", kelas: "Semester 2 - Putra", status: 'aktif', tahun_masuk: 2022 },
];

let mockJadwal = [
  { id: 'j1', hari: 'Senin', jam_ke: '1', jam_mulai: '08:00', jam_berakhir: '10:00', jam_selesai: '10:00', program: 'I\'dad Lughowi', kelas: 'Semester 2 - Putra', nama_mk: 'Fiqih Munakahat', matakuliah: 'Fiqih Munakahat', pengajar: 'Ust. Ahmad', lokasi: 'Lantai 2 - Ruang Ghazali', deskripsi: 'Mata kuliah Fiqih Munakahat membahas kajian mendalam mengenai hukum pernikahan, syarat rukun nikah, hak dan kewajiban suami istri, serta permasalahan kontemporer rumah tangga berdasarkan kitab-kitab muktabar.' },
  { id: 'j2', hari: 'Senin', jam_ke: '2', jam_mulai: '10:15', jam_berakhir: '12:00', jam_selesai: '12:00', program: 'Syariah', kelas: 'Semester 1 - Putra', nama_mk: 'Aqidah Dasar', matakuliah: 'Aqidah Dasar', pengajar: 'Ust. Ahmad', lokasi: 'Lantai 1 - Ruang Syafii', deskripsi: 'Mata kuliah ini membahas pengantar pokok-pokok keimanan, marifatullah, marifaturrosul, syubhat-syubhat pemikiran akidah menyimpang serta bantahannya berdasarkan manhaj salafus sholih.' },
  { id: 'j3', hari: 'Selasa', jam_ke: '1', jam_mulai: '08:00', jam_berakhir: '10:00', jam_selesai: '10:00', program: 'I\'dad Lughowi', kelas: 'Semester 2 - Putra', nama_mk: 'Bahasa Arab', matakuliah: 'Bahasa Arab', pengajar: 'Ust. Ahmad', lokasi: 'Lantai 1 - Ruang Hambali', deskripsi: 'Mata kuliah Bahasa Arab dasar melatih kemampuan thullab dalam kemahiran kalam, qiroah, kitabah, dan pemahaman tata bahasa nahu-shorof aplikatif untuk membaca literatur arab gundul.' }
];

let mockPengajar = [
  { id: 'p1', nama: 'Ust. Ahmad', mapel: 'Fiqih', status: 'aktif' },
  { id: 'p2', nama: 'Ust. Budi', mapel: 'Aqidah', status: 'aktif' },
];

let mockMatakuliah = [
  { id: 'mk1', kode: 'MK-01', nama: 'Fiqih Munakahat', nama_mk: 'Fiqih Munakahat', program: "I'dad Lughowi", kelas: "Semester 2 - Putra", sks: 3, pengajar: 'Ust. Ahmad' },
  { id: 'mk2', kode: 'MK-02', nama: 'Aqidah Dasar', nama_mk: 'Aqidah Dasar', program: "Syariah", kelas: "Semester 1 - Putri", sks: 2, pengajar: 'Ust. Ahmad' },
  { id: 'mk3', kode: 'MK-03', nama: 'Bahasa Arab', nama_mk: 'Bahasa Arab', program: "I'dad Lughowi", kelas: "Semester 2 - Putra", sks: 4, pengajar: 'Ust. Ahmad' },
  { id: 'im_mk1', kode: 'ID201', nama: 'AKIDAH 2', nama_mk: 'AKIDAH 2', program: "I'dad Du'at", kelas: "Semester 2 - Putra", sks: 3, pengajar: 'Ust. Ahmad' },
  { id: 'im_mk2', kode: 'ID202', nama: 'TAFSIR 1', nama_mk: 'TAFSIR 1', program: "I'dad Du'at", kelas: "Semester 2 - Putra", sks: 2, pengajar: 'Ust. Ahmad' },
  { id: 'im_mk3', kode: 'ID203', nama: 'HADITS 1', nama_mk: 'HADITS 1', program: "I'dad Du'at", kelas: "Semester 2 - Putra", sks: 3, pengajar: 'Ust. Ahmad' },
  { id: 'im_mk4', kode: 'ID204', nama: 'FIKIH 2', nama_mk: 'FIKIH 2', program: "I'dad Du'at", kelas: "Semester 2 - Putra", sks: 5, pengajar: 'Ust. Ahmad' },
  { id: 'im_mk5', kode: 'ID205', nama: 'USHUL FIKIH 2', nama_mk: 'USHUL FIKIH 2', program: "I'dad Du'at", kelas: "Semester 2 - Putra", sks: 3, pengajar: 'Ust. Ahmad' },
  { id: 'im_mk6', kode: 'ID206', nama: 'NAHWU 2', nama_mk: 'NAHWU 2', program: "I'dad Du'at", kelas: "Semester 2 - Putra", sks: 2, pengajar: 'Ust. Ahmad' },
  { id: 'im_mk7', kode: 'ID207', nama: 'PEMIKIRAN ISLAM 2', nama_mk: 'PEMIKIRAN ISLAM 2', program: "I'dad Du'at", kelas: "Semester 2 - Putra", sks: 2, pengajar: 'Ust. Ahmad' },
  { id: 'im_mk8', kode: 'ID208', nama: 'TARBIYAH ISLAMIYAH 2', nama_mk: 'TARBIYAH ISLAMIYAH 2', program: "I'dad Du'at", kelas: "Semester 2 - Putra", sks: 2, pengajar: 'Ust. Ahmad' },
  { id: 'im_mk9', kode: 'ID209', nama: 'TAHFIDZ 2', nama_mk: 'TAHFIDZ 2', program: "I'dad Du'at", kelas: "Semester 2 - Putra", sks: 2, pengajar: 'Ust. Ahmad' },
];

let mockKelas = [
  { id: 'k1', nama_kelas: "Semester 2 - Putra", program: "I'dad Lughowi" },
  { id: 'k2', nama_kelas: "Semester 1 - Putri", program: "Syariah" },
  { id: 'k3', nama_kelas: "Semester 2 - Putra", program: "I'dad Du'at" },
];

let mockNilai = [
  { id: 'n1', mahasiswa_id: '1001', program: "I'dad Lughowi", kelas: "Semester 2 - Putra", nama_mk: "Fiqih Munakahat", presensi: 10, tugas: 18, uts: 28, uas: 38, total: 94, tahun_akademik: "2025/2026", semester: "Genap" },
  { id: 'n2', mahasiswa_id: '1001', program: "I'dad Lughowi", kelas: "Semester 2 - Putra", nama_mk: "Bahasa Arab", presensi: 9, tugas: 17, uts: 25, uas: 35, total: 86, tahun_akademik: "2025/2026", semester: "Genap" },
  { id: 'n3', mahasiswa_id: '529.01.05.25', program: "I'dad Lughowi", kelas: "Semester 2 - Putra", nama_mk: "Fiqih Munakahat", presensi: 10, tugas: 19, uts: 27, uas: 36, total: 92, tahun_akademik: "2025/2026", semester: "Genap" },
  { id: 'n4', mahasiswa_id: '529.01.05.25', program: "I'dad Lughowi", kelas: "Semester 2 - Putra", nama_mk: "Bahasa Arab", presensi: 10, tugas: 18, uts: 29, uas: 37, total: 94, tahun_akademik: "2025/2026", semester: "Genap" },
  { id: 'im1', mahasiswa_id: '2022.01.01.028', program: "I'dad Du'at", kelas: "Semester 2 - Putra", nama_mk: "AKIDAH 2", presensi: 10, tugas: 10, uts: 20, uas: 20, total: 60, tahun_akademik: "2022/2023", semester: "Genap" },
  { id: 'im2', mahasiswa_id: '2022.01.01.028', program: "I'dad Du'at", kelas: "Semester 2 - Putra", nama_mk: "TAFSIR 1", presensi: 10, tugas: 15, uts: 26, uas: 30, total: 81, tahun_akademik: "2022/2023", semester: "Genap" },
  { id: 'im3', mahasiswa_id: '2022.01.01.028', program: "I'dad Du'at", kelas: "Semester 2 - Putra", nama_mk: "HADITS 1", presensi: 10, tugas: 10, uts: 18, uas: 20, total: 58, tahun_akademik: "2022/2023", semester: "Genap" },
  { id: 'im4', mahasiswa_id: '2022.01.01.028', program: "I'dad Du'at", kelas: "Semester 2 - Putra", nama_mk: "FIKIH 2", presensi: 10, tugas: 10, uts: 15, uas: 18, total: 53, tahun_akademik: "2022/2023", semester: "Genap" },
  { id: 'im5', mahasiswa_id: '2022.01.01.028', program: "I'dad Du'at", kelas: "Semester 2 - Putra", nama_mk: "USHUL FIKIH 2", presensi: 10, tugas: 15, uts: 30, uas: 30, total: 85, tahun_akademik: "2022/2023", semester: "Genap" },
  { id: 'im6', mahasiswa_id: '2022.01.01.028', program: "I'dad Du'at", kelas: "Semester 2 - Putra", nama_mk: "NAHWU 2", presensi: 10, tugas: 12, uts: 23, uas: 25, total: 70, tahun_akademik: "2022/2023", semester: "Genap" },
  { id: 'im7', mahasiswa_id: '2022.01.01.028', program: "I'dad Du'at", kelas: "Semester 2 - Putra", nama_mk: "PEMIKIRAN ISLAM 2", presensi: 10, tugas: 16, uts: 30, uas: 30, total: 86, tahun_akademik: "2022/2023", semester: "Genap" },
  { id: 'im8', mahasiswa_id: '2022.01.01.028', program: "I'dad Du'at", kelas: "Semester 2 - Putra", nama_mk: "TARBIYAH ISLAMIYAH 2", presensi: 10, tugas: 20, uts: 30, uas: 38, total: 98, tahun_akademik: "2022/2023", semester: "Genap" },
  { id: 'im9', mahasiswa_id: '2022.01.01.028', program: "I'dad Du'at", kelas: "Semester 2 - Putra", nama_mk: "TAFHIDZ 2", presensi: 10, tugas: 14, uts: 26, uas: 30, total: 80, tahun_akademik: "2022/2023", semester: "Genap" }
];

let mockAbsensi: Absensi[] = [
  { id: 'a1', tanggal: '2026-05-18', jam_ke: '1', nama_mk: 'Fiqih Munakahat', program: "I'dad Lughowi", kelas: "Semester 2 - Putra", mahasiswa_id: '1001', status: 'hadir', timestamp: '2026-05-18T08:05:00Z' },
  { id: 'a2', tanggal: '2026-05-18', jam_ke: '2', nama_mk: 'Aqidah Dasar', program: "Syariah", kelas: "Semester 1 - Putri", mahasiswa_id: 'm2', status: 'hadir', timestamp: '2026-05-18T10:20:00Z' },
  { id: 'a3', tanggal: '2026-05-19', jam_ke: '1', nama_mk: 'Bahasa Arab', program: "I'dad Lughowi", kelas: "Semester 2 - Putra", mahasiswa_id: 'm1', status: 'hadir', timestamp: '2026-05-19T08:03:00Z' },
  { id: 'a4', tanggal: '2026-05-18', jam_ke: '1', nama_mk: 'Fiqih Munakahat', program: "I'dad Lughowi", kelas: "Semester 2 - Putra", mahasiswa_id: 'm3', status: 'hadir', timestamp: '2026-05-18T08:04:00Z' },
  { id: 'a5', tanggal: '2026-05-19', jam_ke: '1', nama_mk: 'Bahasa Arab', program: "I'dad Lughowi", kelas: "Semester 2 - Putra", mahasiswa_id: 'm3', status: 'hadir', timestamp: '2026-05-19T08:02:00Z' }
];

let mockPengumuman = [
  { 
    id: 'p0', 
    kategori: 'Akademik', 
    judul: 'Pemberitahuan', 
    tanggal: 'Sekarang', 
    isi_lengkap: 'Ruang kelas luring dapat berubah sewaktu-waktu tergantung koordinasi dari Pengawas Asrama.', 
    penting: true 
  },
  { 
    id: 'p2', 
    kategori: 'Asrama', 
    judul: 'Pengisian Libur Semester Ganjil & Ketentuan Perpulangan', 
    tanggal: '18 Juni 2026', 
    isi_lengkap: 'Sesuai keputusan mudir asrama Ma’had Aly, pintu gerbang perpulangan thullab akan resmi dibuka semenjak pelaksanaan UAS usai. Seluruh thullab diwajibkan melakukan rukhsoh perpulangan lisan maupun tulisan ke pengawas kamar sebelum check-out.', 
    penting: false 
  },
  { 
    id: 'p3', 
    kategori: 'Akademik', 
    judul: 'Edaran Kewajiban Setoran Hafalan Mutun Syar’iyyah', 
    tanggal: '15 Juni 2026', 
    isi_lengkap: 'Bagi seluruh thullab penerima beasiswa, batas akhir ujian lisan hafalan Kitab Tuhfatul Athfal dan Jazariyyah diundur hingga tanggal 10 Juni 2026 pukul 15.00 WIB bersama dewan pembina masing-masing kamar.', 
    penting: true 
  },
  { 
    id: 'p4', 
    kategori: 'Administrasi', 
    judul: 'Pendaftaran Re-Registrasi Syahadah Ma’had Aly', 
    tanggal: '12 Juni 2026', 
    isi_lengkap: 'Formulir re-registrasi thullab tholibah dapat diakses melalui portal administrasi atau langsung menghadap amil bagian kesekretariatan keuangan utama.', 
    penting: false 
  },
  { 
    id: 'p5', 
    kategori: 'Umum', 
    judul: 'Kajian Kitab Umum bersama Syekh Tamim Al-Mishri', 
    tanggal: '10 Juni 2026', 
    isi_lengkap: 'Hadirilah kajian ilmiah bedah Kitab At-Taudhih Al-Asma wa Al-Shifat bertempat di Aula Mesjid Utama Jami Baitul Atiq selepas sholat Ashar s.d Isya teruntuk seluruh thullab Ma’had.', 
    penting: false 
  }
];

export const isUsingMock = !APPS_SCRIPT_URL;

let mockAbsensiPengajar: any[] = [];
try {
  const stored = localStorage.getItem('mock_absensi_pengajar');
  if (stored) mockAbsensiPengajar = JSON.parse(stored);
} catch (e) {}

const saveMockAbsensiPengajar = () => {
  try {
    localStorage.setItem('mock_absensi_pengajar', JSON.stringify(mockAbsensiPengajar));
  } catch (e) {}
};

try {
  const stored = localStorage.getItem('mock_nilai');
  if (stored) mockNilai = JSON.parse(stored);
} catch (e) {}

const saveMockNilai = () => {
  try {
    localStorage.setItem('mock_nilai', JSON.stringify(mockNilai));
  } catch (e) {}
};

export const api = {
  get: async (action: string) => {
    if (isUsingMock) {
      return new Promise((resolve) => {
        setTimeout(() => {
          if (action === 'getMahasantri') resolve({ data: mockMahasantri });
          if (action === 'getJadwal') resolve({ data: mockJadwal });
          if (action === 'getPengajar') resolve({ data: mockPengajar });
          if (action === 'getMatakuliah') resolve({ data: mockMatakuliah });
          if (action === 'getKelas') resolve({ data: mockKelas });
          if (action === 'getNilai') resolve({ data: mockNilai });
          if (action === 'getAbsensi') resolve({ data: mockAbsensi });
          if (action === 'getAbsensiPengajar') resolve({ data: mockAbsensiPengajar });
          if (action === 'getPengumuman') resolve({ data: mockPengumuman });
          resolve({ data: [] });
        }, 500);
      });
    }

    try {
      const { data } = await axios.get(`${APPS_SCRIPT_URL}?action=${action}`);
      if (!data.success) {
        if (action === 'getAbsensiPengajar' && data.message === 'Unknown action') {
          return { data: mockAbsensiPengajar };
        }
        throw new Error(data.message);
      }
      return data;
    } catch (error: any) {
      console.warn(`Request failed for action "${action}". Falling back to mock data gracefully.`, error);
      
      let fallbackData: any = [];
      if (action === 'getMahasantri') fallbackData = mockMahasantri;
      else if (action === 'getJadwal') fallbackData = mockJadwal;
      else if (action === 'getPengajar') fallbackData = mockPengajar;
      else if (action === 'getMatakuliah') fallbackData = mockMatakuliah;
      else if (action === 'getKelas') fallbackData = mockKelas;
      else if (action === 'getNilai') fallbackData = mockNilai;
      else if (action === 'getAbsensi') fallbackData = mockAbsensi;
      else if (action === 'getAbsensiPengajar') fallbackData = mockAbsensiPengajar;
      else if (action === 'getPengumuman') fallbackData = mockPengumuman;
      
      return { data: fallbackData, success: true, isFallback: true };
    }
  },

  post: async (action: string, payload: any) => {
    const runMockPost = () => {
      if (action === 'login') {
        const emailLower = (payload.email || '').toLowerCase();
        if (emailLower === 'admin@admin.com') {
          return { data: { user: { id: '1', nama: 'Admin', email: 'admin@admin.com', role: 'admin', status: 'active' } } };
        } else if (emailLower === 'ahmad@pengajar.com') {
          return { data: { user: { id: '2', nama: 'Ust. Ahmad', email: 'ahmad@pengajar.com', role: 'pengajar', status: 'active' } } };
        } else if (emailLower === 'fulan@mahasantri.com' || payload.email === '1001') {
          return { data: { user: { id: 'm1', nama: 'Fulan', email: 'fulan@mahasantri.com', nim: '1001', role: 'mahasantri', status: 'aktif', program: "I'dad Lughowi", kelas: "Semester 2 - Putra", tahun_masuk: 2025 } } };
        } else if (emailLower === 'fulanah@mahasantri.com' || payload.email === '1002') {
          return { data: { user: { id: 'm2', nama: 'Fulanah', email: 'fulanah@mahasantri.com', nim: '1002', role: 'mahasantri', status: 'aktif', program: "Syariah", kelas: "Semester 1 - Putri", tahun_masuk: 2025 } } };
        } else {
          const found = mockMahasantri.find(m => m.nim === payload.email || m.nama.toLowerCase() === emailLower);
          if (found) {
            return { data: { user: { id: found.id, nama: found.nama, email: found.nim + '@mahasantri.com', nim: found.nim, role: 'mahasantri', status: found.status, program: found.program, kelas: found.kelas, tahun_masuk: found.tahun_masuk } } };
          } else {
            throw new Error('User tidak ditemukan. Gunakan admin@admin.com, ahmad@pengajar.com, atau 1001/1002');
          }
        }
      } else if (action === 'saveAbsensi') {
        if (payload.data && Array.isArray(payload.data)) {
          payload.data.forEach((item: any) => {
            mockAbsensi.push({
              id: 'a_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
              tanggal: item.tanggal || payload.tanggal || new Date().toISOString().split('T')[0],
              jam_ke: item.jam_ke || payload.jam_ke || '1',
              nama_mk: item.nama_mk || payload.nama_mk || '',
              program: item.program || payload.program || '',
              kelas: item.kelas || payload.kelas || '',
              mahasiswa_id: item.mahasiswa_id,
              status: item.status,
              pembahasan: item.pembahasan || payload.pembahasan || '',
              timestamp: new Date().toISOString()
            });
          });
        }
        return { message: 'Absensi simulated save.' };
      } else if (action === 'saveAbsensiPengajar') {
        const index = mockAbsensiPengajar.findIndex((a: any) => a.pengajar_id === payload.pengajar_id && a.tanggal === payload.tanggal);
        if (index > -1) {
          mockAbsensiPengajar[index] = { ...mockAbsensiPengajar[index], ...payload };
        } else {
          mockAbsensiPengajar.push({ id: 'ap_' + Date.now(), ...payload });
        }
        saveMockAbsensiPengajar();
        return { message: 'Absensi pengajar tersimpan' };
      } else if (action === 'saveNilai') {
        let index = -1;
        if (payload.id) {
          index = mockNilai.findIndex((n: any) => n.id && n.id.toString().trim().toLowerCase() === payload.id.toString().trim().toLowerCase());
        }
        if (index === -1) {
          index = mockNilai.findIndex((n: any) => {
            const nNim = n.nim || n.mahasiswa_id;
            const payNim = payload.nim || payload.mahasiswa_id;
            const nimMatch = nNim && payNim && nNim.toString().trim().toLowerCase() === payNim.toString().trim().toLowerCase();

            const nNama = n.nama || n.nama_mahasiswa;
            const payNama = payload.nama || payload.nama_mahasiswa;
            const nameMatch = nNama && payNama && nNama.toString().trim().toLowerCase() === payNama.toString().trim().toLowerCase();

            const mkMatch = n.nama_mk && payload.nama_mk && n.nama_mk.toString().trim().toLowerCase() === payload.nama_mk.toString().trim().toLowerCase();

            return (nimMatch || nameMatch) && mkMatch;
          });
        }
        
        const presensiVal = parseFloat(payload.presensi || '0') || 0;
        const tugasVal = parseFloat(payload.tugas || '0') || 0;
        const utsVal = parseFloat(payload.uts || '0') || 0;
        const uasVal = parseFloat(payload.uas || '0') || 0;
        const computedTotal = presensiVal + tugasVal + utsVal + uasVal;

        // Populate and filter attributes according to strict NILAI sheet schema
        const preparedPayload: any = {
          id: payload.id,
          nim: payload.nim || payload.mahasiswa_id,
          nama: payload.nama || payload.nama_mahasiswa,
          program: payload.program,
          kelas: payload.kelas,
          nama_mk: payload.nama_mk,
          presensi: presensiVal,
          tugas: tugasVal,
          uts: utsVal,
          uas: uasVal,
          total: computedTotal,
          tahun_akademik_data: payload.tahun_akademik_data || payload.tahun_akademik,
          semester_data: payload.semester_data || payload.semester,
        };

        if (index > -1) {
          mockNilai[index] = { ...mockNilai[index], ...preparedPayload };
          // Ensure we don't carry over any old/legacy keys in editing mode
          delete mockNilai[index].mahasiswa_id;
          delete mockNilai[index].tahun_akademik;
          delete mockNilai[index].semester;
        } else {
          const newItem = { id: payload.id || 'n_' + Date.now().toString(), ...preparedPayload };
          mockNilai.push(newItem);
        }
        saveMockNilai();
        return { message: 'Nilai tersimpan (mock).' };
      } else if (action === 'deleteNilai') {
        mockNilai = mockNilai.filter((n: any) => n.id && n.id.toString().trim() !== payload.id.toString().trim());
        saveMockNilai();
        return { success: true, message: 'Nilai berhasil dihapus' };
      } else if (action === 'addPengumuman') {
        const newItem = { id: 'p_' + Date.now(), ...payload.data };
        mockPengumuman.push(newItem);
        return newItem;
      } else if (action === 'updatePengumuman') {
        const index = mockPengumuman.findIndex(p => p.id === payload.id);
        if (index > -1) {
          mockPengumuman[index] = { ...mockPengumuman[index], ...payload.data };
        }
        return mockPengumuman[index];
      } else if (action === 'deletePengumuman') {
        mockPengumuman = mockPengumuman.filter(p => p.id !== payload.id);
        return { success: true };
      } else if (action.startsWith('add') || action.startsWith('update') || action.startsWith('delete')) {
        return { message: 'Aksi disimulasikan berhasil.' };
      }
      return { success: true };
    };

    if (isUsingMock) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          try {
            const res = runMockPost();
            resolve({ data: res });
          } catch (e) {
            reject(e);
          }
        }, 500);
      });
    }

    try {
      const { data } = await axios.post(`${APPS_SCRIPT_URL}?action=${action}`, JSON.stringify({ action, ...payload }), {
        headers: {
          'Content-Type': 'text/plain;charset=utf-8', 
        }
      });
      if (!data.success) {
        if (action === 'saveAbsensiPengajar' && data.message === 'Unknown action') {
          const res = runMockPost();
          return { data: res };
        }
        throw new Error(data.message);
      }
      return data;
    } catch (error: any) {
      console.warn(`Post request failed for action "${action}". Falling back to simulated mock post.`, error);
      try {
        const res = runMockPost();
        return { data: res, isFallback: true };
      } catch (errFallback) {
        throw error;
      }
    }
  }
};
