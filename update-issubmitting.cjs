const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'src/pages/admin/PengajarList.tsx',
  'src/pages/admin/KelasList.tsx',
  'src/pages/admin/MahasantriList.tsx',
  'src/pages/admin/JadwalList.tsx',
  'src/pages/admin/PengumumanList.tsx',
  'src/pages/admin/MatakuliahList.tsx',
  'src/pages/pengajar/PenilaianPengajar.tsx',
  'src/pages/pengajar/AbsensiPengajar.tsx',
  'src/pages/mahasantri/components/ProfilView.tsx'
];

filesToUpdate.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Check if isSubmitting already exists
  if (content.includes('const [isSubmitting, setIsSubmitting] = useState(false);')) {
    console.log(`Skipping ${filePath}, already has isSubmitting.`);
    return;
  }

  // 1. Add useState
  // find first useState from react and add isSubmitting after the first useState in the component
  const componentMatch = content.match(/export default function \w+\(\) \{/);
  if (!componentMatch && !content.match(/const \w+ = \(\) => \{/)) {
    console.log(`Could not find component start in ${filePath}`);
    return;
  }
  
  if (componentMatch) {
    let lines = content.split('\n');
    let idx = lines.findIndex(l => l.includes(componentMatch[0]));
    if (idx !== -1) {
       lines.splice(idx + 1, 0, '  const [isSubmitting, setIsSubmitting] = useState(false);');
       content = lines.join('\n');
    }
  }

  // 2. Add protection in handleSave type functions
  const saveFuncPatterns = [
    /const handleSave = async \(e: React.FormEvent\) => {/,
    /const handleSaveEdit = async \(\) => {/,
    /const handleSaveAddBulk = async \(\) => {/,
    /const handleSaveNewSession = async \(\) => {/,
    /const handleSaveSession = async \(\) => {/,
    /const handleSavePersonalInfo = \(e: React.FormEvent\) => {/,
    /const handleSavePassword = \(e: React.FormEvent\) => {/
  ];

  let replaced = false;
  saveFuncPatterns.forEach(pattern => {
    let match = content.match(pattern);
    if (match) {
      if (!content.includes('if (isSubmitting) return;')) {
         content = content.replace(pattern, `${match[0]}\n    if (isSubmitting) return;\n    setIsSubmitting(true);`);
         replaced = true;
      }
    }
  });

  // add finally to the functions
  // it's tricky to find the end of block robustly with regex, so we'll just inject it differently or use string replacements.
  // Actually, if we just do:
  const catchPattern = /\} catch \(err(?:or)?\) \{([^}]*)\}/g;
  content = content.replace(catchPattern, '} catch (err) {$1} finally { setIsSubmitting(false); }');
  
  const catchPattern2 = /\} catch \(e\) \{([^}]*)\}/g;
  content = content.replace(catchPattern2, '} catch (e) {$1} finally { setIsSubmitting(false); }');

  // For ProfilView (no try-catch usually on synchronous ones, maybe we use a setTimeout or just set it false)
  if (filePath.includes('ProfilView')) {
     content = content.replace(/toast\.success\('Kata sandi berhasil diperbarui\.'\);/g, "toast.success('Kata sandi berhasil diperbarui.'); setIsSubmitting(false);");
     content = content.replace(/toast\.success\('Pembaruan data pribadi berhasil disimpan\.'\);/g, "toast.success('Pembaruan data pribadi berhasil disimpan.'); setIsSubmitting(false);");
  }

  // Disable buttons
  content = content.replace(/<button([^>]*)type="submit"/g, '<button$1type="submit" disabled={isSubmitting}');
  content = content.replace(/>\s*Simpan\s*<\/button>/g, '>{isSubmitting ? "Menyimpan..." : "Simpan"}</button>');
  content = content.replace(/>\s*Simpan Perubahan\s*<\/button>/g, '>{isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}</button>');
  content = content.replace(/>\s*Simpan Presensi\s*<\/button>/g, '>{isSubmitting ? "Menyimpan..." : "Simpan Presensi"}</button>');
  
  if (replaced) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated ${filePath}`);
  }
});
