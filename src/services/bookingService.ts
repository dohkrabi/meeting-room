import { Booking } from '../types';
import { normalizeDate, formatThaiDate } from '../utils/thaiDate';

export const DEFAULT_GAS_URL = '/api/gas';

const STORAGE_KEY = 'krabi_meeting_bookings_v2';
const GAS_URL_KEY = 'krabi_meeting_gas_url';

export function getGasUrl(): string {
  const stored = localStorage.getItem(GAS_URL_KEY);
  // ถ้าค่าที่เก็บไว้เป็น URL ตรงของ GAS (จากเวอร์ชันเก่า) ให้ข้าม แล้วใช้ proxy แทน
  if (stored && !stored.includes('script.google.com') && !stored.includes('script.googleusercontent')) {
    return stored;
  }
  return DEFAULT_GAS_URL;
}

export function setGasUrl(url: string) {
  localStorage.setItem(GAS_URL_KEY, url);
}

// ───────────────────────────────────────────────
// Auth: เก็บ token ในหน่วยความจำ (refresh = login ใหม่)
// ───────────────────────────────────────────────
let authToken: string | null = null;
let authUsername: string | null = null;
let authRole: string | null = null;
let onAuthExpired: (() => void) | null = null;

export function setOnAuthExpired(cb: () => void) {
  onAuthExpired = cb;
}
export function getAuthToken(): string | null {
  return authToken;
}
export function getAuthUsername(): string | null {
  return authUsername;
}
export function getAuthRole(): string | null {
  return authRole;
}
export function clearAuth() {
  authToken = null;
  authUsername = null;
  authRole = null;
}

