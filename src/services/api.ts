/// <reference types="vite/client" />
import axios from 'axios';
import { User, Mahasantri, Pengajar, Kelas, Jadwal, Absensi } from '../types';

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL || '';

// --- MOCK DATA --- 
// Dipakai jika belum terkoneksi dengan G-Sheets
let mockMahasantri = [
  { id: 'm1', nim: '1001', nama: 'Fulan', jenis_kelamin: 'laki-laki', program: "I'dad Lughowi", kelas: "Semester 2 - Putra", status: 'aktif' },
  { id: 'm2', nim: '1002', nama: 'Fulanah', jenis_kelamin: 'perempuan', program: "Syariah", kelas: "Semester 1 - Putri", status: 'aktif' },
  { id: 'm3', nim: '529.01.05.25', nama: 'Adnan', jenis_kelamin: 'laki-laki', program: "I'dad Lughowi", kelas: "Semester 2 - Putra", status: 'aktif' },
];

let mockJadwal = [
  { id: 'j1', hari: 'Senin', jam_ke: '1', jam_mulai: '08:00', jam_berakhir: '10:00', jam_selesai: '10:00', program: 'I\'dad Lughowi', kelas: 'Semester 2 - Putra', nama_mk: 'Fiqih Munakahat', matakuliah: 'Fiqih Munakahat', pengajar: 'Ust. Ahmad' },
  { id: 'j2', hari: 'Senin', jam_ke: '2', jam_mulai: '10:15', jam_berakhir: '12:00', jam_selesai: '12:00', program: 'Syariah', kelas: 'Semester 1 - Putra', nama_mk: 'Aqidah Dasar', matakuliah: 'Aqidah Dasar', pengajar: 'Ust. Ahmad' },
  { id: 'j3', hari: 'Selasa', jam_ke: '1', jam_mulai: '08:00', jam_berakhir: '10:00', jam_selesai: '10:00', program: 'I\'dad Lughowi', kelas: 'Semester 2 - Putra', nama_mk: 'Bahasa Arab', matakuliah: 'Bahasa Arab', pengajar: 'Ust. Ahmad' }
];

let mockPengajar = [
  { id: 'p1', nama: 'Ust. Ahmad', mapel: 'Fiqih', status: 'aktif' },
  { id: 'p2', nama: 'Ust. Budi', mapel: 'Aqidah', status: 'aktif' },
];

let mockMatakuliah = [
  { id: 'mk1', kode: 'MK-01', nama: 'Fiqih Munakahat', nama_mk: 'Fiqih Munakahat', program: "I'dad Lughowi", kelas: "Semester 2 - Putra", sks: 3, pengajar: 'Ust. Ahmad' },
  { id: 'mk2', kode: 'MK-02', nama: 'Aqidah Dasar', nama_mk: 'Aqidah Dasar', program: "Syariah", kelas: "Semester 1 - Putri", sks: 2, pengajar: 'Ust. Ahmad' },
  { id: 'mk3', kode: 'MK-03', nama: 'Bahasa Arab', nama_mk: 'Bahasa Arab', program: "I'dad Lughowi", kelas: "Semester 2 - Putra", sks: 4, pengajar: 'Ust. Ahmad' },
];

let mockKelas = [
  { id: 'k1', nama_kelas: "Semester 2 - Putra", program: "I'dad Lughowi" },
  { id: 'k2', nama_kelas: "Semester 1 - Putri", program: "Syariah" },
];

let mockNilai = [
  { id: 'n1', mahasiswa_id: 'm1', program: "I'dad Lughowi", kelas: "Semester 2 - Putra", nama_mk: "Fiqih Munakahat", presensi: 10, tugas: 18, uts: 28, uas: 38, total: 94, tahun_akademik: "2025/2026", semester: "Genap" },
  { id: 'n2', mahasiswa_id: 'm1', program: "I'dad Lughowi", kelas: "Semester 2 - Putra", nama_mk: "Bahasa Arab", presensi: 9, tugas: 17, uts: 25, uas: 35, total: 86, tahun_akademik: "2025/2026", semester: "Genap" },
  { id: 'n3', mahasiswa_id: 'm3', program: "I'dad Lughowi", kelas: "Semester 2 - Putra", nama_mk: "Fiqih Munakahat", presensi: 10, tugas: 19, uts: 27, uas: 36, total: 92, tahun_akademik: "2025/2026", semester: "Genap" },
  { id: 'n4', mahasiswa_id: 'm3', program: "I'dad Lughowi", kelas: "Semester 2 - Putra", nama_mk: "Bahasa Arab", presensi: 10, tugas: 18, uts: 29, uas: 37, total: 94, tahun_akademik: "2025/2026", semester: "Genap" },
];

