export interface User {
  id: string;
  nama: string;
  email: string;
  role: 'admin' | 'pengajar' | 'mahasantri';
  status: 'active' | 'inactive' | 'aktif' | 'nonaktif';
  nim?: string;
  program?: string;
  kelas?: string;
}

export interface Mahasantri {
  id: string;
  nim: string;
  nama: string;
  jenis_kelamin?: 'laki-laki' | 'perempuan' | string;
  program: string;
  kelas: string;
  status: 'aktif' | 'nonaktif' | 'lulus';
}

export interface Pengajar {
  id: string;
  nama: string;
  jabatan: string;
  status: 'aktif' | 'nonaktif';
}

export interface Matakuliah {
  id: string;
  kode: string;
  nama_mk: string;
  program: string;
  kelas: string;
  pengajar: string;
  sks?: number | string;
}

export interface Kelas {
  id: string;
  program: string;
  nama_kelas: string;
}

export interface Jadwal {
  id: string;
  hari: string;
  jam_ke: string;
  jam_mulai: string;
  jam_berakhir: string;
  program: string;
  kelas: string;
  nama_mk: string;
  pengajar: string;
}

export interface Absensi {
  id: string;
  tanggal: string; // YYYY-MM-DD
  jam_ke: string;
  nama_mk?: string;
  program: string;
  kelas: string;
  mahasiswa_id: string; // referensi id mahasantri
  status: 'hadir' | 'izin' | 'sakit' | 'alpa' | 'terlambat' | string;
  pembahasan?: string;
  timestamp: string;
}

export interface Nilai {
  id: string;
  mahasiswa_id: string;
  program: string;
  kelas: string;
  nama_mk: string;
  presensi: number; // Max 10
  tugas: number; // Max 20
  uts: number; // Max 30
  uas: number; // Max 40
  total: number;
  tahun_akademik?: string;
  semester?: string;
}

export interface Pengumuman {
  id: string;
  kategori: string;
  judul: string;
  tanggal: string; // DD MMM YYYY or YYYY-MM-DD
  isi_lengkap: string;
  penting: boolean | string;
}

