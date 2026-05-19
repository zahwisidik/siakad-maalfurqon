# PANDUAN DEPLOYMENT & PENGGUNAAN

Aplikasi Sistem Manajemen Absensi Mahasantri ini dibangun menggunakan React (Vite) dengan backend Google Apps Script dan Google Sheets sebagai database.

## 1. Persiapan Google Sheets & Apps Script

1. Buka [Google Sheets](https://sheets.google.com) dan buat dokumen baru bernama "Database Absensi Mahasantri".
2. Buat sheet (tab) di bagian bawah dengan nama-nama berikut SEGERA:
   - `USERS`
   - `MAHASANTRI`
   - `PENGAJAR`
   - `MATAKULIAH`
   - `KELAS`
   - `JADWAL`
   - `ABSENSI`
3. Di dalam Sheet `USERS`, buat header di baris pertama (A1, B1, dst):
   - `id`, `nama`, `email`, `password`, `role`, `status`
4. Masukkan satu baris data admin di Sheet `USERS`:
   - id: `1`
   - nama: `Admin`
   - email: `admin@admin.com`
   - password: `password123`
   - role: `admin`
   - status: `active`
5. Buka Menu **Ekstensi** > **Apps Script**.
6. Buka file `APPS_SCRIPT_CODE.js` di dalam project ini, salin seluruh kodenya.
7. Paste kode tersebut ke editor Google Apps Script. 
8. Klik tombol **Deploy** (Penerapan) > **New deployment** (Penerapan baru) di pojok kanan atas.
9. Tekan icon gir, pilih **Web app**.
   - Execute as: Me (Diri Anda)
   - Who has access: Anyone (Siapa Saja)
10. Klik Deploy. Izinkan akses (Authorize access) ketika diminta.
11. Salin **Web app URL** yang muncul.

## 2. Pemasangan di Aplikasi Muka (Frontend)

1. Buka menu rahasia atau Environments melalui UI Setting AI Studio.
2. Tambahkan variable bernama `VITE_APPS_SCRIPT_URL` dengan nilai URL yang tadi Anda salin.
3. Aplikasi secara otomatis akan mendeteksi koneksi dan beroperasi menggunakan database nyata Anda. 
*(Jika Anda tidak memasang URL-nya, aplikasi akan menggunakan Mode Offline/Mockup dengan dummy data)*

## 3. Deploy ke Vercel

1. Buat repository di GitHub, push kode aplikasi ini (export ke github jika menggunakan AI Studio).
2. Login ke [Vercel](https://vercel.com).
3. Klik **Add New** > **Project** dan import repository GitHub Anda.
4. Pada bagian **Environment Variables**, tambahkan:
   - Key: `VITE_APPS_SCRIPT_URL`
   - Value: URL Web App Anda dari Google Apps Script.
5. Biarkan Build Command menggunakan mode Vite.
6. Klik **Deploy**.

## Info Login Akun Bawaan (Bila Menggunakan Mode Mock/Local Data):
Aplikasi ini sudah dipasang Mock Data untuk preview jika Anda belum punya URL backend.
- Admin: `admin@admin.com` | `password123`
- Pengajar: `ahmad@pengajar.com` | `pass123`
