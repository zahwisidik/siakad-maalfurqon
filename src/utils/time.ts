export const formatTimeDisplay = (val: any): string => {
  if (val === undefined || val === null || val === '') return '';
  const str = String(val).trim();
  
  // Check if it matches ISO datetime string, like 1899-12-30T15:30:00.000Z
  const isISO = /^\d{4}-\d{2}-\d{2}T\d{2}[:\.]\d{2}/.test(str);
  if (isISO) {
    try {
      const d = new Date(str);
      // Format to America/Los_Angeles as the canonical sheet timezone where empty times default
      const formatted = d.toLocaleTimeString('en-US', {
        timeZone: 'America/Los_Angeles',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      });
      if (formatted && formatted !== 'Invalid Date' && /^\d{2}[:\.]\d{2}/.test(formatted)) {
        return formatted.replace(':', '.');
      }
    } catch (e) {
      // Ignore and fallback below
    }
    
    // Fallback extraction manually from UTC if Intl or Date fails
    const timeMatch = str.match(/T(\d{2})[:\.](\d{2})/);
    if (timeMatch) {
      // 15:30 UTC -> PST is (-8 hours) -> 07:30
      let h = parseInt(timeMatch[1]);
      const m = parseInt(timeMatch[2]);
      h = (h - 8 + 24) % 24;
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${pad(h)}.${pad(m)}`;
    }
  }
  
  // Handle other format strings. e.g. "07:30", "07.30", "7.3", etc.
  const parts = str.split(/[\.:]/);
  if (parts.length > 0 && /^\d+$/.test(parts[0])) {
    const h = parts[0].padStart(2, '0');
    let m = '00';
    if (parts.length > 1) {
      m = parts[1];
      if (m.length === 1) {
        m = m + '0';
      } else if (m.length > 2) {
        m = m.substring(0, 2);
      }
    }
    return `${h}.${m}`;
  }
  
  return str.replace(':', '.');
};

export function formatToIndonesianDate(dateStr: string | any): string {
  if (!dateStr) return '';
  
  const idMonths = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const enMonths = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const cleanStr = String(dateStr).trim();
  
  // Replace standard English month names to make it safely parsable or displayable
  let normalizedStr = cleanStr;
  enMonths.forEach((enMonth, idx) => {
    const regex = new RegExp(enMonth, 'gi');
    if (regex.test(normalizedStr)) {
      normalizedStr = normalizedStr.replace(regex, idMonths[idx]);
    }
    // Also check abbreviation e.g. "Jun", "Jul", etc.
    const abbRegex = new RegExp(enMonth.substring(0, 3) + '\\.?', 'gi');
    if (enMonth !== 'May' && abbRegex.test(normalizedStr)) {
      normalizedStr = normalizedStr.replace(abbRegex, idMonths[idx]);
    }
  });

  // If there's an Indonesian month in it now, ensure it's capitalized properly and return
  const containsIdMonth = idMonths.some(m => normalizedStr.toLowerCase().includes(m.toLowerCase()));
  if (containsIdMonth) {
    idMonths.forEach(m => {
      const regex = new RegExp(m, 'gi');
      normalizedStr = normalizedStr.replace(regex, m);
    });
    return normalizedStr;
  }

  // Handle slashes: e.g. "24/05/2026" or "5/24/2026" or "2026/06/20"
  const ymdRegex = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/;
  const dmyRegex = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/;
  
  let match = cleanStr.match(ymdRegex);
  if (match) {
    const year = parseInt(match[1]);
    const monthIndex = parseInt(match[2]) - 1;
    const day = parseInt(match[3]);
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${day} ${idMonths[monthIndex]} ${year}`;
    }
  }

  match = cleanStr.match(dmyRegex);
  if (match) {
    const day = parseInt(match[1]);
    const monthIndex = parseInt(match[2]) - 1;
    const year = parseInt(match[3]);
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${day} ${idMonths[monthIndex]} ${year}`;
    }
  }

  // Last, use native JS Date parser
  const parsedDate = new Date(cleanStr);
  if (!isNaN(parsedDate.getTime())) {
    const day = parsedDate.getDate();
    const month = idMonths[parsedDate.getMonth()];
    const year = parsedDate.getFullYear();
    return `${day} ${month} ${year}`;
  }

  return cleanStr;
}

export function getTodayIndonesianDate(): string {
  const d = new Date();
  const idMonths = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return `${d.getDate()} ${idMonths[d.getMonth()]} ${d.getFullYear()}`;
}

export async function fetchRealWIBTime(): Promise<Date> {
  try {
    const res = await fetch('https://worldtimeapi.org/api/timezone/Asia/Jakarta', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      return new Date(data.datetime);
    }
  } catch (e) {
    console.warn('Gagal mengambil waktu dari server, menggunakan waktu lokal', e);
  }
  return new Date();
}

export function getWIBDate(date?: Date): string {
  const d = date || new Date();
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }); // YYYY-MM-DD in WIB
}

export function getWIBTime(date?: Date): string {
  const d = date || new Date();
  return d.toLocaleTimeString('en-US', { timeZone: 'Asia/Jakarta', hour12: false, hour: '2-digit', minute: '2-digit' }).replace('24:', '00:');
}

