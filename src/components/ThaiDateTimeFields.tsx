import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, AlertTriangle, Clock } from 'lucide-react';
import { Booking } from '../types';
import { normalizeDate } from '../utils/thaiDate';

/**
 * ช่องเลือกวันที่ (ปฏิทินไทย ปี พ.ศ.) + เวลาเริ่ม/สิ้นสุด (24 ชม. ทีละ 15 นาที)
 * ค่าที่รับ/ส่งออกยังเป็นรูปแบบเดิมของระบบ: date = 'yyyy-mm-dd' (ค.ศ.), time = 'HH:mm'
 */

const MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const DAYS = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];
const DOW = ['อา','จ','อ','พ','พฤ','ศ','ส'];

const pad = (n: number) => String(n).padStart(2, '0');
const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toMin = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

// 'yyyy-mm-dd' → Date (ปีเกิน 2400 ถือเป็น พ.ศ. ที่กรอกผิด แปลงเป็น ค.ศ.)
export function parseIsoDate(v: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v || '');
  if (!m) return null;
  let y = Number(m[1]);
  if (y > 2400) y -= 543;
  const d = new Date(y, Number(m[2]) - 1, Number(m[3]));
  return isNaN(d.getTime()) ? null : d;
}

export function thaiLongDate(v: string): string {
  const d = parseIsoDate(v);
  if (!d) return '';
  return `วัน${DAYS[d.getDay()]}ที่ ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
}

// ช่องเวลา 07:00–20:00 ทีละ 15 นาที
const SLOTS: string[] = [];
for (let m = 7 * 60; m <= 20 * 60; m += 15) SLOTS.push(`${pad(Math.floor(m / 60))}:${pad(m % 60)}`);

type Accent = 'indigo' | 'teal';
const ACCENT: Record<Accent, { sel: string; today: string; hover: string; badge: string; icon: string; focus: string }> = {
  indigo: {
    sel: 'bg-indigo-700 text-white shadow-md',
    today: 'ring-2 ring-indigo-500 text-indigo-800',
    hover: 'hover:bg-indigo-50',
    badge: 'bg-indigo-100 text-indigo-700',
    icon: 'text-indigo-600',
    focus: 'focus:border-indigo-600 focus:ring-indigo-100',
  },
  teal: {
    sel: 'bg-teal-700 text-white shadow-md',
    today: 'ring-2 ring-teal-500 text-teal-800',
    hover: 'hover:bg-teal-50',
    badge: 'bg-teal-100 text-teal-700',
    icon: 'text-teal-600',
    focus: 'focus:border-teal-600 focus:ring-teal-100',
  },
};

interface Props {
  date: string;
  timeStart: string;
  timeEnd: string;
  onDateChange: (v: string) => void;
  onTimeStartChange: (v: string) => void;
  onTimeEndChange: (v: string) => void;
  /** รายการจองที่โหลดไว้ — ใช้ทำจุดบอกวันที่มีจอง + บอกช่วงที่ไม่ว่าง (อ่านอย่างเดียว) */
  bookings?: Booking[];
  /** แถวของรายการที่กำลังแก้ไข — ไม่นับเป็นช่วงที่ไม่ว่าง */
  excludeRow?: number;
  accent?: Accent;
  idPrefix?: string;
}

export const ThaiDateTimeFields: React.FC<Props> = ({
  date,
  timeStart,
  timeEnd,
  onDateChange,
  onTimeStartChange,
  onTimeEndChange,
  bookings = [],
  excludeRow,
  accent = 'indigo',
  idPrefix = 'dt',
}) => {
  const a = ACCENT[accent];
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);
  const selected = parseIsoDate(date);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<Date>(() => {
    const base = selected || today;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  // ค่าเดิมที่ปีเป็น พ.ศ. (บันทึกผิดไว้ก่อนหน้า) → แก้เป็น ค.ศ. ให้อัตโนมัติ
  useEffect(() => {
    const m = /^(\d{4})-/.exec(date || '');
    if (m && Number(m[1]) > 2400 && selected) onDateChange(toIso(selected));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  // ปิดปฏิทินด้วย Esc
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // รายการจองที่ยังมีผล (ไม่นับยกเลิก/ลบ และรายการที่กำลังแก้)
  const active = useMemo(
    () =>
      bookings.filter(
        (b) => b.status !== 'ยกเลิก' && String(b.status) !== 'ลบแล้ว' && !(excludeRow && b.row === excludeRow)
      ),
    [bookings, excludeRow]
  );
  const bookedDates = useMemo(() => {
    const set = new Set<string>();
    active.forEach((b) => {
      const d = parseIsoDate(normalizeDate(b.date));
      if (d) set.add(toIso(d));
    });
    return set;
  }, [active]);
  const busyToday = useMemo(() => {
    if (!selected) return [];
    const key = toIso(selected);
    return active
      .filter((b) => {
        const d = parseIsoDate(normalizeDate(b.date));
        return d && toIso(d) === key;
      })
      .sort((x, y) => String(x.time_start).localeCompare(String(y.time_start)));
  }, [active, selected]);

  const pick = (d: Date) => {
    onDateChange(toIso(d));
    setOpen(false);
  };
  const openCal = () => {
    const base = selected || today;
    setView(new Date(base.getFullYear(), base.getMonth(), 1));
    setOpen((o) => !o);
  };

  // ตัวเลือกเวลา: ช่องมาตรฐาน + ค่าเดิมที่ไม่ตรงช่อง (เช่น 16:18) ไม่ให้ข้อมูลเก่าหาย
  const startOptions = useMemo(() => {
    const list = SLOTS.slice(0, -1);
    if (timeStart && !list.includes(timeStart)) list.push(timeStart);
    return list.sort();
  }, [timeStart]);
  const endOptions = useMemo(() => {
    const list = SLOTS.filter((t) => !timeStart || t > timeStart);
    if (timeEnd && !list.includes(timeEnd) && (!timeStart || timeEnd > timeStart)) list.push(timeEnd);
    return list.sort();
  }, [timeStart, timeEnd]);

  const changeStart = (v: string) => {
    onTimeStartChange(v);
    if (!timeEnd || timeEnd <= v) {
      // เวลาสิ้นสุดเดิมใช้ไม่ได้แล้ว → ตั้งเป็น +2 ชม. (ไม่เกิน 20:00)
      const target = Math.min(toMin(v) + 120, 20 * 60);
      onTimeEndChange(`${pad(Math.floor(target / 60))}:${pad(target % 60)}`);
    }
  };

  const diffDays = selected ? Math.round((selected.getTime() - today.getTime()) / 86400000) : null;
  const rel = diffDays === 0 ? 'วันนี้' : diffDays === 1 ? 'พรุ่งนี้' : diffDays && diffDays > 1 ? `อีก ${diffDays} วัน` : '';
  const dur = timeStart && timeEnd && timeEnd > timeStart ? toMin(timeEnd) - toMin(timeStart) : 0;
  const durText = dur ? `${Math.floor(dur / 60) ? Math.floor(dur / 60) + ' ชม. ' : ''}${dur % 60 ? (dur % 60) + ' นาที' : ''}`.trim() : '';

  // ช่องว่างหน้าวันที่ 1 + วันในเดือน
  const firstDow = new Date(view.getFullYear(), view.getMonth(), 1).getDay();
  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const selectCls = `w-full px-3 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm bg-white font-mono focus:outline-none focus:ring-2 ${a.focus}`;

  return (
    <div className="space-y-3">
      {/* วันที่ */}
      <div className="space-y-1.5">
        <label htmlFor={`${idPrefix}-date`} className="block text-xs font-semibold text-stone-700">
          วันที่ <span className="text-rose-500">*</span>
        </label>
        <button
          id={`${idPrefix}-date`}
          type="button"
          onClick={openCal}
          aria-expanded={open}
          className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-xs sm:text-sm text-left focus:outline-none focus:ring-2 ${a.focus}`}
        >
          <span className="flex items-center gap-2 min-w-0">
            <CalendarDays className={`w-4 h-4 shrink-0 ${a.icon}`} />
            <span className={`truncate ${selected ? 'font-semibold text-stone-900' : 'text-stone-400'}`}>
              {selected ? thaiLongDate(date) : 'เลือกวันที่'}
            </span>
          </span>
          {rel && <span className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full ${a.badge}`}>{rel}</span>}
        </button>

        {open && (
          <div className="rounded-2xl border border-stone-200 bg-white shadow-lg p-3 sm:p-4 max-w-sm">
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                aria-label="เดือนก่อน"
                onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
                className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-600"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="font-bold text-sm text-stone-900 font-['Prompt',sans-serif]">
                {MONTHS[view.getMonth()]} {view.getFullYear() + 543}
              </div>
              <button
                type="button"
                aria-label="เดือนถัดไป"
                onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
                className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-600"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-7 text-center text-[11px] font-bold mb-1">
              {DOW.map((d, i) => (
                <div key={d} className={`py-1 ${i === 0 ? 'text-rose-500' : i === 6 ? 'text-blue-500' : 'text-stone-500'}`}>
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDow }).map((_, i) => (
                <div key={`e${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const d = new Date(view.getFullYear(), view.getMonth(), i + 1);
                const iso = toIso(d);
                const isSel = selected && iso === toIso(selected);
                const isToday = iso === toIso(today);
                const past = d < today;
                const booked = bookedDates.has(iso);
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => pick(d)}
                    aria-label={`${i + 1} ${MONTHS[d.getMonth()]} ${d.getFullYear() + 543}${booked ? ' (มีจองแล้ว)' : ''}`}
                    className={`relative h-9 rounded-xl text-sm font-semibold tabular-nums transition ${
                      isSel ? a.sel : isToday ? `${a.today} ${a.hover}` : past ? 'text-stone-300 hover:bg-stone-50' : `text-stone-800 ${a.hover}`
                    }`}
                  >
                    {i + 1}
                    {booked && (
                      <span
                        className={`absolute left-1/2 -translate-x-1/2 bottom-1 w-1.5 h-1.5 rounded-full ${isSel ? 'bg-amber-300' : 'bg-amber-500'}`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-stone-100 text-xs">
              <span className="flex items-center gap-1 text-stone-500">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                มีจองแล้ว
              </span>
              <div className="flex gap-1">
                <button type="button" onClick={() => pick(today)} className={`px-2.5 py-1 rounded-lg font-semibold ${a.icon} ${a.hover}`}>
                  วันนี้
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const t = new Date(today);
                    t.setDate(t.getDate() + 1);
                    pick(t);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-semibold ${a.icon} ${a.hover}`}
                >
                  พรุ่งนี้
                </button>
              </div>
            </div>
          </div>
        )}

        {diffDays !== null && diffDays < 0 && (
          <p className="text-xs font-semibold text-amber-700 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> วันที่นี้ผ่านมาแล้ว
          </p>
        )}
        {busyToday.length > 0 && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
            <span className="font-bold">ช่วงที่มีจองแล้วในวันนี้: </span>
            {busyToday.map((b, i) => (
              <span key={(b.row || i) + b.time_start}>
                {i > 0 && ' · '}
                {b.time_start}–{b.time_end} น.
              </span>
            ))}
          </div>
        )}
      </div>

      {/* เวลา */}
      <div className="space-y-1.5">
        <label htmlFor={`${idPrefix}-ts`} className="block text-xs font-semibold text-stone-700">
          เวลา (24 ชั่วโมง) <span className="text-rose-500">*</span>
        </label>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <select id={`${idPrefix}-ts`} aria-label="เวลาเริ่ม" value={timeStart} onChange={(e) => changeStart(e.target.value)} className={selectCls}>
            {!timeStart && <option value="">เวลาเริ่ม</option>}
            {startOptions.map((t) => (
              <option key={t} value={t}>
                {t} น.
              </option>
            ))}
          </select>
          <span className="text-stone-400 text-xs">ถึง</span>
          <select id={`${idPrefix}-te`} aria-label="เวลาสิ้นสุด" value={timeEnd} onChange={(e) => onTimeEndChange(e.target.value)} className={selectCls}>
            {(!timeEnd || timeEnd <= timeStart) && <option value={timeEnd || ''}>เวลาสิ้นสุด</option>}
            {endOptions.map((t) => (
              <option key={t} value={t}>
                {t} น.
              </option>
            ))}
          </select>
        </div>
        {durText && (
          <p className="text-[11px] text-stone-500 flex items-center gap-1">
            <Clock className="w-3 h-3" /> ระยะเวลา {durText}
          </p>
        )}
      </div>
    </div>
  );
};
