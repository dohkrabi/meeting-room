import React from 'react';
import {
  Users,
  Tv,
  Mic,
  Wifi,
  CalendarCheck,
  Clock,
  Sparkles,
  AlertCircle,
  Video,
  CheckCircle2,
} from 'lucide-react';
import { Booking } from '../types';
import { normalizeDate } from '../utils/thaiDate';

interface RoomHeroProps {
  bookings: Booking[];
  onOpenBook: () => void;
  onOpenRoomInfo: () => void;
}

export const RoomHero: React.FC<RoomHeroProps> = ({
  bookings,
  onOpenBook,
  onOpenRoomInfo,
}) => {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  const todayStr = `${y}-${m}-${d}`;

  const currentMinutes = today.getHours() * 60 + today.getMinutes();

  // Find meetings for today
  const todayBookings = bookings.filter(
    (b) => normalizeDate(b.date) === todayStr && b.status !== 'ยกเลิก'
  );

  // Check currently active meeting
  let activeMeeting: Booking | null = null;
  let nextMeeting: Booking | null = null;

  for (const b of todayBookings) {
    const [sh, sm] = b.time_start.split(':').map(Number);
    const [eh, em] = b.time_end.split(':').map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;

    if (currentMinutes >= startMin && currentMinutes < endMin) {
      activeMeeting = b;
      break;
    } else if (currentMinutes < startMin) {
      if (!nextMeeting) {
        nextMeeting = b;
      } else {
        const [nsh, nsm] = nextMeeting.time_start.split(':').map(Number);
        if (startMin < nsh * 60 + nsm) {
          nextMeeting = b;
        }
      }
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-linear-to-br from-indigo-900 via-indigo-800 to-indigo-950 text-white shadow-xl mb-8">
      {/* Decorative background effects */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-violet-500/15 rounded-full blur-2xl pointer-events-none"></div>

      <div className="relative px-6 py-8 md:px-10 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Column: Room identity & Features */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-medium text-indigo-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="font-semibold uppercase tracking-wider">ห้องประชุมใหญ่ ชั้น 3</span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white font-['Prompt',sans-serif] leading-tight">
              ห้องประชุม แขวงทางหลวงกระบี่
            </h2>

            <p className="text-sm md:text-base text-indigo-100/90 max-w-xl font-light leading-relaxed">
              รองรับการประชุมภายในองค์กร การประชุมออนไลน์ผ่าน Zoom / Video Conference
              พร้อมระบบภาพและเสียงครบวงจร
            </p>

            {/* Badges / Amenities */}
            <div className="flex flex-wrap gap-2.5 pt-1 text-xs text-indigo-100">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/10 border border-white/10">
                <Users className="w-3.5 h-3.5 text-indigo-300" />
                <span>รองรับ 20–30 ท่าน</span>
              </span>
              <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/10 border border-white/10">
                <Tv className="w-3.5 h-3.5 text-indigo-300" />
                <span>โปรเจกเตอร์ 120" & Smart TV</span>
              </span>
              <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/10 border border-white/10">
                <Mic className="w-3.5 h-3.5 text-indigo-300" />
                <span>ไมค์ประชุม & ไมค์ลอย</span>
              </span>
              <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/10 border border-white/10">
                <Video className="w-3.5 h-3.5 text-indigo-300" />
                <span>ระบบ Zoom / Conference</span>
              </span>
            </div>
          </div>

          {/* Right Column: Real-time Status Card */}
          <div className="lg:col-span-5">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 md:p-6 text-white space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-200 uppercase tracking-wider">
                  สถานะห้องประชุมวันนี้
                </span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/20 text-white">
                  วันนี้ {todayBookings.length} การจอง
                </span>
              </div>

              {activeMeeting ? (
                <div className="p-4 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-100 space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
                    <span className="text-xs font-bold text-amber-300 uppercase">
                      กำลังมีการประชุมอยู่ขณะนี้
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white line-clamp-1">
                    {activeMeeting.topic}
                  </h4>
                  <div className="text-xs text-amber-200/90 flex flex-wrap items-center gap-3">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {activeMeeting.time_start} – {activeMeeting.time_end} น.
                      </span>
                    </span>
                    <span>·</span>
                    <span>{activeMeeting.dept}</span>
                  </div>
                </div>
              ) : nextMeeting ? (
                <div className="p-4 rounded-xl bg-indigo-950/50 border border-white/10 space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                    <span className="text-xs font-bold text-emerald-300">
                      ห้องว่างอยู่ (การจองถัดไปเวลา {nextMeeting.time_start} น.)
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-white line-clamp-1">
                    {nextMeeting.topic}
                  </h4>
                  <div className="text-xs text-indigo-200 flex items-center space-x-2">
                    <span>{nextMeeting.dept}</span>
                    <span>·</span>
                    <span>{nextMeeting.attendees} ท่าน</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-100 space-y-1">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-300 uppercase">
                      ห้องว่างตลอดทั้งวัน
                    </span>
                  </div>
                  <p className="text-xs text-emerald-100/80">
                    ไม่มีการประชุมที่จัดไว้ในวันนี้ สามารถกดจองเพื่อใช้งานได้ทันที
                  </p>
                </div>
              )}

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={onOpenBook}
                  className="w-full py-2.5 px-3 rounded-xl bg-white text-indigo-900 font-bold text-xs sm:text-sm hover:bg-indigo-50 active:scale-98 transition flex items-center justify-center space-x-1.5 shadow-md"
                >
                  <CalendarCheck className="w-4 h-4 text-indigo-700" />
                  <span>จองทันที</span>
                </button>
                <button
                  onClick={onOpenRoomInfo}
                  className="w-full py-2.5 px-3 rounded-xl bg-white/15 hover:bg-white/25 text-white font-medium text-xs sm:text-sm transition flex items-center justify-center space-x-1.5 border border-white/20"
                >
                  <span>คู่มือการใช้งาน</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
