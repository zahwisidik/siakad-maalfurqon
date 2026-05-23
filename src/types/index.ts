export interface User {
  id: string;
  nama: string;
  email: string;
  role: 'admin' | 'pengajar';
  status: 'active' | 'inactive' | 'aktif' | 'nonaktif';
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
