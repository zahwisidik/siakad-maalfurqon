import { useState } from 'react';
import { 
  Award, 
  BookOpen, 
  Printer, 
  FileSpreadsheet, 
  GraduationCap, 
  FolderOpen,
  ClipboardList
} from 'lucide-react';

interface TranskripViewProps {
  gradeList: any[];
  courseList?: any[];
  user?: any;
}

export default function TranskripView({ gradeList = [], courseList = [], user }: TranskripViewProps) {
  const [filterSemester, setFilterSemester] = useState<string>('Semua');

  // Convert/parse numeric weights safely
  const parseIndoNumber = (val: any, fallback = 0): number => {
    if (val === undefined || val === null || val === '') return fallback;
    const str = val.toString().replace(',', '.').trim();
    const parsed = Number(str);
    return isNaN(parsed) ? fallback : parsed;
  };

  const formatDecimal = (num: number): string => {
    return (Math.round((num + Number.EPSILON) * 100) / 100).toFixed(2);
  };

  // Extract academic year and semester ordering key for sorting
  const parseYearNum = (y: string): number => {
    const cleaned = (y || '').toString().replace(/\s+/g, '').trim();
    const parts = cleaned.split('/');
    if (parts.length > 0) {
      const num = parseInt(parts[0], 10);
      if (!isNaN(num)) return num;
    }
    return 0;
  };

  const getSemesterOrderValue = (yearStr: string, semStr: string): number => {
    const yearNum = parseYearNum(yearStr);
    const semLower = (semStr || 'Ganjil').toString().toLowerCase().trim();
    const semOffset = semLower === 'ganjil' ? 1 : 2;
    return yearNum * 10 + semOffset;
  };

  // Map each individual grade record to descriptive metadata
  const getGradeInfo = (g: any) => {
    const normalizedGName = (g.nama_mk || '').toString().trim().toLowerCase();
    const matched = courseList.find(m => 
      (m.nama_mk || m.nama || '').toString().trim().toLowerCase() === normalizedGName
    );

    const kode_mk = (g.kode || g.kode_mk || '').toString().trim() || matched?.kode || `MK-${(g.nama_mk || 'XXX').slice(0, 3).toUpperCase()}`;
    const sks = parseIndoNumber(g.sks) || parseIndoNumber(matched?.sks) || 3;
    
    const numericAngka = parseIndoNumber(g.total) || (parseIndoNumber(g.presensi) + parseIndoNumber(g.tugas) + parseIndoNumber(g.uts) + parseIndoNumber(g.uas));
    const angka = formatDecimal(numericAngka);

    // Grab literal grade letter from database if available, otherwise calculate it
    let huruf = (g.hm || g.huruf || g.grade || g.hurufmutu || '').toString().trim().toUpperCase();
    if (!huruf) {
      if (numericAngka >= 95) huruf = 'A+';
      else if (numericAngka >= 90) huruf = 'A';
      else if (numericAngka >= 85) huruf = 'B+';
      else if (numericAngka >= 80) huruf = 'B';
      else if (numericAngka >= 75) huruf = 'C+';
      else if (numericAngka >= 70) huruf = 'C';
      else if (numericAngka >= 60) huruf = 'D';
      else huruf = 'E';
    }

    let bobot = 0.0;
    const dbBobot = g.am || g.bobot || g.konversi || g.bobotnilai || g.bobotmutu || g.angkamutu;
    if (dbBobot !== undefined && dbBobot !== null && dbBobot !== '') {
      bobot = parseIndoNumber(dbBobot);
    } else {
      const h = huruf.trim().toUpperCase();
      if (h === 'A+' || h === 'A') bobot = 4.0;
      else if (h === 'A-') bobot = 3.7;
      else if (h === 'B+') bobot = 3.5;
      else if (h === 'B') bobot = 3.0;
      else if (h === 'B-') bobot = 2.7;
      else if (h === 'C+') bobot = 2.5;
      else if (h === 'C') bobot = 2.0;
      else if (h === 'D') bobot = 1.0;
      else if (h === 'E') bobot = 0.0;
      else {
        if (numericAngka >= 95) bobot = 4.0;
        else if (numericAngka >= 90) bobot = 4.0;
        else if (numericAngka >= 85) bobot = 3.5;
        else if (numericAngka >= 80) bobot = 3.0;
        else if (numericAngka >= 75) bobot = 2.5;
        else if (numericAngka >= 70) bobot = 2.0;
        else if (numericAngka >= 60) bobot = 1.0;
        else bobot = 0.0;
      }
    }

    const nilaiMutu = bobot * sks;

    return {
      kode_mk,
      sks,
      angka,
      huruf,
      bobot,
      nilaiMutu
    };
  };

  // Compile and sort all records chronologically
  const sortedGrades = [...gradeList]
    .map(g => ({
      ...g,
      _order: getSemesterOrderValue(g.tahun_akademik || '2025/2026', g.semester || 'Ganjil'),
      _info: getGradeInfo(g)
    }))
    .sort((a, b) => a._order - b._order);

  // List of unique semester + year names for filter
  const semesterFilters = Array.from(new Set(
    gradeList.map(g => `${g.semester || 'Ganjil'} - ${g.tahun_akademik || '2025/2026'}`)
  )).sort();

  // Filter compile
  const displayedGrades = filterSemester === 'Semua' 
    ? sortedGrades 
    : sortedGrades.filter(g => `${g.semester} - ${g.tahun_akademik}` === filterSemester);

  // Totals calculations based on ALL grades (cumulative)
  let cumulativeSKS = 0;
  let cumulativeMutu = 0;

  sortedGrades.forEach(g => {
    cumulativeSKS += g._info.sks;
    cumulativeMutu += g._info.nilaiMutu;
  });

  const cumulativeIPK = cumulativeSKS > 0 ? formatDecimal(cumulativeMutu / cumulativeSKS) : '0.00';

  // Current page display count totals
  let pageSKS = 0;
  let pageMutu = 0;
  displayedGrades.forEach(g => {
    pageSKS += g._info.sks;
    pageMutu += g._info.nilaiMutu;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Upper Navigation and Print Toolbar (Hidden on standard print mode via tailoring classes) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-base font-bold text-slate-850 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-600" />
            Transkrip Nilai Akademik Kumulatif
          </h2>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">
            Halaman ini memuat laporan terpadu seluruh mata kuliah yang telah diselesaikan sejak Semester 1 hingga akhir masa kuliah aktif Anda.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600">
            <span className="text-slate-400 text-[10px] uppercase font-bold">Filter:</span>
            <select
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
              className="bg-transparent border-none focus:outline-none focus:ring-0 font-bold text-slate-700 cursor-pointer text-xs"
            >
              <option value="Semua">Semua Semester (Kumulatif)</option>
              {semesterFilters.map(sf => (
                <option key={sf} value={sf}>{sf}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            Cetak Transkrip
          </button>
        </div>
      </div>

      {/* Main Print Container Sheet */}
      <div className="bg-white rounded-3xl border border-slate-250 p-6 md:p-10 shadow-sm relative overflow-hidden print:border-none print:shadow-none print:p-0">
        
        {/* Elegant top watermarks or decor (hidden on print for professional style) */}
        <div className="absolute right-0 top-0 w-44 h-44 bg-emerald-500/5 rounded-full blur-2xl -mr-16 -mt-16 print:hidden"></div>
        <div className="absolute left-0 bottom-0 w-36 h-36 bg-blue-500/5 rounded-full blur-2xl -ml-16 -mb-16 print:hidden"></div>

        {/* Academic Letter Head for Print */}
        <div className="border-b-4 border-slate-800 pb-5 mb-6 text-center">
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight uppercase">
            TRANSKRIP NILAI AKADEMIK
          </h1>
          <div className="w-16 h-1 bg-emerald-650 mx-auto mt-2 rounded"></div>
        </div>

        {/* Identity Details Block */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium text-slate-700 mb-8 border border-slate-150 p-4 rounded-2xl bg-slate-50/50 print:bg-white print:border-slate-300">
          <div className="space-y-2">
            <div className="flex">
              <span className="w-28 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Nama Lengkap</span>
              <span className="font-bold text-slate-900">: {user?.nama || '-'}</span>
            </div>
            <div className="flex">
              <span className="w-28 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">NIM</span>
              <span className="font-mono font-bold text-slate-900">: {user?.nim || '-'}</span>
            </div>
            <div className="flex">
              <span className="w-28 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Program Studi</span>
              <span className="font-bold text-slate-800">: {user?.program || '-'}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex">
              <span className="w-28 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Tahun Masuk</span>
              <span className="font-mono font-bold text-slate-850">: {user?.tahun_masuk || '-'}</span>
            </div>
            <div className="flex">
              <span className="w-28 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Status Kuliah</span>
              <span className="font-bold text-emerald-700 uppercase tracking-widest text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 print:border-none print:p-0">
                : {user?.status || 'Aktif'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Summary Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-emerald-50/80 border border-emerald-200/50 p-4 rounded-2xl text-center print:bg-white print:border-slate-300">
            <p className="text-[9px] font-black text-emerald-800 tracking-wider uppercase leading-none">Indeks Prestasi Kumulatif (IPK)</p>
            <p className="text-3xl font-black text-emerald-700 mt-2 leading-none">{cumulativeIPK}</p>
          </div>
          <div className="bg-blue-50/80 border border-blue-200/50 p-4 rounded-2xl text-center print:bg-white print:border-slate-300">
            <p className="text-[9px] font-black text-blue-800 tracking-wider uppercase leading-none">Total SKS Terselesaikan</p>
            <p className="text-3xl font-black text-blue-700 mt-2 leading-none">{cumulativeSKS} SKS</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-center print:bg-white print:border-slate-300">
            <p className="text-[9px] font-black text-slate-500 tracking-wider uppercase leading-none">Mata Kuliah Terdaftar</p>
            <p className="text-3xl font-black text-slate-800 mt-2 leading-none">{sortedGrades.length}</p>
          </div>
        </div>

        {/* Chronological Grades Sheet Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-300 border border-slate-300 rounded-2xl overflow-hidden">
            <thead className="bg-slate-100/80 text-slate-700 print:bg-slate-50">
              <tr className="divide-x divide-slate-200 border-b border-slate-300">
                <th scope="col" className="px-3 py-2.5 text-center text-[10px] font-black uppercase tracking-wider w-12">No</th>
                <th scope="col" className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-wider w-36">Semester / TA</th>
                <th scope="col" className="px-3 py-2.5 text-left text-[10px] font-black uppercase tracking-wider w-24">Kode</th>
                <th scope="col" className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-wider">Mata Kuliah</th>
                <th scope="col" className="px-3 py-2.5 text-center text-[10px] font-black uppercase tracking-wider w-16">SKS</th>
                <th scope="col" className="px-3 py-2.5 text-center text-[10px] font-black uppercase tracking-wider w-20">Nilai Huruf</th>
                <th scope="col" className="px-3 py-2.5 text-center text-[10px] font-black uppercase tracking-wider w-20 border-r-0">Nilai Mutu (K x S)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs font-semibold text-slate-700">
              {displayedGrades.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400 italic font-medium">
                    Belum ditemukan data nilai transkrip untuk saat ini.
                  </td>
                </tr>
              ) : (
                displayedGrades.map((g, index) => {
                  return (
                    <tr key={g.id || index} className="divide-x divide-slate-200 hover:bg-slate-50/50 print:bg-white transition-colors">
                      <td className="px-3 py-3 text-center text-slate-400 font-mono">{index + 1}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600 uppercase text-[10px]">
                        Sem. {g.semester} <span className="block text-[9px] text-slate-400 lowercase italic font-medium">{g.tahun_akademik}</span>
                      </td>
                      <td className="px-3 py-3 font-mono text-slate-500 font-bold text-[11px]">{g._info.kode_mk}</td>
                      <td className="px-4 py-3 text-slate-900 text-left font-bold">{g.nama_mk}</td>
                      <td className="px-3 py-3 text-center font-mono">{g._info.sks}</td>
                      <td className="px-3 py-3 text-center font-mono font-black text-slate-800">
                        {g._info.huruf} <span className="text-[10px] text-slate-400 font-normal">({formatDecimal(g._info.bobot)})</span>
                      </td>
                      <td className="px-3 py-3 text-center font-mono font-bold text-slate-900 bg-slate-50/30 print:bg-white border-r-0">
                        {formatDecimal(g._info.nilaiMutu)}
                      </td>
                    </tr>
                  );
                })
              )}

              {/* Table Footer Summary block */}
              {displayedGrades.length > 0 && (
                <tr className="bg-slate-100/50 print:bg-slate-50 font-black border-t-2 border-slate-350 divide-x divide-slate-200">
                  <td colSpan={4} className="px-4 py-3 text-right uppercase tracking-wider text-[10px] text-slate-600 align-middle">
                    {filterSemester === 'Semua' ? 'Jumlah Kumulatif :' : 'Jumlah Semester Dipilih :'}
                  </td>
                  <td className="px-3 py-3 text-center font-bold font-mono text-[13px] text-slate-800 bg-slate-100">{displayedGrades === sortedGrades ? cumulativeSKS : pageSKS}</td>
                  <td className="px-3 py-3 text-center text-[10px] text-slate-400 italic"></td>
                  <td className="px-3 py-3 text-center font-bold font-mono text-[13px] text-emerald-800 bg-emerald-500/5 print:bg-slate-50 border-r-0">
                    {formatDecimal(filterSemester === 'Semua' ? cumulativeMutu : pageMutu)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>


      </div>

    </div>
  );
}
