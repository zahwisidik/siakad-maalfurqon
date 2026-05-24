import { useState } from 'react';
import { 
  Award, 
  ChevronRight, 
  Filter, 
  TrendingUp, 
  BookOpen, 
  CheckCircle2, 
  HelpCircle,
  BarChart3,
  X,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

interface NilaiViewProps {
  gradeList: any[];
}

export default function NilaiView({ gradeList }: NilaiViewProps) {
  const [selectedSemester, setSelectedSemester] = useState('Genap');
  const [selectedYear, setSelectedYear] = useState('2025/2026');
  const [selectedGrade, setSelectedGrade] = useState<any | null>(null);

  // Filter the grades from database strictly by academic year and semester
  const currentGrades = gradeList.filter(g => 
    (g.semester || 'Genap').toString().toLowerCase().trim() === selectedSemester.toLowerCase().trim() && 
    (g.tahun_akademik || '2025/2026').toString().trim() === selectedYear.trim()
  );

  // Calculators
  const getPredikat = (total: number) => {
    if (total >= 85) return { text: 'A', label: 'Mumtaz (Istimewa)', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (total >= 75) return { text: 'B', label: 'Jayyid Jiddan (Sangat Baik)', color: 'text-blue-700 bg-blue-50 border-blue-200' };
    if (total >= 65) return { text: 'C', label: 'Jayyid (Baik)', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    if (total >= 50) return { text: 'D', label: 'Maqbul (Cukup)', color: 'text-orange-700 bg-orange-50 border-orange-200' };
    return { text: 'E', label: 'Rasib (Gagal)', color: 'text-rose-700 bg-rose-50 border-rose-200' };
  };

  const getWeight = (textGrade: string) => {
    switch (textGrade) {
      case 'A': return 4.0;
      case 'B': return 3.0;
      case 'C': return 2.0;
      case 'D': return 1.0;
      default: return 0.0;
    }
  };

  // IPS (Indeks Prestasi Semester) calculation
  const totalSKS = currentGrades.length * 3; // Mock approx 3 SKS each
  const totalPoints = currentGrades.reduce((sum, g) => {
    const p = getPredikat(g.total || 0);
    return sum + (getWeight(p.text) * 3); // weight * SKS
  }, 0);
  const calculatedIPS = totalSKS > 0 ? (totalPoints / totalSKS).toFixed(2) : '0.00';

  // IPK (Indeks Prestasi Kumulatif) - cumulative mock-stable
  const ipkValue = (parseFloat(calculatedIPS) * 0.98).toFixed(2);

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
            <option value="Genap">Semester Genap</option>
            <option value="Ganjil">Semester Ganjil</option>
          </select>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-slate-50 border border-slate-250 rounded-xl px-3 py-1.5 text-xs text-slate-650 font-bold focus:outline-none cursor-pointer"
          >
            <option value="2025/2026">2025/2026</option>
            <option value="2024/2025">2024/2025</option>
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
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Total SKS Terhitung</p>
            <p className="text-2xl font-black text-slate-805 mt-1.5 leading-none">{totalSKS} SKS</p>
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
              currentGrades.map((g, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-slate-700 truncate max-w-[150px]">{g.nama_mk}</span>
                    <span className="font-mono text-slate-800 font-bold">{g.total || 0} / 100</span>
                  </div>
                  {/* Visual bar tracker */}
                  <div className="h-4 bg-slate-100 rounded-lg overflow-hidden flex items-stretch">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-lg transition-all"
                      style={{ width: `${g.total || 0}%` }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Transcript Details Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-805 text-sm">Transkrip Nilai Semester Resmi</h3>
            <p className="text-[11px] text-slate-400 mt-1">Klik pada baris pelajaran untuk melihat struktur rincian penilaian & rekomendasi dosen.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-150">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">No</th>
                  <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mata Kuliah</th>
                  <th scope="col" className="px-3 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">Presensi</th>
                  <th scope="col" className="px-3 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tugas</th>
                  <th scope="col" className="px-3 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">UTS</th>
                  <th scope="col" className="px-3 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">UAS</th>
                  <th scope="col" className="px-4 py-3 text-center text-[10px] font-bold text-slate-500 bg-slate-100/50 uppercase tracking-wider border-l border-slate-200">Total</th>
                  <th scope="col" className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentGrades.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-xs text-slate-400 font-medium">
                      Belum ada transkrip nilai untuk semester dan tahun akademik terpilih.
                    </td>
                  </tr>
                ) : (
                  currentGrades.map((g, i) => {
                    const p = getPredikat(g.total || 0);
                    return (
                      <tr 
                        key={g.id || i}
                        className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                        onClick={() => setSelectedGrade(g)}
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-400 font-mono font-bold">{i + 1}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs font-bold text-slate-800">{g.nama_mk}</td>
                        <td className="px-3 py-3 text-center text-xs font-semibold text-emerald-700 font-mono">{g.presensi || 0}</td>
                        <td className="px-3 py-3 text-center text-xs font-semibold text-sky-700 font-mono">{g.tugas || 0}</td>
                        <td className="px-3 py-3 text-center text-xs font-semibold text-amber-700 font-mono">{g.uts || 0}</td>
                        <td className="px-3 py-3 text-center text-xs font-semibold text-indigo-700 font-mono">{g.uas || 0}</td>
                        <td className="px-4 py-3 text-center text-sm font-black text-slate-850 bg-slate-100/30 border-l border-slate-200/50">{g.total || 0}</td>
                        <td className="px-4 py-3 text-center whitespace-nowrap text-xs">
                          <span className={`px-2 py-0.5 rounded font-extrabold uppercase text-[10px] border ${p.color}`}>
                            {p.text}
                          </span>
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

      {/* Detail Grading Modal */}
      <AnimatePresence>
        {selectedGrade && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-5 border-b border-slate-150 flex justify-between items-center bg-slate-50">
                <span className="font-bold text-xs text-slate-800">Komponen Penilaian Nilai Akhir</span>
                <button 
                  onClick={() => setSelectedGrade(null)}
                  className="p-1 rounded-lg hover:bg-slate-205 text-slate-400 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">NAMA MATA KULIAH</span>
                  <p className="text-sm font-black text-slate-850 mt-1 leading-tight">{selectedGrade.nama_mk}</p>
                </div>

                {/* Score Summary Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-55 border border-slate-150 rounded-xl">
                    <span className="text-slate-450 font-bold block text-[10px]">PREDIKAT HURUF</span>
                    <span className="text-base font-black text-emerald-700 mt-1 block uppercase">{getPredikat(selectedGrade.total || 0).text}</span>
                  </div>
                  <div className="p-3 bg-slate-55 border border-slate-150 rounded-xl">
                    <span className="text-slate-455 font-bold block text-[10px]">STATUS EVALUASI</span>
                    <span className="text-xs font-bold text-slate-700 mt-1 block flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 inline shrink-0" />
                      {selectedGrade.total >= 50 ? 'Lulus' : 'Munaqosyah'}
                    </span>
                  </div>
                </div>

                {/* Weights details breakdown */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-[10px] text-slate-450 font-bold block uppercase tracking-wider">Aspek Bobot & Pencapaian</span>
                  <div className="space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Presensi (Maks 10)</span>
                      <span className="text-slate-805 font-bold">{selectedGrade.presensi || 0} Poin</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tugas (Maks 20)</span>
                      <span className="text-slate-805 font-bold">{selectedGrade.tugas || 0} Poin</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">UTS (Maks 30)</span>
                      <span className="text-slate-805 font-bold">{selectedGrade.uts || 0} Poin</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">UAS (Maks 40)</span>
                      <span className="text-slate-805 font-bold">{selectedGrade.uas || 0} Poin</span>
                    </div>
                  </div>
                </div>

                {/* Feedback or Dosen Recommendations */}
                <div className="space-y-1.5 pt-3 border-t border-slate-100">
                  <span className="text-[10px] text-slate-450 font-bold block uppercase tracking-wider">Catatan & Komentar Dosen</span>
                  <blockquote className="p-2.5 bg-indigo-50/10 border-l-4 border-indigo-500 text-slate-650 leading-relaxed font-sans text-[11px] rounded-r-lg">
                    "{getGradeComment(selectedGrade.nama_mk, selectedGrade.total || 0)}"
                  </blockquote>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
