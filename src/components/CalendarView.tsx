import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Video,
  AlertTriangle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Booking } from '../types';
import { TH_MONTHS_FULL, TH_DAYS_SHORT, normalizeDate } from '../utils/thaiDate';

interface CalendarViewProps {
  bookings: Booking[];
  onSelectDate: (dateStr: string) => void;
  onBookOnDate: (dateStr: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  bookings,
  onSelectDate,
  onBookOnDate,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(today.getDate()).padStart(2, '0')}`;

  // Month stats
  const currentMonthBookings = bookings.filter((b) => {
    const d = normalizeDate(b.date);
    if (!d) return false;
    const parts = d.split('-');
    return (
      Number(parts[0]) === year &&
      Number(parts[1]) === month + 1 &&
      b.status !== 'ยกเลิก'
    );
  });

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 md:p-6 mb-8">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-bold text-stone-900 font-['Prompt',sans-serif]">
              {TH_MONTHS_FULL[month]} {year + 543}
            </h3>
            <p className="text-xs text-stone-500">
              พบการจองทั้งหมด {currentMonthBookings.length} รายการในเดือนนี้
            </p>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50 active:bg-stone-100 transition"
          >
            วันนี้
          </button>
          <div className="flex items-center rounded-lg border border-stone-200 overflow-hidden">
            <button
              onClick={handlePrevMonth}
              title="เดือนก่อนหน้า"
              className="p-1.5 text-stone-600 hover:bg-indigo-50 hover:text-indigo-700 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="w-px h-4 bg-stone-200"></span>
            <button
              onClick={handleNextMonth}
              title="เดือนถัดไป"
              className="p-1.5 text-stone-600 hover:bg-indigo-50 hover:text-indigo-700 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 text-center font-semibold text-xs text-stone-500 py-3 border-b border-stone-100">
        {TH_DAYS_SHORT.map((day, idx) => (
          <div
            key={day}
            className={`${
              idx === 0 ? 'text-rose-500' : idx === 6 ? 'text-indigo-500' : 'text-stone-600'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1.5 md:gap-2 pt-2">
        {/* Empty cells before month start */}
        {Array.from({ length: firstDayIndex }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="min-h-[70px] md:min-h-[95px] p-1 rounded-xl bg-stone-50/50 opacity-40 border border-transparent"
          />
        ))}

        {/* Days in Month */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(
            dayNum
          ).padStart(2, '0')}`;
          const isToday = dateStr === todayStr;
          const dayDate = new Date(year, month, dayNum);
          const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;

          // Filter bookings for this day
          const dayBookings = bookings.filter(
            (b) => normalizeDate(b.date) === dateStr && b.status !== 'ยกเลิก'
          );
          const hasConflict = dayBookings.some((b) => b.status === 'ชนกัน');

          return (
            <div
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={`group relative min-h-[72px] md:min-h-[100px] p-1.5 md:p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                isToday
                  ? 'bg-indigo-50/60 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                  : dayBookings.length > 0
                  ? 'bg-white border-stone-200 hover:border-indigo-300 hover:shadow-sm'
                  : 'bg-white border-stone-100 hover:bg-stone-50/80 hover:border-stone-200'
              }`}
            >
              {/* Day Number Header */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs md:text-sm font-semibold inline-flex items-center justify-center w-5 h-5 md:w-6 md:h-6 rounded-full ${
                    isToday
                      ? 'bg-indigo-700 text-white shadow-xs'
                      : isWeekend
                      ? 'text-stone-400'
                      : 'text-stone-700'
                  }`}
                >
                  {dayNum}
                </span>

                {dayBookings.length > 0 && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      hasConflict
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-indigo-100 text-indigo-700'
                    }`}
                  >
                    {dayBookings.length}
                  </span>
                )}
              </div>

              {/* Booking Chips on Desktop */}
              <div className="space-y-1 my-1 overflow-hidden">
                {dayBookings.slice(0, 2).map((b, bIdx) => (
                  <div
                    key={bIdx}
                    title={`${b.time_start} - ${b.time_end}: ${b.topic}`}
                    className={`text-[10px] md:text-[11px] px-1.5 py-0.5 rounded truncate font-medium flex items-center space-x-1 ${
                      b.status === 'ชนกัน'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-indigo-50 text-indigo-800 border border-indigo-100'
                    }`}
                  >
                    {b.use_zoom && <Video className="w-2.5 h-2.5 shrink-0 text-blue-600" />}
                    <span className="truncate">
                      {b.time_start} {b.topic}
                    </span>
                  </div>
                ))}
                {dayBookings.length > 2 && (
                  <div className="text-[10px] text-stone-500 font-medium px-1">
                    +{dayBookings.length - 2} รายการเพิ่มเติม
                  </div>
                )}
              </div>

              {/* Dot Indicators on Mobile */}
              <div className="flex sm:hidden space-x-1 mt-auto">
                {dayBookings.slice(0, 3).map((b, idx) => (
                  <span
                    key={idx}
                    className={`w-1.5 h-1.5 rounded-full ${
                      b.status === 'ชนกัน' ? 'bg-rose-500' : 'bg-indigo-600'
                    }`}
                  />
                ))}
                {dayBookings.length > 3 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-300" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend & Guide */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-5 mt-4 border-t border-stone-100 text-xs text-stone-500">
        <div className="flex items-center space-x-4 flex-wrap gap-y-2">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
            <span>จองเรียบร้อย</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span>พบเวลาชนกัน</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-stone-300"></span>
            <span>ยกเลิก</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-100 border border-indigo-300"></span>
            <span>วันนี้</span>
          </div>
        </div>

        <p className="text-[11px] text-stone-400">
          * คลิกที่วันที่ในปฏิทินเพื่อดูรายละเอียดการใช้งานและช่วงเวลาว่าง
        </p>
      </div>
    </div>
  );
};
