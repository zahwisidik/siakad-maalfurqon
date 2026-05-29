import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Matakuliah, Kelas, Jadwal, Mahasantri, Nilai } from '../../types';
import { RefreshCw, AlertCircle, TrendingUp, Search, Filter, BookOpen, Download, Compass, Edit2, X, Save, Plus, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

export default function PenilaianPengajar() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [jadwals, setJadwals] = useState<Jadwal[]>([]);
  const [matakuliahs, setMatakuliahs] = useState<Matakuliah[]>([]);
  const [kelas, setKelas] = useState<Kelas[]>([]);
  const [mahasantris, setMahasantris] = useState<Mahasantri[]>([]);
  const [nilais, setNilais] = useState<Nilai[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedMK, setSelectedMK] = useState('');
  const [selectedKelas, setSelectedKelas] = useState('');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMhs, setEditingMhs] = useState<Mahasantri | null>(null);
  const [editData, setEditData] = useState({ presensi: '', tugas: '', uts: '', uas: '', semester: 'Ganjil', tahunAkademik: new Date().getFullYear().toString() });
  const [isSaving, setIsSaving] = useState(false);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addTahun, setAddTahun] = useState(new Date().getFullYear().toString());
  const [addSemester, setAddSemester] = useState('Ganjil');
  const [addInputData, setAddInputData] = useState<Record<string, { presensi: string, tugas: string, uts: string, uas: string }>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resJadwal, resMK, resKelas, resMhs, resNilai] = await Promise.all([
        api.get('getJadwal'),
        api.get('getMatakuliah'),
        api.get('getKelas'),
        api.get('getMahasantri'),
        api.get('getNilai')
      ]);

      const myJadwal = resJadwal.data.filter((j: Jadwal) => j.pengajar === user?.nama);
      setJadwals(myJadwal);
      setMatakuliahs(resMK.data);
      setKelas(resKelas.data);
      setMahasantris(resMhs.data);
      setNilais(resNilai.data || []);
      
      if (myJadwal.length > 0) {
        const uniquePrograms = Array.from(new Set(myJadwal.map(j => j.program)));
        if (uniquePrograms.length > 0) {
          setSelectedProgram(prev => {
            if (prev && uniquePrograms.includes(prev)) return prev;
            return uniquePrograms[0];
          });
        }
      }
    } catch (error: any) {
      toast.error('Gagal memuat data: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Determine available matakuliah for selected Program from jadwal
    if (selectedProgram) {
      const availableMK = Array.from(new Set(jadwals.filter(j => j.program === selectedProgram).map(j => j.nama_mk)));
      if (availableMK.length > 0 && !availableMK.includes(selectedMK)) {
        setSelectedMK(availableMK[0]);
      } else if (availableMK.length === 0) {
        setSelectedMK('');
      }
    }
  }, [selectedProgram, jadwals]);

  useEffect(() => {
    // Determine available kelas for selected MK from jadwal
    if (selectedMK) {
      const availableKelas = Array.from(new Set(jadwals.filter(j => j.program === selectedProgram && j.nama_mk === selectedMK).map(j => j.kelas)));
      if (availableKelas.length > 0 && !availableKelas.includes(selectedKelas)) {
        setSelectedKelas(availableKelas[0]);
      } else if (availableKelas.length === 0) {
        setSelectedKelas('');
      }
    }
  }, [selectedMK, selectedProgram, jadwals]);

  const handleEditClick = (mhs: Mahasantri, n: Nilai | undefined) => {
    setEditingMhs(mhs);
    if (n) {
      setEditData({
        presensi: n.presensi.toString(),
        tugas: n.tugas.toString(),
        uts: n.uts.toString(),
        uas: n.uas.toString(),
        semester: n.semester || 'Ganjil',
        tahunAkademik: n.tahun_akademik || new Date().getFullYear().toString(),
      });
    } else {
      setEditData({
        presensi: '',
        tugas: '',
        uts: '',
        uas: '',
        semester: 'Ganjil',
        tahunAkademik: new Date().getFullYear().toString(),
      });
    }
    setIsEditModalOpen(true);
  };

  const handleEditChange = (field: 'presensi' | 'tugas' | 'uts' | 'uas' | 'semester' | 'tahunAkademik', value: string) => {
    if (field === 'semester' || field === 'tahunAkademik') {
      setEditData(prev => ({
        ...prev,
        [field]: value
      }));
      return;
    }

    let numVal = parseInt(value || '0');
    if (field === 'presensi' && numVal > 10) numVal = 10;
    if (field === 'tugas' && numVal > 20) numVal = 20;
    if (field === 'uts' && numVal > 30) numVal = 30;
    if (field === 'uas' && numVal > 40) numVal = 40;
    if (numVal < 0) numVal = 0;
    
    setEditData(prev => ({
      ...prev,
      [field]: value === '' ? '' : numVal.toString()
    }));
  };

  const handleSaveEdit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    if (!editingMhs || !selectedMK || !selectedKelas || !selectedProgram) return;
    
    setIsSaving(true);
    try {
      const presensi = parseFloat(editData.presensi || '0');
      const tugas = parseFloat(editData.tugas || '0');
      const uts = parseFloat(editData.uts || '0');
      const uas = parseFloat(editData.uas || '0');
      const total = presensi + tugas + uts + uas;
      
      await api.post('saveNilai', {
        mahasiswa_id: editingMhs.id,
        program: selectedProgram,
        kelas: selectedKelas,
        nama_mk: selectedMK,
        presensi,
        tugas,
        uts,
        uas,
        total,
        tahun_akademik: editData.tahunAkademik,
        semester: editData.semester
      });
      
      toast.success('Nilai berhasil diperbarui!');
      setIsEditModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error('Gagal menyimpan nilai: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        if (!worksheet) {
          toast.error('Lembar kerja Excel pertama kosong atau tidak valid.');
          return;
        }

        // Parse sheet as raw rows to be robust against header offsets, custom titles, etc.
        const rawRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
        
        if (rawRows.length === 0) {
          toast.error('Tidak ada baris data ditemukan di dalam file Excel.');
          return;
        }

        const normalizeHeaderName = (str: any) => {
          if (str === null || str === undefined) return '';
          return str.toString().trim().replace(/[\s_\-]+/g, '').toLowerCase();
        };

        const normalizeName = (name: string) => {
          if (!name) return '';
          return name.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
        };

        // Try to find the header row by searching for cell contents that mention NIM or Nama
        let headerRowIndex = -1;
        
        for (let i = 0; i < rawRows.length; i++) {
          const row = rawRows[i];
          if (!Array.isArray(row)) continue;
          
          const normalizedCells = row.map(cell => normalizeHeaderName(cell));
          const hasNama = normalizedCells.some(cell => 
            ['nama', 'namamahasiswa', 'namamahasantri', 'name', 'studentname'].includes(cell) || cell.includes('nama')
          );
          const hasNim = normalizedCells.some(cell => 
            ['nim', 'nimmahasiswa', 'nimmahasantri', 'nomorinduk', 'noinduk', 'id', 'student_id'].includes(cell) || cell.includes('nim')
          );
          
          if (hasNama || hasNim) {
            headerRowIndex = i;
            break;
          }
        }

        // If no explicit header row is found with expected words, fallback to index 0 or first non-empty row
        if (headerRowIndex === -1) {
          for (let i = 0; i < rawRows.length; i++) {
            if (rawRows[i] && rawRows[i].filter(Boolean).length >= 2) {
              headerRowIndex = i;
              break;
            }
          }
        }

        if (headerRowIndex === -1) {
          toast.error('Gagal mendeteksi baris judul/kolom pada file Excel. Pastikan file memiliki baris berisi Nama atau NIM.');
          return;
        }

        // Map column names to indexes by scanning multiple header rows (up to 3 rows from headerRowIndex)
        const colIndexes = {
          nim: -1,
          nama: -1,
          presensi: -1,
          tugas: -1,
          uts: -1,
          uas: -1
        };

        const endHeaderRow = Math.min(rawRows.length, headerRowIndex + 3);
        for (let r = headerRowIndex; r < endHeaderRow; r++) {
          const row = rawRows[r];
          if (!Array.isArray(row)) continue;

          row.forEach((cell: any, idx: number) => {
            const norm = normalizeHeaderName(cell);
            if (!norm) return;

            // NIM aliases (only match if not already found in preceding header row)
            if (colIndexes.nim === -1) {
              if (['nim', 'nimmahasiswa', 'nimmahasantri', 'nomorinduk', 'noinduk', 'id', 'student_id'].includes(norm) || norm.includes('nim') || norm === 'noinduk') {
                colIndexes.nim = idx;
              }
            }
            // Nama aliases (only match if not already found in preceding header row)
            if (colIndexes.nama === -1) {
              if (['nama', 'namamahasiswa', 'namamahasantri', 'name', 'studentname', 'namalengkap'].includes(norm) || norm.includes('nama')) {
                colIndexes.nama = idx;
              }
            }
            // Presensi aliases (only match if not already found in preceding header row)
            if (colIndexes.presensi === -1) {
              if (['presensi', 'absen', 'absensi', 'kehadiran', 'harian', 'presence'].some(alias => norm.includes(alias))) {
                colIndexes.presensi = idx;
              }
            }
            // Tugas aliases (only match if not already found in preceding header row)
            if (colIndexes.tugas === -1) {
              if (['tugas', 'nilaitugas', 'tugasharian', 'assignment', 'homework'].some(alias => norm.includes(alias))) {
                colIndexes.tugas = idx;
              }
            }
            // UTS aliases (only match if not already found in preceding header row)
            if (colIndexes.uts === -1) {
              if (['uts', 'ujiantengahsemester', 'nilaiuts', 'midterm', 'tengah'].some(alias => norm.includes(alias))) {
                colIndexes.uts = idx;
              }
            }
            // UAS aliases (only match if not already found in preceding header row)
            if (colIndexes.uas === -1) {
              if (['uas', 'ujianakhirsemester', 'nilaiuas', 'finalterm', 'akhir'].some(alias => norm.includes(alias))) {
                colIndexes.uas = idx;
              }
            }
          });
        }

        console.log('Successfully mapped Excel columns:', colIndexes);

        // Debug output or toast help if we are missing Nama
        if (colIndexes.nama === -1 && colIndexes.nim === -1) {
          toast.error('Kolom Nama atau NIM tidak dapat diidentifikasi pada baris ke-' + (headerRowIndex + 1));
          return;
        }

        const newInputs: Record<string, any> = {};
        let matchedCount = 0;

        // Rows containing data start from headerRowIndex + 1
        const dataRows = rawRows.slice(headerRowIndex + 1);

        activeMhsList.forEach(mhs => {
          const existing = filteredNilais.find(n => n.mahasiswa_id === mhs.id);
          
          // Match row in excel
          const excelRow = dataRows.find(row => {
            if (!Array.isArray(row)) return false;
            
            // 1. Try matching by NIM first if column is found
            if (colIndexes.nim !== -1) {
              const rowNimVal = row[colIndexes.nim];
              if (rowNimVal !== undefined && rowNimVal !== null && rowNimVal.toString().trim().toLowerCase() === mhs.nim.toLowerCase().trim()) {
                return true;
              }
            }

            // 2. Otherwise/Fallback to matching by Nama if column is found
            if (colIndexes.nama !== -1) {
              const rowNamaVal = row[colIndexes.nama];
              if (rowNamaVal !== undefined && rowNamaVal !== null) {
                const normRowName = normalizeName(rowNamaVal.toString());
                const normMhsName = normalizeName(mhs.nama);
                if (normRowName && normMhsName && (normRowName === normMhsName || normRowName.includes(normMhsName) || normMhsName.includes(normRowName))) {
                  return true;
                }
              }
            }
            
            return false;
          });

          if (excelRow) {
            matchedCount++;
            
            const pVal = colIndexes.presensi !== -1 ? excelRow[colIndexes.presensi] : undefined;
            const tVal = colIndexes.tugas !== -1 ? excelRow[colIndexes.tugas] : undefined;
            const utVal = colIndexes.uts !== -1 ? excelRow[colIndexes.uts] : undefined;
            const uaVal = colIndexes.uas !== -1 ? excelRow[colIndexes.uas] : undefined;

            newInputs[mhs.id] = {
              presensi: pVal !== undefined && pVal !== null ? pVal.toString() : (existing?.presensi?.toString() || ''),
              tugas: tVal !== undefined && tVal !== null ? tVal.toString() : (existing?.tugas?.toString() || ''),
              uts: utVal !== undefined && utVal !== null ? utVal.toString() : (existing?.uts?.toString() || ''),
              uas: uaVal !== undefined && uaVal !== null ? uaVal.toString() : (existing?.uas?.toString() || '')
            };
          } else {
            // Keep existing values or set empty
            if (existing) {
              newInputs[mhs.id] = {
                presensi: existing.presensi.toString(),
                tugas: existing.tugas.toString(),
                uts: existing.uts.toString(),
                uas: existing.uas.toString()
              };
            } else {
              newInputs[mhs.id] = { presensi: '', tugas: '', uts: '', uas: '' };
            }
          }
        });

        if (matchedCount === 0) {
          const headerRow = rawRows[headerRowIndex] || [];
          const detectedHeaders = headerRow.filter(Boolean).map(h => `'${h}'`).join(', ');
          toast.error(`Tidak ada nama atau NIM yang cocok dengan siswa aktif.\n\nSaran: Pastikan format excel memiliki kolom 'Nama' atau 'NIM' dan nilainya cocok.\n\nKolom dideteksi pada baris ke-${headerRowIndex + 1}: [${detectedHeaders}]`, {
            duration: 7000
          });
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          return;
        }

        setAddInputData(newInputs);
        setIsAddModalOpen(true);
        toast.success(`Berhasil mengimpor ${matchedCount} data nilai dari Excel.`);
        
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error: any) {
        toast.error('Gagal membaca file Excel: ' + (error.message || 'Format tidak dikenal'));
        console.error(error);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleOpenAddModal = () => {
    const newInputs: Record<string, any> = {};
    activeMhsList.forEach(mhs => {
      const existing = filteredNilais.find(n => n.mahasiswa_id === mhs.id);
      if (existing) {
        newInputs[mhs.id] = {
          presensi: existing.presensi.toString(),
          tugas: existing.tugas.toString(),
          uts: existing.uts.toString(),
          uas: existing.uas.toString()
        };
      } else {
        newInputs[mhs.id] = { presensi: '', tugas: '', uts: '', uas: '' };
      }
    });
    setAddInputData(newInputs);
    setIsAddModalOpen(true);
  };

  const handleAddInputChange = (mhsId: string, field: 'presensi' | 'tugas' | 'uts' | 'uas', value: string) => {
    let numVal = parseInt(value || '0');
    if (field === 'presensi' && numVal > 10) numVal = 10;
    if (field === 'tugas' && numVal > 20) numVal = 20;
    if (field === 'uts' && numVal > 30) numVal = 30;
    if (field === 'uas' && numVal > 40) numVal = 40;
    if (numVal < 0) numVal = 0;
    
    setAddInputData(prev => ({
      ...prev,
      [mhsId]: {
        ...prev[mhsId],
        [field]: value === '' ? '' : numVal.toString()
      }
    }));
  };

  const handleSaveAddBulk = async () => {
    if (!selectedMK || !selectedKelas || !selectedProgram) return;
    
    setIsSaving(true);
    try {
      for (const mhs of activeMhsList) {
        const data = addInputData[mhs.id];
        const presensi = parseFloat(data.presensi || '0');
        const tugas = parseFloat(data.tugas || '0');
        const uts = parseFloat(data.uts || '0');
        const uas = parseFloat(data.uas || '0');
        const total = presensi + tugas + uts + uas;
        
        await api.post('saveNilai', {
          mahasiswa_id: mhs.id,
          program: selectedProgram,
          kelas: selectedKelas,
          nama_mk: selectedMK,
          presensi,
          tugas,
          uts,
          uas,
          total,
          tahun_akademik: addTahun,
          semester: addSemester
        });
      }
      
      toast.success('Semua nilai berhasil disimpan!');
      setIsAddModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error('Gagal menyimpan nilai: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Get unique programs, matakuliah from jadwal
  const uniqueProgramsOptions = Array.from(new Set(jadwals.map(j => j.program)));
  const uniqueMKOptions = selectedProgram ? Array.from(new Set(jadwals.filter(j => j.program === selectedProgram).map(j => j.nama_mk))) : [];
  const availableKelasOptions = selectedMK ? Array.from(new Set(jadwals.filter(j => j.program === selectedProgram && j.nama_mk === selectedMK).map(j => j.kelas))) : [];
  
  const activeMhsList = mahasantris.filter(m => m.program === selectedProgram && m.kelas === selectedKelas && m.status === 'aktif');
  
  // Sort mahasantri by name
  activeMhsList.sort((a, b) => a.nama.localeCompare(b.nama));

  const filteredNilais = nilais.filter(n => n.nama_mk === selectedMK && n.kelas === selectedKelas);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            Rekap Nilai Mahasantri
          </h2>
          <p className="text-slate-500 text-sm mt-1">Lihat rekapitulasi penilaian akademik per matakuliah reguler.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImportExcel} 
            accept=".xlsx, .xls" 
            className="hidden" 
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={activeMhsList.length === 0}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 hover:text-emerald-600 disabled:opacity-50 transition-colors text-sm font-medium shadow-sm"
          >
            <Upload className="w-4 h-4" />
            <span>Import Excel</span>
          </button>
          
          <button 
            onClick={fetchData}
            title="Refresh Data"
            className="p-2.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-slate-200 bg-white"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleOpenAddModal}
            disabled={activeMhsList.length === 0}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors text-sm font-medium shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Data Nilai</span>
          </button>
        </div>
      </div>

      <div className="p-6 border-b border-slate-200 bg-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2">
              <Compass className="w-4 h-4 text-slate-400" />
              Program
            </label>
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="block w-full rounded-lg border-slate-300 bg-slate-50 text-slate-800 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm pl-3 pr-10 py-2.5 border"
            >
              {uniqueProgramsOptions.length === 0 && <option value="" disabled>Belum ada jadwal mengajar</option>}
              {uniqueProgramsOptions.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-slate-400" />
              Mata Kuliah
            </label>
            <select
              value={selectedMK}
              onChange={(e) => setSelectedMK(e.target.value)}
              disabled={!selectedProgram}
              className="block w-full rounded-lg border-slate-300 bg-slate-50 text-slate-800 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm pl-3 pr-10 py-2.5 border disabled:bg-slate-100 disabled:text-slate-400"
            >
              {uniqueMKOptions.map(mk => (
                <option key={mk} value={mk}>{mk}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              Pilih Kelas
            </label>
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              disabled={!selectedMK}
              className="block w-full rounded-lg border-slate-300 bg-slate-50 text-slate-800 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm pl-3 pr-10 py-2.5 border disabled:bg-slate-100 disabled:text-slate-400"
            >
              {availableKelasOptions.map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {(selectedMK && selectedKelas) ? (
        isLoading ? (
          <div className="overflow-x-auto animate-pulse">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-[5%] bg-slate-100">
                    No
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-[30%]">
                    Nama Mahasantri / NIM
                  </th>
                  <th scope="col" className="px-4 py-4 text-center text-xs font-semibold text-emerald-700 uppercase tracking-wider bg-emerald-50/50">
                    Presensi<br/><span className="text-[10px] text-emerald-600 font-normal block mt-0.5">(Maks. 10)</span>
                  </th>
                  <th scope="col" className="px-4 py-4 text-center text-xs font-semibold text-blue-700 uppercase tracking-wider bg-blue-50/50">
                    Tugas<br/><span className="text-[10px] text-blue-600 font-normal block mt-0.5">(Maks. 20)</span>
                  </th>
                  <th scope="col" className="px-4 py-4 text-center text-xs font-semibold text-amber-700 uppercase tracking-wider bg-amber-50/50">
                    UTS<br/><span className="text-[10px] text-amber-600 font-normal block mt-0.5">(Maks. 30)</span>
                  </th>
                  <th scope="col" className="px-4 py-4 text-center text-xs font-semibold text-indigo-700 uppercase tracking-wider bg-indigo-50/50">
                    UAS<br/><span className="text-[10px] text-indigo-600 font-normal block mt-0.5">(Maks. 40)</span>
                  </th>
                  <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider bg-slate-100 border-l border-slate-200">
                    Total
                  </th>
                  <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider bg-slate-100">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {[1, 2, 3].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4 bg-slate-50/30"><div className="h-4 bg-slate-200 rounded w-4"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-40"></div><div className="h-3 bg-slate-100 rounded w-24 mt-2"></div></td>
                    <td className="px-2 py-4 bg-emerald-50/10"><div className="h-4 bg-slate-200 rounded w-8 mx-auto"></div></td>
                    <td className="px-2 py-4 bg-blue-50/10"><div className="h-4 bg-slate-200 rounded w-8 mx-auto"></div></td>
                    <td className="px-2 py-4 bg-amber-50/10"><div className="h-4 bg-slate-200 rounded w-8 mx-auto"></div></td>
                    <td className="px-2 py-4 bg-indigo-50/10"><div className="h-4 bg-slate-200 rounded w-8 mx-auto"></div></td>
                    <td className="px-6 py-4 bg-slate-50 border-l border-slate-200"><div className="h-4 bg-slate-200 rounded w-8 mx-auto"></div></td>
                    <td className="px-6 py-4 text-center"><div className="h-8 bg-slate-200 rounded w-16 mx-auto"></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeMhsList.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-lg font-medium text-slate-600">Belum ada data mahasantri</p>
            <p className="text-sm mt-1 mb-4">Kelas ini kosong atau tidak ada mahasantri aktif.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-[5%] bg-slate-100">
                    No
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-[30%]">
                    Nama Mahasantri / NIM
                  </th>
                  <th scope="col" className="px-4 py-4 text-center text-xs font-semibold text-emerald-700 uppercase tracking-wider bg-emerald-50/50">
                    Presensi<br/><span className="text-[10px] text-emerald-600 font-normal block mt-0.5">(Maks. 10)</span>
                  </th>
                  <th scope="col" className="px-4 py-4 text-center text-xs font-semibold text-blue-700 uppercase tracking-wider bg-blue-50/50">
                    Tugas<br/><span className="text-[10px] text-blue-600 font-normal block mt-0.5">(Maks. 20)</span>
                  </th>
                  <th scope="col" className="px-4 py-4 text-center text-xs font-semibold text-amber-700 uppercase tracking-wider bg-amber-50/50">
                    UTS<br/><span className="text-[10px] text-amber-600 font-normal block mt-0.5">(Maks. 30)</span>
                  </th>
                  <th scope="col" className="px-4 py-4 text-center text-xs font-semibold text-indigo-700 uppercase tracking-wider bg-indigo-50/50">
                    UAS<br/><span className="text-[10px] text-indigo-600 font-normal block mt-0.5">(Maks. 40)</span>
                  </th>
                  <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider bg-slate-100 border-l border-slate-200">
                    Total
                  </th>
                  <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider bg-slate-100">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {activeMhsList.map((mhs, i) => {
                  const data = filteredNilais.find(n => n.mahasiswa_id === mhs.id);
                  const total = data ? data.total : 0;
                  
                  return (
                    <tr key={mhs.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-500 font-medium bg-slate-50/30">
                        {i + 1}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-800 text-[14px]">{mhs.nama}</div>
                        <div className="text-xs text-slate-500 font-medium">{mhs.nim} • {mhs.program}</div>
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-center bg-emerald-50/20 tabular-nums font-semibold">
                        {data?.presensi ?? '-'}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-center bg-blue-50/20 tabular-nums font-semibold">
                        {data?.tugas ?? '-'}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-center bg-amber-50/20 tabular-nums font-semibold">
                        {data?.uts ?? '-'}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-center bg-indigo-50/20 tabular-nums font-semibold">
                        {data?.uas ?? '-'}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-center bg-slate-50 border-l border-slate-200">
                        <span className="font-bold text-slate-800 tabular-nums">{Number(total).toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-center bg-slate-50">
                        <button
                          onClick={() => handleEditClick(mhs, data)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                          title="Edit Nilai"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div className="p-12 text-center text-slate-500">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-lg font-medium text-slate-600">Pilih Mata Kuliah dan Kelas</p>
          <p className="text-sm mt-1">Gunakan dropdown di atas untuk melihat rekap nilai.</p>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingMhs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800">Edit Nilai Mahasantri</h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5">
              <div className="mb-4 pb-4 border-b border-slate-100">
                <div className="font-semibold text-slate-800">{editingMhs.nama}</div>
                <div className="text-sm text-slate-500">{editingMhs.nim}</div>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold tracking-wider text-emerald-700 mb-1.5 uppercase">Presensi (Maks: 10)</label>
                    <input
                      type="number"
                      min="0" max="10"
                      value={editData.presensi}
                      onChange={(e) => handleEditChange('presensi', e.target.value)}
                      className="block w-full rounded-md border-slate-300 bg-emerald-50/50 py-2 px-3 text-sm focus:border-emerald-500 focus:ring-emerald-500 shadow-sm font-medium tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold tracking-wider text-blue-700 mb-1.5 uppercase">Tugas (Maks: 20)</label>
                    <input
                      type="number"
                      min="0" max="20"
                      value={editData.tugas}
                      onChange={(e) => handleEditChange('tugas', e.target.value)}
                      className="block w-full rounded-md border-slate-300 bg-blue-50/50 py-2 px-3 text-sm focus:border-blue-500 focus:ring-blue-500 shadow-sm font-medium tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold tracking-wider text-amber-700 mb-1.5 uppercase">UTS (Maks: 30)</label>
                    <input
                      type="number"
                      min="0" max="30"
                      value={editData.uts}
                      onChange={(e) => handleEditChange('uts', e.target.value)}
                      className="block w-full rounded-md border-slate-300 bg-amber-50/50 py-2 px-3 text-sm focus:border-amber-500 focus:ring-amber-500 shadow-sm font-medium tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold tracking-wider text-indigo-700 mb-1.5 uppercase">UAS (Maks: 40)</label>
                    <input
                      type="number"
                      min="0" max="40"
                      value={editData.uas}
                      onChange={(e) => handleEditChange('uas', e.target.value)}
                      className="block w-full rounded-md border-slate-300 bg-indigo-50/50 py-2 px-3 text-sm focus:border-indigo-500 focus:ring-indigo-500 shadow-sm font-medium tabular-nums"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold tracking-wider text-slate-700 mb-1.5 uppercase">Tahun Akademik</label>
                    <input
                      type="text"
                      value={editData.tahunAkademik}
                      onChange={(e) => handleEditChange('tahunAkademik', e.target.value)}
                      placeholder="Misal: 2024"
                      className="block w-full rounded-md border-slate-300 bg-white py-2 px-3 text-sm focus:border-emerald-500 focus:ring-emerald-500 shadow-sm font-medium border"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold tracking-wider text-slate-700 mb-1.5 uppercase">Semester</label>
                    <select
                      value={editData.semester}
                      onChange={(e) => handleEditChange('semester', e.target.value)}
                      className="block w-full rounded-md border-slate-300 bg-white py-2 px-3 text-sm focus:border-emerald-500 focus:ring-emerald-500 shadow-sm font-medium border"
                    >
                      <option value="Ganjil">Ganjil</option>
                      <option value="Genap">Genap</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end p-5 border-t border-slate-100 bg-slate-50 gap-3">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                disabled={isSaving}
              >
                Batal
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-sm"
              >
                {isSaving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-800">Tambah Data Nilai Mahasantri</h3>
                <p className="text-sm text-slate-500 mt-1">{selectedProgram} • {selectedMK} • Kelas {selectedKelas}</p>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 border-b border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 bg-white">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tahun Akademik</label>
                <input
                  type="text"
                  value={addTahun}
                  onChange={(e) => setAddTahun(e.target.value)}
                  placeholder="Misal: 2024"
                  className="block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm pl-3 py-2 border"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Semester</label>
                <select
                  value={addSemester}
                  onChange={(e) => setAddSemester(e.target.value)}
                  className="block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm pl-3 pr-10 py-2 border"
                >
                  <option value="Ganjil">Ganjil</option>
                  <option value="Genap">Genap</option>
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-0">
              <table className="min-w-full divide-y divide-slate-200 relative">
                <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-[5%] bg-slate-100">No</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-[35%] bg-slate-100">Nama Mahasantri / NIM</th>
                    <th scope="col" className="px-2 py-3 text-center text-xs font-semibold text-emerald-700 uppercase tracking-wider bg-emerald-50 border-l border-emerald-100">Presensi<br/><span className="text-[10px] text-emerald-600 font-normal">(Maks. 10)</span></th>
                    <th scope="col" className="px-2 py-3 text-center text-xs font-semibold text-blue-700 uppercase tracking-wider bg-blue-50">Tugas<br/><span className="text-[10px] text-blue-600 font-normal">(Maks. 20)</span></th>
                    <th scope="col" className="px-2 py-3 text-center text-xs font-semibold text-amber-700 uppercase tracking-wider bg-amber-50">UTS<br/><span className="text-[10px] text-amber-600 font-normal">(Maks. 30)</span></th>
                    <th scope="col" className="px-2 py-3 text-center text-xs font-semibold text-indigo-700 uppercase tracking-wider bg-indigo-50">UAS<br/><span className="text-[10px] text-indigo-600 font-normal">(Maks. 40)</span></th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider bg-slate-100 border-l border-slate-200">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {activeMhsList.map((mhs, i) => {
                    const data = addInputData[mhs.id] || { presensi: '', tugas: '', uts: '', uas: '' };
                    const total = (parseFloat(data.presensi || '0') + parseFloat(data.tugas || '0') + parseFloat(data.uts || '0') + parseFloat(data.uas || '0')).toFixed(1);
                    return (
                      <tr key={mhs.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-2 whitespace-nowrap text-sm text-slate-500 font-medium bg-slate-50/30">{i + 1}</td>
                        <td className="px-6 py-2 whitespace-nowrap">
                          <div className="font-semibold text-slate-800 text-[13px]">{mhs.nama}</div>
                          <div className="text-[11px] text-slate-500">{mhs.nim}</div>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-center bg-emerald-50/20 border-l border-emerald-50">
                          <input type="number" min="0" max="10" value={data.presensi} onChange={(e) => handleAddInputChange(mhs.id, 'presensi', e.target.value)} className="w-16 mx-auto text-center font-medium rounded border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-xs py-1" placeholder="0" />
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-center bg-blue-50/20">
                          <input type="number" min="0" max="20" value={data.tugas} onChange={(e) => handleAddInputChange(mhs.id, 'tugas', e.target.value)} className="w-16 mx-auto text-center font-medium rounded border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-xs py-1" placeholder="0" />
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-center bg-amber-50/20">
                          <input type="number" min="0" max="30" value={data.uts} onChange={(e) => handleAddInputChange(mhs.id, 'uts', e.target.value)} className="w-16 mx-auto text-center font-medium rounded border-slate-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-xs py-1" placeholder="0" />
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-center bg-indigo-50/20">
                          <input type="number" min="0" max="40" value={data.uas} onChange={(e) => handleAddInputChange(mhs.id, 'uas', e.target.value)} className="w-16 mx-auto text-center font-medium rounded border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs py-1" placeholder="0" />
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-center bg-slate-50 border-l border-slate-200">
                          <span className="font-bold text-slate-800 text-sm tabular-nums">{total}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end p-5 border-t border-slate-100 bg-slate-50 gap-3">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                disabled={isSaving}
              >
                Batal
              </button>
              <button
                onClick={handleSaveAddBulk}
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-sm"
              >
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Simpan Semua Nilai</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
