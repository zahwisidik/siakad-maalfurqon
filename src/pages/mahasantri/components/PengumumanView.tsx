import { useState } from 'react';
import { 
  Megaphone, 
  Search, 
  Calendar, 
  BookOpen, 
  FileCheck, 
  MapPin, 
  Home, 
  Coins, 
  MessageSquare,
  ChevronRight,
  Pin,
  CheckCircle2,
  X,
  Download,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

interface PengumumanViewProps {
  announcements: any[];
  onMarkAsRead: (id: string) => void;
  readList: string[];
}

export default function PengumumanView({ 
  announcements, 
  onMarkAsRead, 
  readList 
}: PengumumanViewProps) {
  const [activeCategory, setActiveCategory] = useState<'Semua' | 'Akademik' | 'Ujian' | 'Asrama' | 'Administrasi' | 'Umum'>('Semua');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any | null>(null);

  const categories = [
    { name: 'Semua', label: 'Semua', icon: Megaphone, color: 'text-slate-600 bg-slate-50 border-slate-200' },
    { name: 'Akademik', label: 'Akademik', icon: BookOpen, color: 'text-blue-700 bg-blue-50 border-blue-200' },
    { name: 'Ujian', label: 'Ujian', icon: FileCheck, color: 'text-rose-700 bg-rose-50 border-rose-200' },
    { name: 'Asrama', label: 'Asrama', icon: Home, color: 'text-amber-705 bg-amber-50 border-amber-200' },
    { name: 'Administrasi', label: 'Admin', icon: Coins, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
    { name: 'Umum', label: 'Umum', icon: MessageSquare, color: 'text-teal-700 bg-teal-50 border-teal-200' }
  ];

  // Filters
  const filteredList = announcements.filter((ann) => {
    // category filter
    if (activeCategory !== 'Semua' && ann.kategori !== activeCategory) return false;

    // text search
    if (searchTerm) {
      const matchTitle = ann.judul?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchBody = ann.isi_lengkap?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchTitle || matchBody;
    }

    return true;
  });

  const handleOpenAnnouncement = (ann: any) => {
    setSelectedAnnouncement(ann);
    onMarkAsRead(ann.id);
  };

  const downloadAttachment = (judul: string) => {
    toast.success(`Mengunduh file lampiran pengumuman: "${judul}"...`, { icon: '🗎' });
  };

  return (
    <div className="space-y-6">

      {/* Header and Search Controller */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-805">Pusat Pengumuman & Informasi Ma’had Aly</h2>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Pengumuman resmi harian, jadwal kepatuhan asrama santri, administrasi keuangan, serta agenda ujian terpadu.</p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72 shrink-0">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari pengumuman..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
          />
        </div>
      </div>

      {/* Category Horizontal Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-100">
        {categories.map((cat) => {
          const CatIcon = cat.icon;
          const isSelected = activeCategory === cat.name;
          return (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(cat.name as any)}
              className={`flex items-center gap-1.5 py-2 px-4 rounded-xl border font-bold text-xs shrink-0 cursor-pointer transition-all ${
                isSelected 
                  ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <CatIcon className="w-4 h-4 shrink-0" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Lists of Announcement Cards */}
      {filteredList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-250 p-14 text-center text-slate-450 text-xs font-semibold">
          <Megaphone className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          Tidak ada pengumuman yang sesuai dengan filter pencarian Anda.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredList.map((item) => {
            const hasRead = readList.includes(item.id);
            return (
              <motion.div 
                layoutId={`ann_card_${item.id}`}
                key={item.id} 
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-305 hover:bg-slate-50/20 transition-all p-5 shadow-sm relative flex flex-col justify-between space-y-4 cursor-pointer"
                onClick={() => handleOpenAnnouncement(item)}
              >
                <div className="space-y-2.5 text-left">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-mono font-bold tracking-wider ${
                        item.kategori === 'Akademik' ? 'bg-blue-50 text-blue-750 border border-blue-200' :
                        item.kategori === 'Ujian' ? 'bg-rose-50 text-rose-750 border border-rose-200' :
                        item.kategori === 'Asrama' ? 'bg-amber-50 text-amber-705 border border-amber-250' :
                        item.kategori === 'Administrasi' ? 'bg-indigo-50 text-indigo-705 border border-indigo-250' :
                        'bg-teal-50 text-teal-705 border border-teal-250'
                      }`}>
                        {item.kategori}
                      </span>
                      
                      {item.penting && (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-rose-50/80 border border-rose-150 text-[9px] text-rose-750 font-bold uppercase tracking-wide leading-none animate-pulse">
                          <Pin className="w-2.5 h-2.5 rotate-12 shrink-0 inline text-rose-600" />
                          PIN
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      {hasRead ? (
                        <span className="inline-flex items-center gap-0.5 text-slate-400 text-[10px] uppercase font-bold tracking-wide">
                          <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                          Dibaca
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-emerald-700 text-[10px] uppercase font-black tracking-wide">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                          Baru
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="font-extrabold text-sm text-slate-805 leading-snug line-clamp-1 group-hover:text-emerald-700 transition-colors">
                    {item.judul}
                  </h3>
                  <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                    {item.isi_lengkap}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-[10px] text-slate-400 font-semibold select-none">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {item.tanggal}
                  </span>
                  <span className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-0.5">
                    Baca Selengkapnya
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Slide-over announcement Modal details */}
      <AnimatePresence>
        {selectedAnnouncement && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              layoutId={`ann_card_${selectedAnnouncement.id}`}
              className="bg-white rounded-2xl border border-slate-250 shadow-2xl w-full max-w-lg overflow-hidden relative"
            >
              <div className="p-5 border-b border-slate-150 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                    <Megaphone className="w-4.5 h-4.5" />
                  </span>
                  <span className="font-bold text-xs text-slate-805 uppercase tracking-wide">Detail Pengumuman Resmi</span>
                </div>
                <button 
                  onClick={() => setSelectedAnnouncement(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs select-none">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider bg-slate-100 text-slate-650 border border-slate-200">
                    {selectedAnnouncement.kategori}
                  </span>
                  <span className="text-slate-400 font-semibold font-mono">{selectedAnnouncement.tanggal}</span>
                </div>

                <h3 className="font-black text-[15px] text-slate-800 leading-tight select-text">
                  {selectedAnnouncement.judul}
                </h3>

                <p className="text-slate-600 leading-relaxed text-xs overflow-y-auto max-h-56 pr-2 font-medium font-sans border-t border-b border-slate-100 py-3.5 select-text">
                  {selectedAnnouncement.isi_lengkap}
                </p>

                {/* Simulated file attachments if any */}
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Lampiran Dokumen Tambahan</span>
                  <div 
                    onClick={() => downloadAttachment(selectedAnnouncement.judul)}
                    className="p-3 bg-slate-55 border border-slate-150 rounded-xl flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="p-2 bg-rose-50 text-rose-600 rounded-lg block">
                        <Download className="w-4.5 h-4.5" />
                      </span>
                      <div>
                        <p className="text-[11px] font-bold text-slate-800 leading-none">Lampiran_Keterangan_{selectedAnnouncement.id}.pdf</p>
                        <p className="text-[9px] text-slate-400 mt-1 leading-none">Dokumen PDF Resmi • 1.2 MB</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-350" />
                  </div>
                </div>

                <div className="pt-3 text-[10px] text-center text-slate-400 border-t border-slate-100">
                  Diterbitkan oleh: <strong>Sekretariat Umum Ma'had Aly Magelang</strong>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
