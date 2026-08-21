export const TH_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export const TH_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

export const TH_DAYS_FULL = [
  'วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'
];

export const TH_DAYS_SHORT = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

/**
 * Normalizes date string into YYYY-MM-DD
 */
export function normalizeDate(dateStr: string | Date | undefined): string {
  if (!dateStr) return '';
  if (dateStr instanceof Date) {
    const y = dateStr.getFullYear();
    const m = String(dateStr.getMonth() + 1).padStart(2, '0');
    const d = String(dateStr.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const s = String(dateStr).trim();
  if (s.includes('/')) {
    const parts = s.split('/').map(Number);
    if (parts.length === 3) {
      if (parts[2] > 100) {
        // D/M/YYYY
        const yyyy = parts[2] > 2400 ? parts[2] - 543 : parts[2]; // handle BE if passed
        const mm = String(parts[1]).padStart(2, '0');
        const dd = String(parts[0]).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      }
    }
  }
  return s;
}

/**
 * Formats a date into Thai format (e.g. "19 ส.ค. 2569")
 */
export function formatThaiDate(dateStr: string | Date, isShort = true): string {
  try {
    const norm = typeof dateStr === 'string' ? normalizeDate(dateStr) : dateStr;
    const d = new Date(norm);
    if (isNaN(d.getTime())) return String(dateStr);
    const day = d.getDate();
    const month = isShort ? TH_MONTHS_SHORT[d.getMonth()] : TH_MONTHS_FULL[d.getMonth()];
    const year = d.getFullYear() + 543;
    return `${day} ${month} ${year}`;
  } catch {
    return String(dateStr);
  }
}

/**
 * Formats a date with weekday name (e.g. "วันพุธที่ 19 สิงหาคม 2569")
 */
export function formatThaiDateWithDay(dateStr: string | Date): string {
  try {
    const norm = typeof dateStr === 'string' ? normalizeDate(dateStr) : dateStr;
    const d = new Date(norm);
    if (isNaN(d.getTime())) return String(dateStr);
    const dayName = TH_DAYS_FULL[d.getDay()];
    const day = d.getDate();
    const month = TH_MONTHS_FULL[d.getMonth()];
    const year = d.getFullYear() + 543;
    return `${dayName}ที่ ${day} ${month} ${year}`;
  } catch {
    return String(dateStr);
  }
}

/**
 * Hash password string to match the existing hash algorithm
 */
export function hashStr(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(16).padStart(8, '0');
}

// hash สำเร็จรูปของรหัสเจ้าหน้าที่ (ไม่ฝังรหัสจริงเป็น plaintext ใน bundle)
export const ADMIN_PIN_HASH = '33708987';
