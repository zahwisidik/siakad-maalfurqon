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