// เข้าสู่ระบบ → ขอ token จาก GAS
export async function login(
  username: string,
  password: string
): Promise<{ ok: boolean; username?: string; role?: string; expiresInSec?: number; error?: string }> {
  try {
    const json = await postToGas({ action: 'login', username, password });
    if (json.ok && json.token) {
      authToken = json.token;
      authUsername = json.username || username;
      authRole = json.role || 'user';
      return { ok: true, username: authUsername ?? undefined, role: authRole ?? undefined, expiresInSec: json.expiresInSec };
    }
    return { ok: false, error: json.error || 'เข้าสู่ระบบไม่สำเร็จ' };
  } catch (err: any) {
    return { ok: false, error: 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่' };
  }
}

// POST ไป GAS พร้อม timeout (กัน UI ค้างถาวรเมื่อ GAS ช้า/ไม่ตอบ)
// แนบ token อัตโนมัติ และถ้า GAS ตอบ code:'AUTH' = เซสชันหมดอายุ → เคลียร์ + แจ้ง
async function postToGas(payload: object, timeoutMs = 25000): Promise<any> {
  const gasUrl = getGasUrl();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const body: any = { ...payload };
    if (authToken && !('token' in body)) body.token = authToken;
    const res = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const json = await res.json();
    if (json && json.code === 'AUTH') {
      clearAuth();
      if (onAuthExpired) onAuthExpired();
    }
    return json;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Generate realistic initial seed bookings for Krabi Highway District
export function getInitialSeedBookings(): Booking[] {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  const todayStr = `${y}-${m}-${d}`;

  // Tomorrow
  const tom = new Date(today);
  tom.setDate(today.getDate() + 1);
  const tomY = tom.getFullYear();
  const tomM = String(tom.getMonth() + 1).padStart(2, '0');
  const tomD = String(tom.getDate()).padStart(2, '0');
  const tomStr = `${tomY}-${tomM}-${tomD}`;

  // Day after tomorrow
  const dat = new Date(today);
  dat.setDate(today.getDate() + 2);
  const datY = dat.getFullYear();
  const datM = String(dat.getMonth() + 1).padStart(2, '0');
  const datD = String(dat.getDate()).padStart(2, '0');
  const datStr = `${datY}-${datM}-${datD}`;

  return [
    {
      row: 2,
      id: 'b-seed-1',
      name: 'นายสมศักดิ์ รักชาติ (หน.งาน)',
      dept: 'งานแผนงาน',
      date: todayStr,
      time_start: '09:00',
      time_end: '12:00',
      topic: 'ประชุมติดตามความคืบหน้าโครงการบำรุงทางหลวง ประจำปีงบประมาณ',
      attendees: 15,
      equipment: 'โปรเจกเตอร์ & จอรับภาพ 120 นิ้ว, ไมโครโฟนตั้งโต๊ะ / ไมค์ลอย, เครื่องเสียง & ลำโพง',
      use_zoom: true,
      zoom_url: 'https://zoom.us/j/84219385721',
      meeting_id: '842 1938 5721',
      passcode: 'doh343',
      note: 'เตรียมเอกสารงบประมาณประกอบการประชุมล่วงหน้า',
      status: 'จอง',
      timestamp: `${todayStr} 08:30:00`,
      sent_ok: true,
      sent_1day: true,
      sent_1hr: false,
      sent_30min: false,
    },
    {
      row: 3,
      id: 'b-seed-2',
      name: 'นางสาวรัตนา สุวรรณโณ',
      dept: 'งานพัสดุและสัญญา',
      date: todayStr,
      time_start: '13:30',
      time_end: '16:00',
      topic: 'ประชุมตรวจรับพัสดุและสัญญาจัดซื้อวัสดุซ่อมแซมผิวจราจร',
      attendees: 8,
      equipment: 'โทรทัศน์ Smart TV 65 นิ้ว, กระดานไวท์บอร์ด & ปากกา',
      use_zoom: false,
      status: 'จอง',
      timestamp: `${todayStr} 10:15:00`,
      sent_ok: true,
      sent_1day: true,
      sent_1hr: false,
      sent_30min: false,
    },
    {
      row: 4,
      id: 'b-seed-3',
      name: 'นายกิตติคุณ มิ่งขวัญ (วิศวกร)',
      dept: 'งานควบคุมงาน',
      date: tomStr,
      time_start: '09:30',
      time_end: '11:30',
      topic: 'ประชุมชี้แจงมาตรฐานงานก่อสร้างสะพานและงานโครงสร้างทางหลวง',
      attendees: 20,
      equipment: 'โปรเจกเตอร์ & จอรับภาพ 120 นิ้ว, ไมโครโฟนตั้งโต๊ะ / ไมค์ลอย, ชุดโต๊ะจัดเลี้ยงอาหารว่าง/เบรค',
      use_zoom: true,
      zoom_url: 'https://zoom.us/j/91028374650',
      meeting_id: '910 2837 4650',
      passcode: 'krabi2026',
      status: 'จอง',
      timestamp: `${todayStr} 11:00:00`,
      sent_ok: true,
      sent_1day: false,
      sent_1hr: false,
      sent_30min: false,
    },
    {
      row: 5,
      id: 'b-seed-4',
      name: 'นายธนาธิป สุขเกษม',
      dept: 'หมวดทางหลวงอ่าวนาง',
      date: datStr,
      time_start: '10:00',
      time_end: '12:00',
      topic: 'ประชุมสรุปแผนความปลอดภัยช่วงเทศกาลและการอำนวยความสะดวกประชาชน',
      attendees: 12,
      equipment: 'โปรเจกเตอร์ & จอรับภาพ 120 นิ้ว, เครื่องเสียง & ลำโพง',
      use_zoom: false,
      status: 'จอง',
      timestamp: `${todayStr} 11:45:00`,
      sent_ok: true,
      sent_1day: false,
      sent_1hr: false,
      sent_30min: false,
    },
  ];
}

export async function fetchBookings(): Promise<{ data: Booking[]; isLive: boolean }> {
  const gasUrl = getGasUrl();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const res = await fetch(`${gasUrl}?t=${Date.now()}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const json = await res.json();
    if (json.ok && Array.isArray(json.data)) {
      const formatted: Booking[] = json.data.map((b: any, index: number) => ({
        ...b,
        row: b.row || index + 2,
        name: String(b.name ?? ''),
        dept: String(b.dept ?? ''),
        topic: String(b.topic ?? ''),
        equipment: String(b.equipment ?? ''),
        zoom_url: String(b.zoom_url ?? ''),
        meeting_id: String(b.meeting_id ?? ''),
        passcode: String(b.passcode ?? ''),
        note: String(b.note ?? ''),
        time_start: String(b.time_start ?? ''),
        time_end: String(b.time_end ?? ''),
        date: normalizeDate(b.date),
        status: b.status || 'จอง',
        sent_ok: !!b.sent_ok,
        sent_1day: !!b.sent_1day,
        sent_1hr: !!b.sent_1hr,
        sent_30min: !!b.sent_30min,
      }));
      // Cache in local storage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formatted));
      return { data: formatted, isLive: true };
    }
  } catch (err) {
    console.warn('GAS fetch failed or timed out, loading local cached data:', err);
  }

  // Fallback to local storage or initial seeds
  const local = localStorage.getItem(STORAGE_KEY);
  if (local) {
    try {
      const parsed = JSON.parse(local).map((b: Booking) => ({
        ...b,
        date: normalizeDate(b.date),
      }));
      return { data: parsed, isLive: false };
    } catch {
      // ignore
    }
  }

  const seeds = getInitialSeedBookings();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeds));
  return { data: seeds, isLive: false };
}

/**
 * Client-side Conflict Check
 */
export function findConflict(
  bookings: Booking[],
  date: string,
  startTime: string,
  endTime: string,
  excludeRow?: number
): Booking | null {
  if (!date || !startTime || !endTime) return null;
  const startNorm = startTime.length === 5 ? startTime : startTime.padStart(5, '0');
  const endNorm = endTime.length === 5 ? endTime : endTime.padStart(5, '0');
  const checkStart = new Date(`${date}T${startNorm}:00`).getTime();
  const checkEnd = new Date(`${date}T${endNorm}:00`).getTime();

  if (isNaN(checkStart) || isNaN(checkEnd) || checkStart >= checkEnd) {
    return null;
  }

  for (const b of bookings) {
    if (b.status === 'ยกเลิก' || b.status === 'ชนกัน') continue;
    if (excludeRow && b.row === excludeRow) continue;

    const bDate = normalizeDate(b.date);
    if (bDate !== date) continue;

    const bStartNorm = b.time_start.length === 5 ? b.time_start : b.time_start.padStart(5, '0');
    const bEndNorm = b.time_end.length === 5 ? b.time_end : b.time_end.padStart(5, '0');

    const bStart = new Date(`${bDate}T${bStartNorm}:00`).getTime();
    const bEnd = new Date(`${bDate}T${bEndNorm}:00`).getTime();

    if (isNaN(bStart) || isNaN(bEnd)) continue;

    // Overlap condition: checkStart < bEnd AND checkEnd > bStart
    if (checkStart < bEnd && checkEnd > bStart) {
      return b;
    }
  }

  return null;
}

export async function createBooking(
  booking: Omit<Booking, 'row' | 'status'>
): Promise<{ ok: boolean; error?: string; booking?: Booking }> {
  const newBooking: Booking = {
    ...booking,
    status: 'จอง',
    date: normalizeDate(booking.date),
    sent_ok: true,
    sent_1day: false,
    sent_1hr: false,
    sent_30min: false,
  };

  try {
    const json = await postToGas({
      action: 'book',
      ...newBooking,
    });
    if (json.ok) {
      return { ok: true, booking: newBooking };
    }
    if (json.error) {
      return { ok: false, error: json.error };
    }
  } catch (err) {
    console.warn('Online booking submission failed/timed out, updating local storage directly:', err);
  }

  // Local fallback persistence
  const local = localStorage.getItem(STORAGE_KEY);
  const currentList: Booking[] = local ? JSON.parse(local) : getInitialSeedBookings();
  const maxRow = currentList.reduce((max, b) => Math.max(max, b.row || 2), 2);
  newBooking.row = maxRow + 1;
  newBooking.id = `local-${Date.now()}`;
  newBooking.timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

  const updated = [newBooking, ...currentList];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  return { ok: true, booking: newBooking };
}

export async function updateBooking(booking: Booking): Promise<{ ok: boolean; error?: string }> {
  try {
    const json = await postToGas({
      action: 'update',
      ...booking,
    });
    if (json.ok) {
      return { ok: true };
    }
    if (json.error) {
      return { ok: false, error: json.error };
    }
  } catch (err) {
    console.warn('Online update failed/timed out, modifying local data:', err);
  }

  // Local fallback
  const local = localStorage.getItem(STORAGE_KEY);
  if (local) {
    const currentList: Booking[] = JSON.parse(local);
    const updated = currentList.map((b) =>
      b.row === booking.row || (b.id && b.id === booking.id) ? { ...booking } : b
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
  return { ok: true };
}

export async function cancelOrDeleteBooking(
  action: 'cancel' | 'delete',
  row?: number,
  id?: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const json = await postToGas({
      action: action,
      row: row,
    });
    if (json.ok) {
      return { ok: true };
    }
    if (json.error) {
      return { ok: false, error: json.error };
    }
  } catch (err) {
    console.warn(`Online ${action} failed/timed out, updating local storage:`, err);
  }

  // Local fallback
  const local = localStorage.getItem(STORAGE_KEY);
  if (local) {
    let currentList: Booking[] = JSON.parse(local);
    if (action === 'delete') {
      currentList = currentList.filter((b) => (row ? b.row !== row : b.id !== id));
    } else {
      currentList = currentList.map((b) =>
        (row && b.row === row) || (id && b.id === id) ? { ...b, status: 'ยกเลิก' as const } : b
      );
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentList));
  }
  return { ok: true };
}

/**
 * Send Test LINE Notification
 */
export async function sendTestNotification(
  type: 'on_book' | '1_day' | '1_hour' | '30_min',
  sampleBooking?: Booking
): Promise<{ ok: boolean; message: string }> {
  try {
    const json = await postToGas({
      action: 'test_notify',
      notify_type: type,
      booking: sampleBooking,
    });
    if (json.ok) {
      return { ok: true, message: 'ส่งข้อความทดสอบเข้า LINE เรียบร้อยแล้ว' };
    }
  } catch (err) {
    console.warn('Test notify fetch error/timeout, returning simulated success:', err);
  }
  return { ok: true, message: 'จำลองการส่งแจ้งเตือนสำเร็จ (ทดสอบข้อความเรียบร้อย)' };
}

// ───────────────────────────────────────────────
// จัดการผู้ใช้ (admin เท่านั้น)
// ───────────────────────────────────────────────
export interface UserRecord {
  username: string;
  role: 'admin' | 'user';
}

export async function listUsers(): Promise<{ ok: boolean; users?: UserRecord[]; error?: string }> {
  try {
    const json = await postToGas({ action: 'list_users' });
    if (json.ok) return { ok: true, users: json.users || [] };
    return { ok: false, error: json.error || 'ดึงรายชื่อผู้ใช้ไม่สำเร็จ' };
  } catch {
    return { ok: false, error: 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้' };
  }
}

export async function addUser(
  username: string,
  password: string,
  role: 'admin' | 'user'
): Promise<{ ok: boolean; updated?: boolean; error?: string }> {
  try {
    const json = await postToGas({
      action: 'add_user',
      new_username: username,
      new_password: password,
      new_role: role,
    });
    if (json.ok) return { ok: true, updated: json.updated };
    return { ok: false, error: json.error || 'บันทึกผู้ใช้ไม่สำเร็จ' };
  } catch {
    return { ok: false, error: 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้' };
  }
}

export async function removeUser(username: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const json = await postToGas({ action: 'remove_user', target_username: username });
    if (json.ok) return { ok: true };
    return { ok: false, error: json.error || 'ลบผู้ใช้ไม่สำเร็จ' };
  } catch {
    return { ok: false, error: 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้' };
  }
}

// ───────────────────────────────────────────────
// ข้อมูลห้อง / สิ่งอำนวยความสะดวก
// ───────────────────────────────────────────────
export interface Facilities {
  location: string;
  capacity: string;
  equipment: string[];
  rules: string[];
  contact: string;
}

export async function getFacilities(): Promise<Facilities | null> {
  try {
    const json = await postToGas({ action: 'get_facilities' });
    if (json.ok && json.facilities) return json.facilities as Facilities;
  } catch (err) {
    console.warn('getFacilities failed:', err);
  }
  return null;
}

export async function saveFacilities(
  facilities: Facilities
): Promise<{ ok: boolean; error?: string }> {
  try {
    const json = await postToGas({ action: 'save_facilities', facilities });
    if (json.ok) return { ok: true };
    return { ok: false, error: json.error || 'บันทึกข้อมูลห้องไม่สำเร็จ' };
  } catch {
    return { ok: false, error: 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้' };
  }
}
