import React, { useState } from 'react';
import {
  X,
  Bell,
  CheckCircle2,
  Clock,
  AlertCircle,
  Send,
  Sparkles,
  Smartphone,
  Copy,
  Check,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Booking, NOTIFICATION_RULES, ROOM_INFO } from '../types';
import { formatThaiDateWithDay, formatThaiDate } from '../utils/thaiDate';
import { sendTestNotification } from '../services/bookingService';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sampleBooking?: Booking | null;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  sampleBooking,
}) => {
  const [activeType, setActiveType] = useState<'on_book' | '1_day' | '1_hour' | '30_min'>('on_book');
  const [testingType, setTestingType] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ msg: string; isError?: boolean } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Use either the provided sample booking or standard demo data
  const b: Booking = sampleBooking || {
    topic: 'ประชุมติดตามความคืบหน้าโครงการบำรุงทางหลวง ประจำปีงบประมาณ',
    dept: 'งานแผนงาน',
    name: 'นายสมศักดิ์ รักชาติ (หน.งาน)',
    date: new Date().toISOString().split('T')[0],
    time_start: '09:00',
    time_end: '12:00',
    attendees: 15,
    equipment: 'โปรเจกเตอร์ & จอรับภาพ 120 นิ้ว, ไมโครโฟนตั้งโต๊ะ / ไมค์ลอย',
    use_zoom: true,
    zoom_url: 'https://zoom.us/j/84219385721',
    meeting_id: '842 1938 5721',
    passcode: 'doh343',
    note: 'เตรียมเอกสารงบประมาณประกอบการประชุมล่วงหน้า',
    status: 'จอง',
  };

  const dateLabel = formatThaiDateWithDay(b.date);

  // Generate the 4 exact notification texts
  const NOTIFICATION_MESSAGES: Record<'on_book' | '1_day' | '1_hour' | '30_min', string> = {
    on_book: [
      `✅ จองห้องประชุมสำเร็จ`,
      ``,
      `🏢 ${ROOM_INFO.name} (${ROOM_INFO.floor})`,
      `📋 หัวข้อ: ${b.topic}`,
      `👤 ผู้จอง: ${b.name} — ${b.dept}`,
      `📅 วันที่: ${dateLabel}`,
      `⏰ เวลา: ${b.time_start} – ${b.time_end} น.`,
      `👥 ผู้เข้าร่วม: ${b.attendees} คน`,
      b.equipment ? `🔧 อุปกรณ์: ${b.equipment}` : '',
      b.use_zoom
        ? `📹 รูปแบบ: ใช้ระบบ Zoom\n🔗 ลิงก์: ${b.zoom_url || 'https://zoom.us'}\n🆔 Meeting ID: ${
            b.meeting_id || '—'
          }\n🔑 Passcode: ${b.passcode || '—'}`
        : '📍 ประชุม ณ ห้องประชุม ชั้น 3',
      b.note ? `📝 หมายเหตุ: ${b.note}` : '',
    ]
      .filter(Boolean)
      .join('\n'),

    '1_day': [
      `🔔 แจ้งเตือน: มีการประชุมในวันพรุ่งนี้`,
      ``,
      `🏢 ${ROOM_INFO.name} (${ROOM_INFO.floor})`,
      `📋 เรื่อง: ${b.topic}`,
      `👤 ผู้จอง: ${b.name} — ${b.dept}`,
      `📅 วันที่: ${dateLabel}`,
      `⏰ เวลา: ${b.time_start} – ${b.time_end} น.`,
      `👥 ผู้เข้าร่วม: ${b.attendees} คน`,
      b.equipment ? `🔧 อุปกรณ์: ${b.equipment}` : '',
      b.use_zoom
        ? `📹 ลิงก์ Zoom: ${b.zoom_url || 'https://zoom.us'}\n🆔 ID: ${b.meeting_id || '—'}  Pass: ${
            b.passcode || '—'
          }`
        : '📍 ประชุมในห้องประชุม ชั้น 3',
      ``,
      `*กรุณาเตรียมเอกสารประกอบการประชุมล่วงหน้า*`,
    ]
      .filter(Boolean)
      .join('\n'),

    '1_hour': [
      `🔔 แจ้งเตือน: การประชุมจะเริ่มในอีก 1 ชั่วโมง`,
      ``,
      `🏢 ${ROOM_INFO.name} (${ROOM_INFO.floor})`,
      `📋 เรื่อง: ${b.topic}`,
      `👤 ผู้จอง: ${b.name} — ${b.dept}`,
      `📅 วันที่: ${dateLabel}`,
      `⏰ เวลา: ${b.time_start} – ${b.time_end} น.`,
      `👥 ผู้เข้าร่วม: ${b.attendees} คน`,
      b.equipment ? `🔧 อุปกรณ์ที่ขอใช้: ${b.equipment}` : '',
      b.use_zoom
        ? `📹 Zoom Meeting: ${b.zoom_url || 'https://zoom.us'}\n🆔 Meeting ID: ${
            b.meeting_id || '—'
          }\n🔑 Passcode: ${b.passcode || '—'}`
        : '',
      ``,
      `*เจ้าหน้าที่เตรียมความพร้อมห้องประชุม*`,
    ]
      .filter(Boolean)
      .join('\n'),

    '30_min': [
      `⏰ แจ้งเตือนด่วน: การประชุมจะเริ่มในอีก 30 นาที`,
      ``,
      `🏢 ${ROOM_INFO.name} (${ROOM_INFO.floor})`,
      `📋 เรื่อง: ${b.topic}`,
      `👤 ผู้จอง: ${b.name} — ${b.dept}`,
      `📅 วันนี้ เวลา: ${b.time_start} – ${b.time_end} น.`,
      b.equipment ? `🔧 อุปกรณ์: ${b.equipment}` : '',
      b.use_zoom
        ? `📹 ลิงก์เข้า Zoom ทันที: ${b.zoom_url || 'https://zoom.us'}\n🆔 ID: ${
            b.meeting_id || '—'
          }  Pass: ${b.passcode || '—'}`
        : '',
      ``,
      `⚡ *กรุณาเปิดเครื่องปรับอากาศและทดสอบไมค์/โปรเจกเตอร์ก่อนเริ่มประชุม*`,
    ]
      .filter(Boolean)
      .join('\n'),
  };

  const handleTestSend = async (type: 'on_book' | '1_day' | '1_hour' | '30_min') => {
    setTestingType(type);
    setTestResult(null);

    const res = await sendTestNotification(type, b);
    setTestingType(null);
    setTestResult({
      msg: res.ok
        ? `ส่งการแจ้งเตือน "${NOTIFICATION_RULES.find((r) => r.id === type)?.title}" สำเร็จ!`
        : 'การส่งล้มเหลว กรุณาตรวจสอบ LINE Token ใน Apps Script',
      isError: !res.ok,
    });

    setTimeout(() => setTestResult(null), 4000);
  };

  const handleCopyMessage = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/80 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-700 text-white flex items-center justify-center shadow-xs">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 font-['Prompt',sans-serif]">
                ระบบแจ้งเตือนอัตโนมัติ 4 ระดับ (LINE Notification)
              </h3>
              <p className="text-xs text-stone-500">
                แขวงทางหลวงกระบี่ · แจ้งเตือนเข้า LINE กลุ่มงานอัตโนมัติตามกำหนดเวลา
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1 text-xs sm:text-sm text-stone-700">
          {/* Overview of 4 Notification Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {NOTIFICATION_RULES.map((rule, idx) => {
              const isSelected = activeType === rule.id;
              return (
                <div
                  key={rule.id}
                  onClick={() => setActiveType(rule.id)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'bg-stone-50/60 border-stone-200 hover:bg-stone-100/60'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-indigo-900 border border-stone-200">
                        ลำดับที่ {idx + 1}
                      </span>
                      {idx === 0 && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      {idx === 1 && <Bell className="w-4 h-4 text-blue-600" />}
                      {idx === 2 && <Clock className="w-4 h-4 text-amber-600" />}
                      {idx === 3 && <Zap className="w-4 h-4 text-rose-600" />}
                    </div>
                    <div className="font-bold text-sm text-stone-900 pt-1">{rule.title}</div>
                    <div className="text-[11px] font-medium text-indigo-700">{rule.timing}</div>
                    <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed">
                      {rule.description}
                    </p>
                  </div>

                  <div className="pt-3 mt-2 border-t border-stone-200/60 flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-stone-400">
                      {isSelected ? 'กำลังดูข้อความ' : 'คลิกเพื่อดู'}
                    </span>
                    <span className="text-[10px] text-indigo-700 font-bold">ดูตัวอย่าง →</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Test Status Banner */}
          {testResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center space-x-2 animate-in fade-in ${
                testResult.isError
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{testResult.msg}</span>
            </div>
          )}

          {/* Selected Notification Preview Card */}
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/80 pb-3">
              <div className="flex items-center space-x-2">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <h4 className="font-bold text-stone-900 text-sm">
                  ตัวอย่างข้อความแจ้งเตือน: {NOTIFICATION_RULES.find((r) => r.id === activeType)?.title}
                </h4>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                  {NOTIFICATION_RULES.find((r) => r.id === activeType)?.timing}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleCopyMessage(NOTIFICATION_MESSAGES[activeType])}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition shadow-xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอกข้อความ'}</span>
                </button>

                <button
                  onClick={() => handleTestSend(activeType)}
                  disabled={testingType === activeType}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition shadow-xs disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {testingType === activeType ? 'กำลังส่งทดสอบ...' : 'ทดสอบส่งแจ้งเตือน'}
                  </span>
                </button>
              </div>
            </div>

            {/* Line Chat Simulator Box */}
            <div className="bg-[#85B2D6] rounded-2xl p-4 sm:p-5 max-w-lg mx-auto shadow-inner">
              <div className="flex items-start space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-indigo-700 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
                  DOH
                </div>
                <div className="space-y-1 max-w-[85%]">
                  <div className="text-[11px] font-semibold text-stone-800">
                    บอทจองห้องประชุม · แขวงทางหลวงกระบี่
                  </div>
                  <div className="bg-white rounded-2xl rounded-tl-none p-3.5 text-xs text-stone-900 shadow-md whitespace-pre-wrap font-sans leading-relaxed border border-stone-100">
                    {NOTIFICATION_MESSAGES[activeType]}
                  </div>
                  <div className="text-[10px] text-stone-700/80 font-mono pl-1">
                    ส่งอัตโนมัติผ่าน LINE Messaging API
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trigger & Automation Mechanism Explanation */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-2 text-xs">
            <h4 className="font-bold text-indigo-950 flex items-center space-x-1.5 text-sm">
              <Sparkles className="w-4 h-4 text-indigo-700" />
              <span>การทำงานของระบบแจ้งเตือนอัตโนมัติใน Google Apps Script</span>
            </h4>
            <p className="text-stone-600 leading-relaxed">
              ฟังก์ชัน <code>checkAndNotify()</code> ในไฟล์ Apps Script จะทำงานผ่าน <strong>Time-driven Trigger ทุกๆ 10 นาที</strong> เพื่อตรวจสอบแถวการจองใน Google Sheets:
            </p>
            <ul className="list-disc list-inside space-y-1 text-stone-700 pl-2">
              <li>
                <strong>1. เมื่อจองสำเร็จ:</strong> ส่งทันทีที่บันทึกข้อมูล และบันทึกสถานะ <code>TRUE</code> ในคอลัมน์ P (แจ้ง_จองสำเร็จ)
              </li>
              <li>
                <strong>2. ล่วงหน้า 1 วัน:</strong> ตรวจสอบช่วง 23–24.5 ชม. ก่อนเริ่มประชุม (คอลัมน์ Q: แจ้ง_1วัน)
              </li>
              <li>
                <strong>3. ล่วงหน้า 1 ชม.:</strong> ตรวจสอบช่วง 45–75 นาทีก่อนเริ่มประชุม (คอลัมน์ R: แจ้ง_1ชม)
              </li>
              <li>
                <strong>4. ล่วงหน้า 30 นาที:</strong> ตรวจสอบช่วง 15–35 นาทีก่อนเริ่มประชุม (คอลัมน์ S: แจ้ง_30นาที)
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-100 flex items-center justify-between bg-stone-50/80 shrink-0">
          <span className="text-xs text-stone-500">
            ระบบทำงานอัตโนมัติ 24 ชม. ผ่าน Google Cloud/Apps Script
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-semibold text-xs transition"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
