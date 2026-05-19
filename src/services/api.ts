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
  { id: 'j1', hari: 'Senin', jam_mulai: '08:00', jam_selesai: '10:00', kelas: 'Syariah', matakuliah: 'Fiqih Munakahat', pengajar: 'Ust. Ahmad' }
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
