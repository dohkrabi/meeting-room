import React, { useState } from 'react';
import { X, Copy, Check, Share2, MessageSquare, CheckCircle2 } from 'lucide-react';
import { Booking, ROOM_INFO } from '../types';
import { formatThaiDateWithDay, formatThaiDate } from '../utils/thaiDate';

interface LineInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
}

export const LineInviteModal: React.FC<LineInviteModalProps> = ({
  isOpen,
  onClose,
  booking,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !booking) return null;

  const dateLabel = formatThaiDateWithDay(booking.date);

  const lineText = [
    `📢 แจ้งกำหนดการประชุม`,
    `🏢 ${ROOM_INFO.name} (${ROOM_INFO.floor})`,
    `📋 เรื่อง: ${booking.topic}`,
    `👤 ผู้จอง/หน่วยงาน: ${booking.name} — ${booking.dept}`,
    `📅 วันที่: ${dateLabel}`,
    `⏰ เวลา: ${booking.time_start} – ${booking.time_end} น.`,
    `👥 จำนวนผู้เข้าร่วม: ${booking.attendees} ท่าน`,
    booking.equipment ? `🔧 อุปกรณ์: ${booking.equipment}` : '',
    booking.use_zoom
      ? `📹 ประชุมออนไลน์ (Zoom): ${booking.zoom_url || 'ใช้ระบบ Zoom'}\n🆔 Meeting ID: ${
          booking.meeting_id || '—'
        }\n🔑 Passcode: ${booking.passcode || '—'}`
      : '📍 ประชุม ณ ห้องประชุม ชั้น 3',
    booking.note ? `📝 หมายเหตุ: ${booking.note}` : '',
    ``,
    `🔗 ตรวจสอบปฏิทินห้องประชุมออนไลน์: แขวงทางหลวงกระบี่`,
  ]
    .filter((line) => line !== '')
    .join('\n');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(lineText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = lineText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-emerald-50/70 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-stone-900 font-['Prompt',sans-serif]">
                ข้อความแจ้งเตือนสำหรับ LINE กลุ่ม
              </h3>
              <p className="text-xs text-stone-500">คัดลอกข้อความไปวางใน LINE ได้ทันที</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="relative">
            <textarea
              readOnly
              rows={11}
              value={lineText}
              className="w-full p-4 rounded-xl border border-stone-200 bg-stone-50 text-xs sm:text-sm font-sans leading-relaxed text-stone-800 focus:outline-none select-all"
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-100"
            >
              ปิด
            </button>
            <button
              onClick={handleCopy}
              className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs sm:text-sm flex items-center space-x-2 transition shadow-md ${
                copied
                  ? 'bg-emerald-700 shadow-emerald-700/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>คัดลอกเรียบร้อยแล้ว!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>คัดลอกข้อความทั้งหมด</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
