import { Link } from 'react-router-dom';

export default function SetupGuide() {
  return (
    <div className="min-h-screen bg-slate-50 p-8 text-slate-800 font-sans">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Panduan Setup Database & Backend</h1>
        
        <div className="prose prose-emerald max-w-none">
          <p>
            Sistem Administrasi Akademik Ma'had Aly Al-Furqon ini memiliki backend API berbasis Google Apps Script dengan database Google Sheets. 
            Ikuti panduan berikut untuk menyiapkan database Anda sendiri:
          </p>

          <h3 className="text-xl font-bold mt-8 mb-4">Langkah 1: Siapkan Google Sheets</h3>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Buka <a href="https://sheets.google.com" target="_blank" rel="noreferrer" className="text-emerald-600 underline">Google Sheets</a> dan buat dokumen baru bernama "Database Absensi Mahasantri".</li>
            <li>Buat sheet (tab) secara spesifik dengan nama-nama berikut secara huruf besar:
              <ul className="list-disc pl-5 font-mono text-sm mt-1">
                <li>USERS</li>
                <li>MAHASANTRI</li>
                <li>PENGAJAR</li>
                <li>MATAKULIAH</li>
                <li>KELAS</li>
                <li>JADWAL</li>
                <li>ABSENSI</li>
              </ul>
            </li>
            <li>Di Sheet <code>USERS</code>, tulis header di baris ke-1, kolom A-F: <code>id</code>, <code>nama</code>, <code>email</code>, <code>password</code>, <code>role</code>, <code>status</code>.</li>
            <li>Tambahkan data admin di baris ke-2:<br/>
              <code>1</code> | <code>Admin</code> | <code>admin@admin.com</code> | <code>password123</code> | <code>admin</code> | <code>active</code>
            </li>
            <li>Di Sheet <code>MAHASANTRI</code>, pastikan memiliki header: <code>id</code>, <code>nim</code>, <code>nama</code>, <code>jenis_kelamin</code>, <code>kelas</code>, <code>semester</code>, <code>status</code>.</li>
          </ol>

          <h3 className="text-xl font-bold mt-8 mb-4">Langkah 2: Pasang Apps Script</h3>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Di Google Sheets, klik menu <b>Ekstensi</b> &gt; <b>Apps Script</b>.</li>
            <li>Di Project AI Studio Anda, buka file <code>APPS_SCRIPT_CODE.js</code>. Copy semua kodenya.</li>
            <li>Paste ke editor Apps Script, timpa semua file <code>Code.gs</code> bawaan.</li>
            <li>Klik tombol <b>Terapkan (Deploy)</b> di kanan atas &gt; <b>Penerapan baru (New deployment)</b>.</li>
            <li>Pilih jenis (Pilih roda gigi): <b>Aplikasi Web (Web App)</b>.</li>
            <li>Pastikan dijalankan sebagai "Saya (Me)", dan Akses: <b>"Siapa saja (Anyone)"</b>.</li>
            <li>Klik Deploy. Berikan izin (Authorize) mengikuti petunjuk layar.</li>
            <li>Copy URL Aplikasi Web yang digenerate (Dimulai dengan <code>https://script.google.com/macros/s/...</code>).</li>
          </ol>

          <h3 className="text-xl font-bold mt-8 mb-4">Langkah 3: Konfigurasi Frontend</h3>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Buka Secrets/Environments.</li>
            <li>Tambahkan key <code>VITE_APPS_SCRIPT_URL</code>.</li>
            <li>Paste URL Aplikasi Web yang Anda copy ke sana.</li>
          </ol>

          <div className="mt-8 pt-8 border-t border-slate-200">
            <Link to="/login" className="text-emerald-600 font-medium hover:underline">
              &larr; Kembali ke halaman Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