let mockAbsensi: Absensi[] = [
  { id: 'a1', tanggal: '2026-05-18', jam_ke: '1', nama_mk: 'Fiqih Munakahat', program: "I'dad Lughowi", kelas: "Semester 2 - Putra", mahasiswa_id: 'm1', status: 'hadir', timestamp: '2026-05-18T08:05:00Z' },
  { id: 'a2', tanggal: '2026-05-18', jam_ke: '2', nama_mk: 'Aqidah Dasar', program: "Syariah", kelas: "Semester 1 - Putri", mahasiswa_id: 'm2', status: 'hadir', timestamp: '2026-05-18T10:20:00Z' },
  { id: 'a3', tanggal: '2026-05-19', jam_ke: '1', nama_mk: 'Bahasa Arab', program: "I'dad Lughowi", kelas: "Semester 2 - Putra", mahasiswa_id: 'm1', status: 'hadir', timestamp: '2026-05-19T08:03:00Z' },
  { id: 'a4', tanggal: '2026-05-18', jam_ke: '1', nama_mk: 'Fiqih Munakahat', program: "I'dad Lughowi", kelas: "Semester 2 - Putra", mahasiswa_id: 'm3', status: 'hadir', timestamp: '2026-05-18T08:04:00Z' },
  { id: 'a5', tanggal: '2026-05-19', jam_ke: '1', nama_mk: 'Bahasa Arab', program: "I'dad Lughowi", kelas: "Semester 2 - Putra", mahasiswa_id: 'm3', status: 'hadir', timestamp: '2026-05-19T08:02:00Z' }
];

export const isUsingMock = !APPS_SCRIPT_URL;

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
          resolve({ data: [] });
        }, 500);
      });
    }

    const { data } = await axios.get(`${APPS_SCRIPT_URL}?action=${action}`);
    if (!data.success) throw new Error(data.message);
    return data;
  },

  post: async (action: string, payload: any) => {
    if (isUsingMock) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (action === 'login') {
            const emailLower = (payload.email || '').toLowerCase();
            if (emailLower === 'admin@admin.com') {
              resolve({ data: { user: { id: '1', nama: 'Admin', email: 'admin@admin.com', role: 'admin', status: 'active' } } });
            } else if (emailLower === 'ahmad@pengajar.com') {
              resolve({ data: { user: { id: '2', nama: 'Ust. Ahmad', email: 'ahmad@pengajar.com', role: 'pengajar', status: 'active' } } });
            } else if (emailLower === 'fulan@mahasantri.com' || payload.email === '1001') {
              resolve({ data: { user: { id: 'm1', nama: 'Fulan', email: 'fulan@mahasantri.com', nim: '1001', role: 'mahasantri', status: 'aktif', program: "I'dad Lughowi", kelas: "Semester 2 - Putra" } } });
            } else if (emailLower === 'fulanah@mahasantri.com' || payload.email === '1002') {
              resolve({ data: { user: { id: 'm2', nama: 'Fulanah', email: 'fulanah@mahasantri.com', nim: '1002', role: 'mahasantri', status: 'aktif', program: "Syariah", kelas: "Semester 1 - Putri" } } });
            } else {
              // check if it's dynamic
              const found = mockMahasantri.find(m => m.nim === payload.email || m.nama.toLowerCase() === emailLower);
              if (found) {
                resolve({ data: { user: { id: found.id, nama: found.nama, email: found.nim + '@mahasantri.com', nim: found.nim, role: 'mahasantri', status: 'aktif', program: found.program, kelas: found.kelas } } });
              } else {
                reject(new Error('User tidak ditemukan. Gunakan admin@admin.com, ahmad@pengajar.com, atau 1001/1002'));
              }
            }
          } else if (action === 'saveAbsensi') {
            if (payload.data && Array.isArray(payload.data)) {
              payload.data.forEach((item: any) => {
                mockAbsensi.push({
                  id: 'a_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                  tanggal: payload.tanggal || new Date().toISOString().split('T')[0],
                  jam_ke: payload.jam_ke || '1',
                  nama_mk: payload.nama_mk || '',
                  program: payload.program || '',
                  kelas: payload.kelas || '',
                  mahasiswa_id: item.mahasiswa_id,
                  status: item.status,
                  pembahasan: payload.pembahasan || '',
                  timestamp: new Date().toISOString()
                });
              });
            }
            resolve({ data: { message: 'Absensi simulated save.'} });
          } else if (action === 'saveNilai') {
            const index = mockNilai.findIndex((n: any) => n.mahasiswa_id === payload.mahasiswa_id && n.nama_mk === payload.nama_mk && n.kelas === payload.kelas);
            if (index > -1) {
              mockNilai[index] = { ...mockNilai[index], ...payload };
            } else {
              mockNilai.push({ id: Date.now().toString(), ...payload });
            }
            resolve({ data: { message: 'Nilai tersimpan (mock).' } });
          } else if (action.startsWith('add') || action.startsWith('update') || action.startsWith('delete')) {
             resolve({ data: { message: 'Aksi disimulasikan berhasil.' }});
          }
        }, 500);
      });
    }

    const { data } = await axios.post(`${APPS_SCRIPT_URL}?action=${action}`, JSON.stringify({ action, ...payload }), {
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', 
      }
    });
    if (!data.success) throw new Error(data.message);
    return data;
  }
};
