import React, { useState, useEffect } from 'react';
import {
  X,
  CalendarPlus,
  AlertTriangle,
  CheckCircle2,
  Video,
  Clock,
  Building,
  User,
  Users,
  Wrench,
  FileText,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Check,
} from 'lucide-react';
import { Booking, DEPARTMENTS, EQUIPMENT_OPTIONS } from '../types';
import { findConflict } from '../services/bookingService';
import { formatThaiDate, normalizeDate, hashStr, ADMIN_PIN_HASH } from '../utils/thaiDate';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (booking: Omit<Booking, 'row' | 'status'>) => Promise<boolean>;
  existingBookings: Booking[];
  initialDate?: string;
  initialStartTime?: string;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingBookings,
  initialDate,
  initialStartTime,
}) => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState('');

  // Form Fields
  const [name, setName] = useState('');
  const [dept, setDept] = useState('');
  const [date, setDate] = useState('');
  const [timeStart, setTimeStart] = useState('09:00');
  const [timeEnd, setTimeEnd] = useState('12:00');
  const [topic, setTopic] = useState('');
  const [attendees, setAttendees] = useState<number | string>('15');
  const [selectedEquipments, setSelectedEquipments] = useState<string[]>([]);
  const [customEquipment, setCustomEquipment] = useState('');
  const [useZoom, setUseZoom] = useState(false);
  const [zoomUrl, setZoomUrl] = useState('');
  const [meetingId, setMeetingId] = useState('');
  const [passcode, setPasscode] = useState('');
  const [note, setNote] = useState('');

  // Form Validation & Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successBooking, setSuccessBooking] = useState<Booking | null>(null);

  // Initialize dates
  useEffect(() => {
    if (isOpen) {
      setIsAuthenticated(true); // ล็อกอินระดับระบบแล้ว — ข้ามขั้น PIN
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const d = String(today.getDate()).padStart(2, '0');
      const defaultDate = initialDate || `${y}-${m}-${d}`;
      setDate(defaultDate);

      if (initialStartTime) {
        setTimeStart(initialStartTime);
        const [h, min] = initialStartTime.split(':').map(Number);
        const endHour = Math.min(h + 2, 18);
        setTimeEnd(`${String(endHour).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
      }

      setErrorMessage('');
      setSuccessBooking(null);
    }
  }, [isOpen, initialDate, initialStartTime]);

  if (!isOpen) return null;

  // Real-time conflict check
  const conflict = findConflict(existingBookings, normalizeDate(date), timeStart, timeEnd);

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) {
      setPinError('กรุณากรอกรหัสผ่านเจ้าหน้าที่');
      return;
    }

    if (hashStr(pinInput.trim()) === ADMIN_PIN_HASH) {
      setIsAuthenticated(true);
      setPinError('');
    } else {
      setPinError('รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
    }
  };

  const handleEquipmentToggle = (item: string) => {
    if (selectedEquipments.includes(item)) {
      setSelectedEquipments(selectedEquipments.filter((x) => x !== item));
    } else {
      setSelectedEquipments([...selectedEquipments, item]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !dept || !date || !timeStart || !timeEnd || !topic.trim()) {
      setErrorMessage('กรุณากรอกข้อมูลที่จำเป็น (*) ให้ครบถ้วน');
      return;
    }

    if (timeStart >= timeEnd) {
      setErrorMessage('เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มการประชุม');
      return;
    }

    if (conflict) {
      setErrorMessage(
        `ไม่สามารถจองได้ เนื่องจากเวลาซ้อนทับกับการประชุม: "${conflict.topic}" (${conflict.time_start} - ${conflict.time_end} น.)`
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    // Combine equipment
    const allEquip = [...selectedEquipments];
    if (customEquipment.trim()) {
      allEquip.push(customEquipment.trim());
    }

    const payload: Omit<Booking, 'row' | 'status'> = {
      name: name.trim(),
      dept,
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

    const result = await onSave(payload);
    setIsSubmitting(false);

    if (result) {
      setSuccessBooking({
        ...payload,
        status: 'จอง',
      });
    } else {
      setErrorMessage('บันทึกไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อและลองใหม่อีกครั้ง');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-700 text-white flex items-center justify-center shadow-xs">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 font-['Prompt',sans-serif]">
                แบบฟอร์มจองห้องประชุม ชั้น 3
              </h3>
              <p className="text-xs text-stone-500">แขวงทางหลวงกระบี่ · กรมทางหลวง</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-6 flex-1">
          {/* Step 1: Security PIN verification (if not yet authed) */}
          {!isAuthenticated ? (
            <div className="max-w-md mx-auto text-center py-6 space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 mx-auto shadow-xs">
                <Lock className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-stone-900 font-['Prompt',sans-serif]">
                  ยืนยันตัวตนเจ้าหน้าที่ก่อนจอง
                </h4>
                <p className="text-xs sm:text-sm text-stone-500 mt-1">
                  กรุณากรอกรหัสผ่านของระบบเพื่อเข้าถึงแบบฟอร์มบันทึกการจอง
                </p>
              </div>

              <form onSubmit={handleVerifyPin} className="space-y-3.5 text-left">
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="กรอกรหัสผ่านเจ้าหน้าที่"
                    className="w-full pl-4 pr-11 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 font-mono"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {pinError && (
                  <p className="text-xs font-medium text-rose-600 flex items-center space-x-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{pinError}</span>
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-indigo-700 text-white font-bold text-sm hover:bg-indigo-800 transition shadow-md shadow-indigo-700/20 flex items-center justify-center space-x-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>ยืนยันและเปิดแบบฟอร์ม</span>
                </button>
              </form>

              <div className="pt-2 text-xs text-stone-400">
                แขวงทางหลวงกระบี่ · งานสารสนเทศ
              </div>
            </div>
          ) : successBooking ? (
            /* Step 3: Success Screen */
            <div className="text-center py-6 space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-stone-900 font-['Prompt',sans-serif]">
                  บันทึกการจองห้องประชุมสำเร็จ!
                </h4>
                <p className="text-xs text-stone-500 mt-1">
                  ระบบได้บันทึกข้อมูลเรียบร้อยแล้ว และส่งสัญญาณแจ้งเตือนไปยังระบบงาน
                </p>
              </div>

              {/* Summary Card */}
              <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 text-left space-y-2 text-xs sm:text-sm text-stone-700">
                <div className="font-bold text-indigo-900 text-base">{successBooking.topic}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-stone-200/80">
                  <div>
                    <span className="text-stone-400">วันที่: </span>
                    <span className="font-semibold">{formatThaiDate(successBooking.date, false)}</span>
                  </div>
                  <div>
                    <span className="text-stone-400">เวลา: </span>
                    <span className="font-semibold text-indigo-700">
                      {successBooking.time_start} – {successBooking.time_end} น.
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400">หน่วยงาน: </span>
                    <span className="font-semibold">{successBooking.dept}</span>
                  </div>
                  <div>
                    <span className="text-stone-400">ผู้จอง: </span>
                    <span className="font-semibold">{successBooking.name}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-700 text-white font-bold text-xs sm:text-sm hover:bg-indigo-800 transition"
                >
                  เรียบร้อย (ปิดหน้าต่าง)
                </button>
              </div>
            </div>
          ) : (
            /* Step 2: Main Booking Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Conflict Alert Banner */}
              {conflict && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-2 animate-shake">
                  <div className="flex items-center space-x-2 font-bold text-xs sm:text-sm text-rose-700">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>แจ้งเตือน: ช่วงเวลานี้มีการจองห้องประชุมอยู่แล้ว</span>
                  </div>
                  <div className="text-xs text-rose-700/90 pl-6 space-y-0.5">
                    <p className="font-semibold">📋 {conflict.topic}</p>
                    <p>
                      👤 {conflict.name} — {conflict.dept}
                    </p>
                    <p>
                      ⏰ {conflict.time_start} – {conflict.time_end} น.
                    </p>
                  </div>
                  <p className="text-[11px] text-rose-600 pl-6 italic">
                    * กรุณาเปลี่ยนเวลาเริ่มหรือเวลาสิ้นสุดเพื่อไม่ให้ซ้อนทับกัน
                  </p>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Section 1: Meeting Agenda */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                  1. หัวข้อและรายละเอียดการประชุม
                </h4>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    หัวข้อการประชุม / วาระการประชุม <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="เช่น ประชุมติดตามผลการดำเนินงานโครงการประจำปีงบประมาณ"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      จำนวนผู้เข้าร่วม (คน) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={60}
                      value={attendees}
                      onChange={(e) => setAttendees(e.target.value)}
                      placeholder="เช่น 15"
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      หน่วยงาน / ฝ่ายที่ขอใช้ห้อง <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={dept}
                      onChange={(e) => setDept(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:border-indigo-600 bg-white"
                    >
                      <option value="">-- กรุณาเลือกหน่วยงาน --</option>
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Date & Time */}
              <div className="space-y-3 pt-3 border-t border-stone-100">
                <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                  2. วันและเวลาที่ต้องการใช้ห้อง
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      วันที่ประชุม <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      เวลาเริ่ม (24 ชม.) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      step={60}
                      value={timeStart}
                      onChange={(e) => setTimeStart(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:border-indigo-600 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      เวลาสิ้นสุด (24 ชม.) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      step={60}
                      value={timeEnd}
                      onChange={(e) => setTimeEnd(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:border-indigo-600 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Contact Person */}
              <div className="space-y-3 pt-3 border-t border-stone-100">
                <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                  3. ข้อมูลผู้จอง / ผู้ประสานงาน
                </h4>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    ชื่อ-นามสกุล ผู้จอง / ตำแหน่ง <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="เช่น นายธนวัฒน์ พรหมมา (หน.ฝ่าย)"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* Section 4: Equipment & Amenities */}
              <div className="space-y-3 pt-3 border-t border-stone-100">
                <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                  4. อุปกรณ์และสิ่งอำนวยความสะดวก
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {EQUIPMENT_OPTIONS.map((item) => {
                    const isChecked = selectedEquipments.includes(item);
                    return (
                      <label
                        key={item}
                        className={`flex items-center space-x-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                          isChecked
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-950 font-medium'
                            : 'bg-stone-50/50 border-stone-200 text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleEquipmentToggle(item)}
                          className="rounded border-stone-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                        />
                        <span className="select-none">{item}</span>
                      </label>
                    );
                  })}
                </div>

                <div>
                  <input
                    type="text"
                    value={customEquipment}
                    onChange={(e) => setCustomEquipment(e.target.value)}
                    placeholder="อุปกรณ์หรือความต้องการเพิ่มเติมอื่นๆ (ถ้ามี)..."
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-indigo-600 bg-stone-50/50"
                  />
                </div>
              </div>

              {/* Section 5: Video Conference (Zoom / Online) */}
              <div className="space-y-3 pt-3 border-t border-stone-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Video className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                      5. การประชุมออนไลน์ (Zoom / Video Conference)
                    </h4>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useZoom}
                      onChange={(e) => setUseZoom(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {useZoom && (
                  <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 space-y-3 animate-in fade-in">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        ลิงก์เข้าร่วมประชุม (Zoom / Google Meet URL)
                      </label>
                      <input
                        type="url"
                        value={zoomUrl}
                        onChange={(e) => setZoomUrl(e.target.value)}
                        placeholder="https://zoom.us/j/1234567890"
                        className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:border-blue-600 bg-white font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          Meeting ID
                        </label>
                        <input
                          type="text"
                          value={meetingId}
                          onChange={(e) => setMeetingId(e.target.value)}
                          placeholder="เช่น 842 1938 5721"
                          className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:border-blue-600 bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          Passcode / รหัสผ่าน
                        </label>
                        <input
                          type="text"
                          value={passcode}
                          onChange={(e) => setPasscode(e.target.value)}
                          placeholder="เช่น doh343"
                          className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:border-blue-600 bg-white font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 6: Additional Notes */}
              <div className="space-y-3 pt-3 border-t border-stone-100">
                <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                  6. หมายเหตุและข้อความแจ้งเจ้าหน้าที่
                </h4>
                <div>
                  <textarea
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="เช่น ขอให้เปิดเครื่องปรับอากาศล่วงหน้า 15 นาที, มีผู้บริหารจากส่วนกลางร่วมประชุม ฯลฯ"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:border-indigo-600"
                  ></textarea>
                </div>
              </div>

              {/* Submit Buttons */}
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
                  disabled={isSubmitting || !!conflict}
                  className="px-6 py-2.5 rounded-xl bg-indigo-700 text-white text-xs sm:text-sm font-bold hover:bg-indigo-800 active:bg-indigo-900 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-700/20 transition flex items-center space-x-2"
                >
                  <CalendarPlus className="w-4 h-4" />
                  <span>{isSubmitting ? 'กำลังบันทึกข้อมูล...' : 'ยืนยันการจองห้องประชุม'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
