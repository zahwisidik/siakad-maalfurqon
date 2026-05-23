/// <reference types="vite/client" />
import axios from 'axios';
import { User, Mahasantri, Pengajar, Kelas, Jadwal, Absensi } from '../types';

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL || '';

// --- MOCK DATA --- 
// Dipakai jika belum terkoneksi dengan G-Sheets
let mockMahasantri = [
  { id: 'm1', nim: '1001', nama: 'Fulan', jenis_kelamin: 'laki-laki', kelas: "I'dad Lughowi", semester: '1', status: 'aktif' },
  { id: 'm2', nim: '1002', nama: 'Fulanah', jenis_kelamin: 'perempuan', kelas: 'Syariah', semester: '1', status: 'aktif' },
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
  { id: 'mk1', kode: 'MK-01', nama: 'Fiqih Munakahat' },
  { id: 'mk2', kode: 'MK-02', nama: 'Aqidah Dasar' },
];

let mockKelas = [
  { id: 'k1', nama_kelas: "I'dad Lughowi", angkatan: '2024' },
  { id: 'k2', nama_kelas: 'Syariah', angkatan: '2023' },
];

let mockNilai: any[] = [];

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
            if (payload.email === 'admin@admin.com') resolve({ data: { user: { id: '1', nama: 'Admin', email: 'admin@admin.com', role: 'admin', status: 'active' } } });
            else if (payload.email === 'ahmad@pengajar.com') resolve({ data: { user: { id: '2', nama: 'Ust. Ahmad', email: 'ahmad@pengajar.com', role: 'pengajar', status: 'active' } } });
            else reject(new Error('Invalid credentials'));
          } else if (action === 'saveAbsensi') {
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
