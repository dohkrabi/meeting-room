import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Pencil,
  XCircle,
  Trash2,
  AlertTriangle,
  Check,
  Eye,
  EyeOff,
  Video,
  Save,
  KeyRound,
} from 'lucide-react';
import { Booking, DEPARTMENTS, EQUIPMENT_OPTIONS } from '../types';
import { formatThaiDate, normalizeDate, hashStr, ADMIN_PIN_HASH } from '../utils/thaiDate';
import { SwalIcon } from './SweetAlert';

interface ActionAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: 'edit' | 'cancel' | 'delete' | null;
  booking: Booking | null;
  onConfirmCancelOrDelete: (action: 'cancel' | 'delete', booking: Booking) => Promise<boolean>;
  onConfirmEdit: (updatedBooking: Booking) => Promise<boolean>;
}

export const ActionAuthModal: React.FC<ActionAuthModalProps> = ({
  isOpen,
  onClose,
  action,
  booking,
  onConfirmCancelOrDelete,
  onConfirmEdit,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Edit fields
  const [topic, setTopic] = useState('');
  const [date, setDate] = useState('');
  const [timeStart, setTimeStart] = useState('');
  const [timeEnd, setTimeEnd] = useState('');
  const [name, setName] = useState('');
  const [dept, setDept] = useState('');
  const [attendees, setAttendees] = useState<number | string>(10);
  const [equipment, setEquipment] = useState('');
  const [useZoom, setUseZoom] = useState(false);
  const [zoomUrl, setZoomUrl] = useState('');
  const [meetingId, setMeetingId] = useState('');
  const [passcode, setPasscode] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (isOpen && booking) {
      setIsAuthenticated(true); // ล็อกอินระดับระบบแล้ว — ข้ามขั้น PIN
      setPinInput('');
      setPinError('');
      setIsProcessing(false);

      // Populate edit fields
      setTopic(booking.topic || '');
      setDate(normalizeDate(booking.date) || '');
      setTimeStart(booking.time_start || '');
      setTimeEnd(booking.time_end || '');
      setName(booking.name || '');
      setDept(booking.dept || '');
      setAttendees(booking.attendees || 10);
      setEquipment(booking.equipment || '');
      setUseZoom(!!booking.use_zoom);
      setZoomUrl(booking.zoom_url || '');
      setMeetingId(booking.meeting_id || '');
      setPasscode(booking.passcode || '');
      setNote(booking.note || '');
    }
  }, [isOpen, booking]);

  if (!isOpen || !booking || !action) return null;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) {
      setPinError('กรุณากรอกรหัสผ่านเจ้าหน้าที่');
      return;
    }

    if (hashStr(pinInput.trim()) === ADMIN_PIN_HASH) {
      setIsAuthenticated(true);
      setPinError('');

      if (action === 'cancel' || action === 'delete') {
        executeDirectAction();
      }
    } else {
      setPinError('รหัสผ่านไม่ถูกต้อง');
    }
  };

  const executeDirectAction = async () => {
    if (action !== 'cancel' && action !== 'delete') return;
    setIsProcessing(true);
    const success = await onConfirmCancelOrDelete(action, booking);
    setIsProcessing(false);
    if (success) {
      onClose();
    } else {
      setPinError('การดำเนินการไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || !date || !timeStart || !timeEnd || !name.trim() || !dept) {
      setPinError('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
      return;
    }

    setIsProcessing(true);
    const updated: Booking = {
      ...booking,
      topic: topic.trim(),
      date: normalizeDate(date),
      time_start: timeStart,
      time_end: timeEnd,
      name: name.trim(),
      dept,
      attendees: Number(attendees) || 10,
      equipment: equipment.trim(),
      use_zoom: useZoom,
      zoom_url: zoomUrl.trim(),
      meeting_id: meetingId.trim(),
      passcode: passcode.trim(),
      note: note.trim(),
    };

    const success = await onConfirmEdit(updated);
    setIsProcessing(false);
    if (success) {
      onClose();
    } else {
      setPinError('บันทึกการแก้ไขไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    }
  };

  // หน้ายืนยันสำหรับ ยกเลิก/ลบ (login แล้ว ไม่ต้องใส่ PIN)
  if (action === 'cancel' || action === 'delete') {
    const swalIconType = action === 'cancel' ? 'warning' : 'error';
    const titleText =
      action === 'cancel' ? 'ยืนยันการยกเลิกการจอง?' : 'ยืนยันการลบรายการถาวร?';

    const subText =
      action === 'cancel'
        ? 'ต้องการยกเลิกช่วงเวลาการจองนี้ใช่หรือไม่?'
        : 'เมื่อลบแล้วรายการจะถูกซ่อนออกจากระบบ ต้องการดำเนินการต่อหรือไม่?';

    const confirmBtnColor =
      action === 'cancel'
        ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30'
        : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30';

    return (
      <div className="fixed inset-0 z-[60] overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 flex flex-col items-center text-center border border-stone-100 animate-in zoom-in-95 fade-in duration-200">
          {/* SweetAlert2 Animated Icon */}
          <SwalIcon type={swalIconType} size="lg" />

          <h3 className="text-xl sm:text-2xl font-bold text-stone-800 font-['Prompt',sans-serif] mt-3 tracking-tight">
            {titleText}
          </h3>

          <p className="text-xs sm:text-sm text-stone-600 mt-2 font-normal leading-relaxed">
            {subText}
          </p>

          {/* Booking Summary Box */}
          <div className="w-full mt-4 p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 text-left text-xs space-y-1 text-stone-700">
            <div className="font-bold text-stone-900 truncate">📋 {booking.topic}</div>
            <div>
              📅 {formatThaiDate(booking.date, false)} · ⏰ {booking.time_start} – {booking.time_end} น.
            </div>
            <div className="text-stone-500">
              👤 {booking.name} ({booking.dept})
            </div>
          </div>

          {/* ยืนยันตรงๆ (login แล้ว ไม่ต้องใส่รหัสซ้ำ) */}
          <div className="w-full mt-5">
            <div className="flex items-center justify-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="flex-1 py-2.5 px-4 rounded-xl bg-stone-200 hover:bg-stone-300 active:bg-stone-400 text-stone-700 font-semibold text-sm transition-all disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={executeDirectAction}
                disabled={isProcessing}
                className={`flex-1 py-2.5 px-4 rounded-xl text-white font-bold text-sm shadow-md transition-all transform active:scale-98 disabled:opacity-50 ${confirmBtnColor}`}
              >
                {isProcessing ? 'กำลังดำเนินการ...' : 'ยืนยัน'}
              </button>
            </div>
            {pinError && (
              <p className="text-xs text-rose-600 font-medium pt-3 text-center animate-in fade-in">
                {pinError}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // If authenticated and editing: Show Edit Modal
  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden border border-stone-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/80 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Pencil className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 font-['Prompt',sans-serif]">
                แก้ไขข้อมูลการจองห้องประชุม
              </h3>
              <p className="text-xs text-stone-500">กรุณาปรับปรุงข้อมูลและกดบันทึก</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 flex-1">
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                หัวข้อการประชุม <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  วันที่ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
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
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  ชื่อผู้จอง <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  หน่วยงาน / ฝ่าย <span className="text-rose-500">*</span>
                </label>
                <select
                  value={dept}
                  onChange={(e) => setDept(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  จำนวนผู้เข้าร่วม (คน)
                </label>
                <input
                  type="number"
                  value={attendees}
                  onChange={(e) => setAttendees(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  อุปกรณ์ที่ต้องการ
                </label>
                <input
                  type="text"
                  value={equipment}
                  onChange={(e) => setEquipment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Zoom checkbox */}
            <div className="pt-1">
              <label className="flex items-center space-x-2 text-xs text-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useZoom}
                  onChange={(e) => setUseZoom(e.target.checked)}
                  className="rounded text-indigo-600 w-4 h-4"
                />
                <span className="font-semibold flex items-center space-x-1">
                  <Video className="w-3.5 h-3.5 text-blue-600" />
                  <span>ใช้ระบบ Zoom / Video Conference</span>
                </span>
              </label>
            </div>

            {useZoom && (
              <div className="bg-blue-50/50 p-3 rounded-2xl border border-blue-100 space-y-2 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-0.5">
                    Zoom URL
                  </label>
                  <input
                    type="text"
                    value={zoomUrl}
                    onChange={(e) => setZoomUrl(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs bg-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-0.5">
                      Meeting ID
                    </label>
                    <input
                      type="text"
                      value={meetingId}
                      onChange={(e) => setMeetingId(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-0.5">
                      Passcode
                    </label>
                    <input
                      type="text"
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                หมายเหตุเพิ่มเติม
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {pinError && (
              <p className="text-xs font-medium text-rose-600 flex items-center space-x-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{pinError}</span>
              </p>
            )}

            <div className="pt-4 border-t border-stone-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-5 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-700 font-semibold text-xs transition"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center space-x-1.5 transition transform active:scale-98"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isProcessing ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
