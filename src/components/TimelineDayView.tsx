import React, { useState } from 'react';
import { Clock, Video, Users, Building, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Booking } from '../types';
import { formatThaiDateWithDay, normalizeDate } from '../utils/thaiDate';

interface TimelineDayViewProps {
  bookings: Booking[];
  onBookOnDate: (dateStr: string, suggestedStart?: string) => void;
  onOpenAction: (action: 'edit' | 'cancel' | 'delete', booking: Booking) => void;
}

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

export const TimelineDayView: React.FC<TimelineDayViewProps> = ({
  bookings,
  onBookOnDate,
  onOpenAction,
}) => {
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(normalizeDate(d));
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(normalizeDate(d));
  };

  const handleToday = () => {
    const d = new Date();
    setSelectedDate(normalizeDate(d));
  };

  const dayBookings = bookings.filter(
    (b) => normalizeDate(b.date) === selectedDate && b.status !== 'ยกเลิก'
  );

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 md:p-6 mb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
        <div>
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-indigo-700" />
            <h3 className="text-base md:text-lg font-bold text-stone-900 font-['Prompt',sans-serif]">
              ไทม์ไลน์การใช้งานรายชั่วโมง
            </h3>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            {formatThaiDateWithDay(selectedDate)} · มีการจอง {dayBookings.length} รายการ
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition"
          >
            วันนี้
          </button>
          <div className="flex items-center rounded-lg border border-stone-200 overflow-hidden">
            <button
              onClick={handlePrevDay}
              title="วันก่อนหน้า"
              className="p-1.5 text-stone-600 hover:bg-indigo-50 hover:text-indigo-700 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="w-px h-4 bg-stone-200"></span>
            <button
              onClick={handleNextDay}
              title="วันถัดไป"
              className="p-1.5 text-stone-600 hover:bg-indigo-50 hover:text-indigo-700 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => onBookOnDate(selectedDate)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-800 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>จองวันนี้</span>
          </button>
        </div>
      </div>

      {/* Hourly Grid Visualizer */}
      <div className="pt-4 space-y-2">
        {HOURS.slice(0, -1).map((hour) => {
          const startHourStr = `${String(hour).padStart(2, '0')}:00`;
          const endHourStr = `${String(hour + 1).padStart(2, '0')}:00`;

          // Check if any booking overlaps with this 1-hour interval
          const overlappingBookings = dayBookings.filter((b) => {
            return b.time_start < endHourStr && b.time_end > startHourStr;
          });

          const isOccupied = overlappingBookings.length > 0;

          return (
            <div
              key={hour}
              className="flex items-start group min-h-[50px] border-b border-stone-100 pb-2"
            >
              {/* Hour Column */}
              <div className="w-16 sm:w-20 shrink-0 font-mono text-xs font-semibold text-stone-500 pt-1">
                {startHourStr}
              </div>

              {/* Slot Area */}
              <div className="flex-1">
                {isOccupied ? (
                  <div className="space-y-1.5">
                    {overlappingBookings.map((b, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                          b.status === 'ชนกัน'
                            ? 'bg-rose-50 border-rose-200 text-rose-900'
                            : 'bg-indigo-50/80 border-indigo-200/80 text-indigo-950'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-xs sm:text-sm">
                              {b.topic}
                            </span>
                            {b.use_zoom && (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700">
                                <Video className="w-3 h-3" />
                                <span>Zoom</span>
                              </span>
                            )}
                            {b.status === 'ชนกัน' && (
                              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-200 text-rose-800">
                                ชนกัน
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 text-xs text-stone-600">
                            <span className="font-semibold text-indigo-700">
                              ⏰ {b.time_start} – {b.time_end} น.
                            </span>
                            <span>·</span>
                            <span className="flex items-center space-x-1">
                              <Building className="w-3 h-3 text-stone-400" />
                              <span>{b.dept} ({b.name})</span>
                            </span>
                            <span>·</span>
                            <span className="flex items-center space-x-1">
                              <Users className="w-3 h-3 text-stone-400" />
                              <span>{b.attendees} ท่าน</span>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5 shrink-0 self-end sm:self-center">
                          <button
                            onClick={() => onOpenAction('edit', b)}
                            className="px-2 py-1 rounded bg-white hover:bg-stone-100 text-[11px] font-medium border border-stone-200 text-stone-700"
                          >
                            แก้ไข
                          </button>
                          <button
                            onClick={() => onOpenAction('cancel', b)}
                            className="px-2 py-1 rounded bg-white hover:bg-stone-100 text-[11px] font-medium border border-stone-200 text-amber-700"
                          >
                            ยกเลิก
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    onClick={() => onBookOnDate(selectedDate, startHourStr)}
                    className="h-10 rounded-xl border border-dashed border-stone-200 hover:border-indigo-400 hover:bg-indigo-50/40 transition-colors flex items-center px-3 text-xs text-stone-400 hover:text-indigo-700 cursor-pointer group"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span>ว่าง — คลิกเพื่อจองช่วง {startHourStr} – {endHourStr} น.</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
