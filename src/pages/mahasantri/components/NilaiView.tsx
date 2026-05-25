import { useState, useEffect } from 'react';
import { 
  Award, 
  ChevronRight, 
  Filter, 
  TrendingUp, 
  BookOpen, 
  HelpCircle,
  BarChart3,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../../services/api';

interface NilaiViewProps {
  gradeList: any[];
  courseList?: any[];
}

export default function NilaiView({ gradeList, courseList }: NilaiViewProps) {
  const [selectedSemester, setSelectedSemester] = useState('Genap');
  const [selectedYear, setSelectedYear] = useState('2025/2026');
  const [allMatakuliah, setAllMatakuliah] = useState<any[]>(courseList || []);

  // Generate dynamic, robust year options list starting from 2020/2021 as requested
  const academicYears = Array.from(new Set([
    ...gradeList.map(g => (g.tahun_akademik || '').toString().replace(/\s+/g, '').trim()).filter(Boolean),
    ...['2026/2027', '2025/2026', '2024/2025', '2023/2024', '2022/2023', '2021/2022', '2020/2021']
  ])).sort((a, b) => b.localeCompare(a));

  const semesters = ['Ganjil', 'Genap'];

  useEffect(() => {
    if (courseList && courseList.length > 0) {
      setAllMatakuliah(courseList);
    } else {
      api.get('getMatakuliah')
        .then((res: any) => {
          if (res && res.data) {
            setAllMatakuliah(res.data);
          }
        })
        .catch(err => console.error('Error fetching matakuliah list inside NilaiView', err));
    }
  }, [courseList]);

  // Automatically select the latest available academic year and semester with grades when gradeList loads
  useEffect(() => {
    if (gradeList && gradeList.length > 0) {
      const sortedByYear = [...gradeList].sort((a, b) => {
        const yearA = (a.tahun_akademik || '').toString().replace(/\s+/g, '').trim();
        const yearB = (b.tahun_akademik || '').toString().replace(/\s+/g, '').trim();
        return yearB.localeCompare(yearA);
      });
      const latest = sortedByYear[0];
      if (latest.tahun_akademik) {
        setSelectedYear(latest.tahun_akademik.toString().replace(/\s+/g, '').trim());
      }
      if (latest.semester) {
        const sem = latest.semester.toString().trim();
        const capitalizedSem = sem.charAt(0).toUpperCase() + sem.slice(1).toLowerCase();
        if (capitalizedSem === 'Ganjil' || capitalizedSem === 'Genap') {
          setSelectedSemester(capitalizedSem);
        } else {
          setSelectedSemester(sem);
        }
      }
    }
  }, [gradeList]);

  // Filter the grades from database strictly by academic year and semester (robust comparison with space normalization)
  const currentGrades = gradeList.filter(g => {
    const valSemester = (g.semester || 'Genap').toString().toLowerCase().trim();
    const valYear = (g.tahun_akademik || '2025/2026').toString().toLowerCase().replace(/\s+/g, '').trim();
    return valSemester === selectedSemester.toLowerCase().trim() && 
           valYear === selectedYear.toLowerCase().replace(/\s+/g, '').trim();
  });

  // Calculators
  const parseIndoNumber = (val: any, fallback = 0): number => {
    if (val === undefined || val === null || val === '') return fallback;
    const str = val.toString().replace(',', '.').trim();
    const parsed = Number(str);
    return isNaN(parsed) ? fallback : parsed;
  };

  const formatDecimal = (num: number): string => {
    return (Math.round((num + Number.EPSILON) * 100) / 100).toFixed(2);
  };

  const getPredikat = (total: number, explicitHuruf?: string) => {
    const h = (explicitHuruf || '').toString().trim().toUpperCase();
    if (h) {
      if (h === 'A+' || h === 'A' || h === 'A-') return { text: h, label: 'Mumtaz (Istimewa)', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
      if (h === 'B+' || h === 'B' || h === 'B-') return { text: h, label: 'Jayyid Jiddan (Sangat Baik)', color: 'text-blue-700 bg-blue-50 border-blue-200' };
      if (h === 'C+' || h === 'C' || h === 'C-') return { text: h, label: 'Jayyid (Baik)', color: 'text-amber-700 bg-amber-50 border-amber-200' };
      if (h === 'D') return { text: h, label: 'Maqbul (Cukup)', color: 'text-orange-700 bg-orange-50 border-orange-200' };
      return { text: h, label: 'Rasib (Gagal)', color: 'text-rose-700 bg-rose-50 border-rose-200' };
    }
    if (total >= 85) return { text: 'A', label: 'Mumtaz (Istimewa)', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (total >= 75) return { text: 'B', label: 'Jayyid Jiddan (Sangat Baik)', color: 'text-blue-700 bg-blue-50 border-blue-200' };
    if (total >= 65) return { text: 'C', label: 'Jayyid (Baik)', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    if (total >= 50) return { text: 'D', label: 'Maqbul (Cukup)', color: 'text-orange-700 bg-orange-50 border-orange-200' };
    return { text: 'E', label: 'Rasib (Gagal)', color: 'text-rose-700 bg-rose-50 border-rose-200' };
  };

  const parseYearNum = (y: string): number => {
    const cleaned = (y || '').toString().replace(/\s+/g, '').trim();
    const parts = cleaned.split('/');
    if (parts.length > 0) {
      const num = parseInt(parts[0], 10);
      if (!isNaN(num)) return num;
    }
    return 0;
  };

  const getSemesterScore = (yearStr: string, semStr: string): number => {
    const yearNum = parseYearNum(yearStr);
    const semLower = (semStr || 'Genap').toString().toLowerCase().trim();
    const semOffset = semLower === 'ganjil' ? 1 : 2;
    return yearNum * 10 + semOffset;
  };

  const findField = (obj: any, keysToSearch: string[]): any => {
    if (!obj) return undefined;
    for (const k of keysToSearch) {
      if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') {
        return obj[k];
      }
    }
    const objKeys = Object.keys(obj);
    for (const k of keysToSearch) {
      const normSearch = k.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!normSearch) continue;
      for (const ok of objKeys) {
        const normKey = ok.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (normKey === normSearch || normKey.includes(normSearch) || normSearch.includes(normKey)) {
          if (obj[ok] !== undefined && obj[ok] !== null && obj[ok] !== '') {
            return obj[ok];
          }
        }
      }
    }
    return undefined;
  };

  const getGradeInfo = (g: any) => {
    const normalizedGName = (g.nama_mk || '').toString().trim().toLowerCase();
    const matched = allMatakuliah.find(m => 
      (m.nama_mk || m.nama || '').toString().trim().toLowerCase() === normalizedGName
    );

    const kode_mk = (g.kode || g.kode_mk || '').toString().trim() || matched?.kode || `MK-${(g.nama_mk || 'XXX').slice(0, 3).toUpperCase()}`;
    const sks = parseIndoNumber(g.sks) || parseIndoNumber(matched?.sks) || 3;
    
    const numericAngka = parseIndoNumber(g.total) || (parseIndoNumber(g.presensi) + parseIndoNumber(g.tugas) + parseIndoNumber(g.uts) + parseIndoNumber(g.uas));
    const angka = formatDecimal(numericAngka);

    const dbHuruf = findField(g, ['hm', 'huruf', 'grade', 'hurufmutu', 'nilaihuruf']);
    let huruf = dbHuruf !== undefined ? dbHuruf.toString().trim().toUpperCase() : '';
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
    const dbBobot = findField(g, ['am', 'bobot', 'konversi', 'bobotnilai', 'bobotmutu', 'angkamutu']);
    if (dbBobot !== undefined) {
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

    const konversi = bobot;

    return {
      kode_mk,
      sks,
      angka,
      huruf,
      konversi,
      bobot
    };
  };

  // IPS (Indeks Prestasi Semester) calculation using dynamic values
  let totalSKS = 0;
  let totalPoints = 0;

  currentGrades.forEach(g => {
    const info = getGradeInfo(g);
    totalSKS += info.sks;
    totalPoints += (info.bobot * info.sks);
  });

  const calculatedIPS = totalSKS > 0 ? formatDecimal(totalPoints / totalSKS) : '0.00';

  // IPK (Indeks Prestasi Kumulatif) and cumulative SKS calculation (from semester 1 up to the filtered semester)
  const selectedSemesterScore = getSemesterScore(selectedYear, selectedSemester);
  let cumulativeSKS = 0;
  let cumulativePoints = 0;

  gradeList.forEach(g => {
    const info = getGradeInfo(g);
    const score = getSemesterScore(g.tahun_akademik, g.semester);
    if (score <= selectedSemesterScore) {
      cumulativeSKS += info.sks;
      cumulativePoints += (info.bobot * info.sks);
    }
  });

  const ipkValue = cumulativeSKS > 0 ? formatDecimal(cumulativePoints / cumulativeSKS) : '0.00';

  // Comments / Notes mock
  const getGradeComment = (mk: string, total: number) => {
    if (total >= 85) return 'Mumtaz! Penguasaan kaidah dhomir & pemahaman syarah sangat istimewa. Pertahankan.';
    if (total >= 75) return 'Sangat baik. Murojaah mandiri perlu ditingkatkan khususnya dalam ketelitian i\'rob.';
    return 'Cukup. Harap rajin berkonsultasi dengan ustadz pengampu untuk memperdalam materi kitab.';
  };

  return (
    <div className="space-y-6">

      {/* Filter and Top Overview Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-805">Monitoring Perkembangan Nilai Akademik</h2>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Pantau rekapitulasi poin akumulatif, indeks prestasi semester (IPS), serta catatan evaluasi dewan ustadz.</p>
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-2">
          <select 
            value={selectedSemester} 
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="bg-slate-50 border border-slate-250 rounded-xl px-3 py-1.5 text-xs text-slate-650 font-bold focus:outline-none cursor-pointer"
          >
            {semesters.map(sem => (
              <option key={sem} value={sem}>Semester {sem}</option>
            ))}
          </select>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-slate-50 border border-slate-250 rounded-xl px-3 py-1.5 text-xs text-slate-650 font-bold focus:outline-none cursor-pointer"
          >
            {academicYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats row: IPS, IPK, Total SKS Counter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Card IP Semester */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 block shadow-inner">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Indeks Prestasi Semester (IPS)</p>
            <p className="text-2xl font-black text-slate-805 mt-1.5 leading-none">{calculatedIPS}</p>
          </div>
        </div>

        {/* Card Cumulative IPK */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600 block shadow-inner">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">IP Kumulatif (IPK)</p>
            <p className="text-2xl font-black text-slate-805 mt-1.5 leading-none">{ipkValue}</p>
          </div>
        </div>

        {/* Card Total SKS */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-700 block shadow-inner">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Total SKS Kumulatif</p>
            <p className="text-2xl font-black text-slate-805 mt-1.5 leading-none">{cumulativeSKS} SKS</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Visual Graphic & Detailed Transcript Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Visual Score Compare graphic bar chart using clean custom SVG to avoid package issues */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-805 text-sm flex items-center gap-1.5">
              <BarChart3 className="w-4.5 h-4.5 text-emerald-600" />
              Perbandingan Skor Akhir Kuliah
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Gambaran komparatif nilai mata kuliah semester berjalan.</p>
          </div>

          {/* SVG Bar Chart */}
          <div className="pt-3 space-y-3.5">
            {currentGrades.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs italic">
                Belum ada visualisasi nilai.
              </div>
            ) : (
              currentGrades.map((g, idx) => {
                const numericAngka = parseIndoNumber(g.total) || (parseIndoNumber(g.presensi) + parseIndoNumber(g.tugas) + parseIndoNumber(g.uts) + parseIndoNumber(g.uas));
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-slate-700 truncate max-w-[150px]">{g.nama_mk}</span>
                      <span className="font-mono text-slate-800 font-bold">{formatDecimal(numericAngka)} / 100</span>
                    </div>
                    {/* Visual bar tracker */}
                    <div className="h-4 bg-slate-100 rounded-lg overflow-hidden flex items-stretch">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-lg transition-all"
                        style={{ width: `${numericAngka}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Transcript Details Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-805 text-sm">Lembar Hasil Studi</h3>
            <p className="text-[11px] text-slate-400 mt-1">Lembar hasil studi nilai mata kuliah semester berjalan.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-150 border border-slate-150 rounded-lg overflow-hidden">
              <thead className="bg-slate-50 text-slate-550 border-b border-slate-200">
                <tr className="divide-x divide-slate-200">
                  <th rowSpan={2} scope="col" className="px-3 py-2 text-center text-[10px] font-black text-slate-500 uppercase tracking-wider align-middle">No</th>
                  <th rowSpan={2} scope="col" className="px-4 py-2 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider align-middle">Kode Mata Kuliah</th>
                  <th rowSpan={2} scope="col" className="px-4 py-2 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider align-middle">Nama Mata Kuliah</th>
                  <th rowSpan={2} scope="col" className="px-3 py-2 text-center text-[10px] font-black text-slate-500 uppercase tracking-wider align-middle">SKS</th>
                  <th colSpan={2} scope="col" className="px-3 py-1.5 text-center text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200">Nilai</th>
                  <th rowSpan={2} scope="col" className="px-4 py-2 text-center text-[10px] font-black text-slate-500 uppercase tracking-wider align-middle">Konversi Nilai</th>
                </tr>
                <tr className="divide-x divide-slate-200">
                  <th scope="col" className="px-3 py-1 text-center text-[9px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-100/50">Angka</th>
                  <th scope="col" className="px-3 py-1 text-center text-[9px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-100/50">Huruf</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 divide-x divide-slate-200/50">
                {currentGrades.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-xs text-slate-400 font-medium">
                      Belum ada transkrip nilai untuk semester dan tahun akademik terpilih.
                    </td>
                  </tr>
                ) : (
                  currentGrades.map((g, i) => {
                    const info = getGradeInfo(g);
                    return (
                      <tr 
                        key={g.id || i}
                        className="hover:bg-slate-50/50 transition-colors divide-x divide-slate-200/40"
                      >
                        <td className="px-3 py-3 text-center whitespace-nowrap text-xs text-slate-400 font-mono font-bold bg-slate-50/10">{i + 1}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs font-semibold text-slate-600 font-mono">{info.kode_mk}</td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-800 text-left">{g.nama_mk}</td>
                        <td className="px-3 py-3 text-center whitespace-nowrap text-xs font-semibold text-slate-600 font-mono">{info.sks}</td>
                        <td className="px-3 py-3 text-center whitespace-nowrap text-xs font-semibold text-slate-800 font-mono bg-slate-50/20">{info.angka}</td>
                        <td className="px-3 py-3 text-center whitespace-nowrap text-xs font-extrabold text-slate-700 font-mono">{info.huruf}</td>
                        <td className="px-4 py-3 text-center whitespace-nowrap text-xs font-bold text-emerald-700 font-mono">
                          {formatDecimal(info.konversi).replace('.', ',')}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>



    </div>
  );
}
