import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Send,
  AlertTriangle,
  CheckCircle2,
  Video,
  Loader2,
  CalendarClock,
  ShieldCheck,
} from 'lucide-react';
import { Booking, DEPARTMENTS, EQUIPMENT_OPTIONS } from '../types';
import {
  checkAvailability,
  submitBookingRequest,
  BookingRequestPayload,
} from '../services/bookingService';
import { formatThaiDate, normalizeDate } from '../utils/thaiDate';

interface RequestBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}

type AvailState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'free' }
  | { status: 'busy'; conflict: any }
  | { status: 'error'; error: string };

export const RequestBookingModal: React.FC<RequestBookingModalProps> = ({
  isOpen,
  onClose,
  onSubmitted,
}) => {
  // Form fields
  const [name, setName] = useState('');
  const [dept, setDept] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');
  const [timeStart, setTimeStart] = useState('09:00');
  const [timeEnd, setTimeEnd] = useState('12:00');
  const [topic, setTopic] = useState('');
  const [attendees, setAttendees] = useState<number | string>('10');
  const [selectedEquipments, setSelectedEquipments] = useState<string[]>([]);
  const [customEquipment, setCustomEquipment] = useState('');
  const [useZoom, setUseZoom] = useState(false);
  const [zoomUrl, setZoomUrl] = useState('');
  const [meetingId, setMeetingId] = useState('');
  const [passcode, setPasscode] = useState('');
  const [note, setNote] = useState('');

  const [avail, setAvail] = useState<AvailState>({ status: 'idle' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [success, setSuccess] = useState<null | { topic: string; date: string; ts: string; te: string }>(null);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const d = String(today.getDate()).padStart(2, '0');
      setDate(`${y}-${m}-${d}`);
      setErrorMessage('');
      setSuccess(null);
      setAvail({ status: 'idle' });
    }
  }, [isOpen]);

  const timeValid = !!date && !!timeStart && !!timeEnd && timeStart < timeEnd;

  // Debounced server-side availability check (รวมคำขอที่รออนุมัติด้วย)
  useEffect(() => {
    if (!isOpen || success) return;
    if (!timeValid) {
      setAvail({ status: 'idle' });
      return;
    }
    let cancelled = false;
    setAvail({ status: 'checking' });
    const id = setTimeout(async () => {
      const res = await checkAvailability(date, timeStart, timeEnd);
      if (cancelled) return;
      if (!res.ok) setAvail({ status: 'error', error: res.error || 'ตรวจสอบไม่สำเร็จ' });
      else if (res.available) setAvail({ status: 'free' });
      else setAvail({ status: 'busy', conflict: res.conflict });
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [isOpen, success, date, timeStart, timeEnd, timeValid]);

  const phoneDigits = useMemo(() => phone.replace(/\D/g, ''), [phone]);
  const phoneValid = phoneDigits.length >= 9 && phoneDigits.length <= 10;

  if (!isOpen) return null;

  const toggleEquip = (item: string) => {
    setSelectedEquipments((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim() || !dept || !phone.trim() || !date || !timeStart || !timeEnd || !topic.trim()) {
      setErrorMessage('กรุณากรอกข้อมูลที่จำเป็น (*) ให้ครบถ้วน');
      return;
    }
    if (!phoneValid) {
      setErrorMessage('กรุณากรอกเบอร์ติดต่อให้ถูกต้อง (9–10 หลัก)');
      return;
    }
    if (timeStart >= timeEnd) {
      setErrorMessage('เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม');
      return;
    }
    if (avail.status === 'busy') {
      setErrorMessage('ช่วงเวลานี้ไม่ว่าง กรุณาเปลี่ยนวันหรือเวลา');
      return;
    }
    if (avail.status !== 'free') {
      setErrorMessage('กรุณารอระบบตรวจสอบห้องว่างให้เสร็จก่อนส่งคำขอ');
      return;
    }

    const allEquip = [...selectedEquipments];
    if (customEquipment.trim()) allEquip.push(customEquipment.trim());

    const payload: BookingRequestPayload = {
      name: name.trim(),
      dept,
      phone: phone.trim(),
      date: normalizeDate(date),
      time_start: timeStart,
      time_end: timeEnd,
      topic: topic.trim(),
      attendees: attendees ? Number(attendees) : 10,
      equipment: allEquip.join(', '),
      use_zoom: useZoom,
      zoom_url: zoomUrl.trim(),
      meeting_id: meetingId.trim(),
      passcode: passcode.trim(),
      note: note.trim(),
    };

    setIsSubmitting(true);
    const res = await submitBookingRequest(payload);
    setIsSubmitting(false);

    if (res.ok) {
      setSuccess({ topic: payload.topic, date: payload.date, ts: timeStart, te: timeEnd });
      if (onSubmitted) onSubmitted();
    } else if (res.code === 'SLOT_TAKEN') {
      setAvail({ status: 'busy', conflict: res.conflict });
      setErrorMessage(res.error || 'ช่วงเวลานี้เพิ่งถูกจอง กรุณาเลือกเวลาอื่น');
    } else {
      setErrorMessage(res.error || 'ส่งคำขอไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    }
  };

  const inputCls =
    'w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-teal-50/70 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-700 text-white flex items-center justify-center shadow-xs">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 font-['Prompt',sans-serif]">
                ขอใช้ห้องประชุม (สำหรับบุคคลทั่วไป)
              </h3>
              <p className="text-xs text-stone-500">
                ส่งคำขอเพื่อให้เจ้าหน้าที่ตรวจสอบและยืนยัน · แขวงทางหลวงกระบี่
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 flex-1">
          {success ? (
            /* Success screen */
            <div className="text-center py-6 space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-stone-900 font-['Prompt',sans-serif]">
                  ส่งคำขอเรียบร้อยแล้ว
                </h4>
                <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
                  คำขอของคุณถูกบันทึกและ <span className="font-semibold text-teal-700">กันช่วงเวลานี้ไว้ให้แล้ว</span> ระหว่างรอเจ้าหน้าที่ตรวจสอบและยืนยัน หากได้รับอนุมัติจะมีการแจ้งเข้ากลุ่มงาน
                </p>
              </div>
              <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 text-left space-y-2 text-xs sm:text-sm text-stone-700">
                <div className="font-bold text-teal-900 text-base">{success.topic}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-stone-200/80">
                  <div>
                    <span className="text-stone-400">วันที่: </span>
                    <span className="font-semibold">{formatThaiDate(success.date, false)}</span>
                  </div>
                  <div>
                    <span className="text-stone-400">เวลา: </span>
                    <span className="font-semibold text-teal-700">
                      {success.ts} – {success.te} น.
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-teal-700 text-white font-bold text-xs sm:text-sm hover:bg-teal-800 transition"
              >
                เรียบร้อย (ปิดหน้าต่าง)
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Section 1: หัวข้อ */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-teal-900 uppercase tracking-wider">
                  1. หัวข้อและรายละเอียดการประชุม
                </h4>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    หัวข้อการประชุม <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="เช่น ประชุมหารือแนวทางการดำเนินงานร่วมกับหน่วยงานภายนอก"
                    className={inputCls}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      จำนวนผู้เข้าร่วม (คน)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={attendees}
                      onChange={(e) => setAttendees(e.target.value)}
                      placeholder="เช่น 10"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      หน่วยงาน / สังกัด <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={dept}
                      onChange={(e) => setDept(e.target.value)}
                      className={inputCls + ' bg-white'}
                    >
                      <option value="">-- กรุณาเลือกหรือระบุหน่วยงาน --</option>
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                      <option value="หน่วยงานภายนอก">หน่วยงานภายนอก / อื่นๆ</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: วันเวลา + เช็กห้องว่าง */}
              <div className="space-y-3 pt-3 border-t border-stone-100">
                <h4 className="text-xs font-bold text-teal-900 uppercase tracking-wider">
                  2. วันและเวลาที่ต้องการใช้ห้อง
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      วันที่ <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      เวลาเริ่ม <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      step={60}
                      value={timeStart}
                      onChange={(e) => setTimeStart(e.target.value)}
                      className={inputCls + ' font-mono'}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      เวลาสิ้นสุด <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      step={60}
                      value={timeEnd}
                      onChange={(e) => setTimeEnd(e.target.value)}
                      className={inputCls + ' font-mono'}
                    />
                  </div>
                </div>

                {/* Availability banner */}
                <AvailabilityBanner avail={avail} timeValid={timeValid} />
              </div>

              {/* Section 3: ผู้ขอ + เบอร์ติดต่อ */}
              <div className="space-y-3 pt-3 border-t border-stone-100">
                <h4 className="text-xs font-bold text-teal-900 uppercase tracking-wider">
                  3. ข้อมูลผู้ขอใช้ห้อง / ผู้ประสานงาน
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      ชื่อ-นามสกุล <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="เช่น นายสมชาย ใจดี"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      เบอร์ติดต่อกลับ <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      inputMode="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="เช่น 081-234-5678"
                      className={
                        inputCls +
                        (phone && !phoneValid ? ' border-rose-300 focus:border-rose-500 focus:ring-rose-100' : '')
                      }
                    />
                    {phone && !phoneValid && (
                      <p className="text-[11px] text-rose-500 mt-1">กรุณากรอกเบอร์ 9–10 หลัก</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 4: อุปกรณ์ */}
              <div className="space-y-3 pt-3 border-t border-stone-100">
                <h4 className="text-xs font-bold text-teal-900 uppercase tracking-wider">
                  4. อุปกรณ์ที่ต้องการ (ถ้ามี)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {EQUIPMENT_OPTIONS.map((item) => {
                    const checked = selectedEquipments.includes(item);
                    return (
                      <label
                        key={item}
                        className={`flex items-center space-x-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                          checked
                            ? 'bg-teal-50 border-teal-300 text-teal-950 font-medium'
                            : 'bg-stone-50/50 border-stone-200 text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleEquip(item)}
                          className="rounded border-stone-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
                        />
                        <span className="select-none">{item}</span>
                      </label>
                    );
                  })}
                </div>
                <input
                  type="text"
                  value={customEquipment}
                  onChange={(e) => setCustomEquipment(e.target.value)}
                  placeholder="อุปกรณ์หรือความต้องการเพิ่มเติมอื่นๆ (ถ้ามี)..."
                  className={inputCls + ' bg-stone-50/50'}
                />
              </div>

              {/* Section 5: Zoom */}
              <div className="space-y-3 pt-3 border-t border-stone-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Video className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-bold text-teal-900 uppercase tracking-wider">
                      5. ประชุมออนไลน์ (Zoom / Video Conference)
                    </h4>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useZoom}
                      onChange={(e) => setUseZoom(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-stone-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                {useZoom && (
                  <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 space-y-3">
                    <input
                      type="url"
                      value={zoomUrl}
                      onChange={(e) => setZoomUrl(e.target.value)}
                      placeholder="ลิงก์ Zoom / Google Meet (ถ้ามี)"
                      className={inputCls + ' bg-white font-mono'}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={meetingId}
                        onChange={(e) => setMeetingId(e.target.value)}
                        placeholder="Meeting ID"
                        className={inputCls + ' bg-white font-mono'}
                      />
                      <input
                        type="text"
                        value={passcode}
                        onChange={(e) => setPasscode(e.target.value)}
                        placeholder="Passcode"
                        className={inputCls + ' bg-white font-mono'}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Section 6: หมายเหตุ */}
              <div className="space-y-3 pt-3 border-t border-stone-100">
                <h4 className="text-xs font-bold text-teal-900 uppercase tracking-wider">
                  6. หมายเหตุถึงเจ้าหน้าที่
                </h4>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="ข้อความเพิ่มเติมถึงเจ้าหน้าที่ (ถ้ามี)..."
                  className={inputCls}
                />
              </div>

              {/* Submit */}
              <div className="pt-4 border-t border-stone-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || avail.status !== 'free' || !phoneValid}
                  className="px-6 py-2.5 rounded-xl bg-teal-700 text-white text-xs sm:text-sm font-bold hover:bg-teal-800 active:bg-teal-900 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-teal-700/20 transition flex items-center space-x-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>{isSubmitting ? 'กำลังส่งคำขอ...' : 'ส่งคำขอใช้ห้องประชุม'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// แถบสถานะห้องว่าง
const AvailabilityBanner: React.FC<{ avail: AvailState; timeValid: boolean }> = ({
  avail,
  timeValid,
}) => {
  if (!timeValid) {
    return (
      <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-500 text-xs flex items-center space-x-2">
        <CalendarClock className="w-4 h-4 shrink-0" />
        <span>เลือกวันและเวลาให้ถูกต้อง ระบบจะตรวจสอบห้องว่างอัตโนมัติ</span>
      </div>
    );
  }
  if (avail.status === 'checking') {
    return (
      <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-600 text-xs flex items-center space-x-2">
        <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
        <span>กำลังตรวจสอบห้องว่าง...</span>
      </div>
    );
  }
  if (avail.status === 'free') {
    return (
      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center space-x-2">
        <ShieldCheck className="w-4 h-4 shrink-0" />
        <span>ช่วงเวลานี้ว่าง — ส่งคำขอได้</span>
      </div>
    );
  }
  if (avail.status === 'busy') {
    const c = avail.conflict;
    return (
      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs space-y-1">
        <div className="font-bold flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>ช่วงเวลานี้ไม่ว่าง{c && c.kind ? ` (${c.kind})` : ''}</span>
        </div>
        {c && (c.topic || c.time_start) && (
          <div className="pl-6 text-rose-600/90">
            {c.topic ? `📋 ${c.topic}` : ''}
            {c.time_start ? ` · ⏰ ${c.time_start} – ${c.time_end} น.` : ''}
          </div>
        )}
        <p className="pl-6 text-[11px] italic">กรุณาเปลี่ยนวันหรือช่วงเวลา</p>
      </div>
    );
  }
  // error
  return (
    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs flex items-center space-x-2">
      <AlertTriangle className="w-4 h-4 shrink-0" />
      <span>ตรวจสอบห้องว่างไม่สำเร็จ: {avail.error} — ลองปรับเวลาอีกครั้ง</span>
    </div>
  );
};
