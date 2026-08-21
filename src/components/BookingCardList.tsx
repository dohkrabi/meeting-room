import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Building,
  Users,
  Video,
  Wrench,
  FileText,
  Search,
  Pencil,
  XCircle,
  Trash2,
  Share2,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Bell,
  Zap,
} from 'lucide-react';
import { Booking } from '../types';
import { formatThaiDate, normalizeDate } from '../utils/thaiDate';

interface BookingCardListProps {
  bookings: Booking[];
  onOpenAction: (action: 'edit' | 'cancel' | 'delete', booking: Booking) => void;
  onOpenLineInvite: (booking: Booking) => void;
  onOpenBook: () => void;
  onOpenNotificationModalWithBooking?: (booking: Booking) => void;
}

export const BookingCardList: React.FC<BookingCardListProps> = ({
  bookings,
  onOpenAction,
  onOpenLineInvite,
  onOpenBook,
  onOpenNotificationModalWithBooking,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'past' | 'cancelled'>('all');
  const [selectedDept, setSelectedDept] = useState<string>('all');

  const now = new Date();

  // Extract unique departments for filter dropdown
  const departments = useMemo(() => {
    const set = new Set<string>();
    bookings.forEach((b) => {
      if (b.dept) set.add(b.dept);
    });
    return Array.from(set).sort();
  }, [bookings]);

  // Filtered and sorted bookings
  const filteredBookings = useMemo(() => {
    return bookings
      .filter((b) => {
        // Search term
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const matchTopic = b.topic?.toLowerCase().includes(term);
          const matchName = b.name?.toLowerCase().includes(term);
          const matchDept = b.dept?.toLowerCase().includes(term);
          const matchEquipment = b.equipment?.toLowerCase().includes(term);
          if (!matchTopic && !matchName && !matchDept && !matchEquipment) return false;
        }

        // Department filter
        if (selectedDept !== 'all' && b.dept !== selectedDept) {
          return false;
        }

        // Status / Time filter
        const normDate = normalizeDate(b.date);
        const bookingTime = new Date(`${normDate}T${b.time_end || '23:59'}:00`);

        if (statusFilter === 'cancelled') {
          return b.status === 'ยกเลิก';
        }
        if (b.status === 'ยกเลิก' && statusFilter !== 'all') {
          return false;
        }
        if (statusFilter === 'upcoming') {
          return bookingTime >= now;
        }
        if (statusFilter === 'past') {
          return bookingTime < now;
        }
        return true;
      })
      .sort((a, b) => {
        // Sort descending (latest date first) or ascending
        const dateA = `${normalizeDate(a.date)}T${a.time_start}`;
        const dateB = `${normalizeDate(b.date)}T${b.time_start}`;
        return dateB.localeCompare(dateA);
      });
  }, [bookings, searchTerm, statusFilter, selectedDept, now]);

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 md:p-6 mb-8">
      {/* Header & Controls */}
      <div className="space-y-4 pb-5 border-b border-stone-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base md:text-lg font-bold text-stone-900 font-['Prompt',sans-serif]">
              รายการการจองห้องประชุมทั้งหมด
            </h3>
            <p className="text-xs text-stone-500">
              พบ {filteredBookings.length} รายการ (จากทั้งหมด {bookings.length} รายการ)
            </p>
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center space-x-1 bg-stone-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto overflow-x-auto max-w-full">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'all'
                  ? 'bg-white text-indigo-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => setStatusFilter('upcoming')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'upcoming'
                  ? 'bg-white text-indigo-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              กำลังจะมาถึง
            </button>
            <button
              onClick={() => setStatusFilter('past')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'past'
                  ? 'bg-white text-indigo-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              ผ่านมาแล้ว
            </button>
            <button
              onClick={() => setStatusFilter('cancelled')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'cancelled'
                  ? 'bg-white text-rose-800 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              ยกเลิก
            </button>
          </div>
        </div>

        {/* Search Bar & Department Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาตามหัวข้อ, ชื่อผู้จอง, อุปกรณ์ หรือหน่วยงาน..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-stone-50/50"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
              >
                ล้าง
              </button>
            )}
          </div>

          <div className="sm:col-span-4">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 bg-stone-50/50 text-stone-700"
            >
              <option value="all">ทุกหน่วยงาน / ฝ่าย</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="divide-y divide-stone-100">
        {filteredBookings.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Calendar className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-stone-700">ไม่พบรายการจองตามเงื่อนไข</h4>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
              ลองเปลี่ยนคำค้นหาหรือเลือกดูสถานะอื่น หรือคลิกปุ่มด้านล่างเพื่อเริ่มการจองใหม่
            </p>
            <button
              onClick={onOpenBook}
              className="mt-4 inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-700 text-white text-xs font-semibold hover:bg-indigo-800 transition"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>สร้างการจองใหม่</span>
            </button>
          </div>
        ) : (
          filteredBookings.map((b, idx) => {
            const normDate = normalizeDate(b.date);
            const dateObj = new Date(normDate);
            const isCancelled = b.status === 'ยกเลิก';
            const isConflict = b.status === 'ชนกัน';

            return (
              <div
                key={b.row || b.id || idx}
                className={`py-4 sm:py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors hover:bg-stone-50/70 rounded-xl px-2 sm:px-3 ${
                  isCancelled ? 'opacity-60 bg-stone-50/30' : ''
                }`}
              >
                {/* Left: Date Badge & Core Information */}
                <div className="flex items-start space-x-3.5">
                  {/* Date Badge */}
                  <div
                    className={`shrink-0 w-12 sm:w-14 text-center rounded-xl p-2 border ${
                      isConflict
                        ? 'bg-rose-50 border-rose-200 text-rose-700'
                        : isCancelled
                        ? 'bg-stone-100 border-stone-200 text-stone-500'
                        : 'bg-indigo-50 border-indigo-100 text-indigo-800'
                    }`}
                  >
                    <div className="text-lg sm:text-xl font-black leading-none">
                      {isNaN(dateObj.getDate()) ? '—' : dateObj.getDate()}
                    </div>
                    <div className="text-[10px] font-bold mt-1 uppercase">
                      {formatThaiDate(normDate, true).split(' ')[1]}
                    </div>
                  </div>

                  {/* Topic & Metadata */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4
                        className={`text-sm sm:text-base font-bold text-stone-900 ${
                          isCancelled ? 'line-through text-stone-500' : ''
                        }`}
                      >
                        {b.topic}
                      </h4>

                      {/* Status Badges */}
                      {isConflict && (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                          <AlertTriangle className="w-3 h-3" />
                          <span>ชนกัน</span>
                        </span>
                      )}
                      {isCancelled && (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-stone-200 text-stone-600">
                          <span>ยกเลิกแล้ว</span>
                        </span>
                      )}
                      {b.use_zoom && (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <Video className="w-3 h-3" />
                          <span>ระบบ Zoom</span>
                        </span>
                      )}
                    </div>

                    {/* Details row */}
                    <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-stone-600">
                      <span className="inline-flex items-center space-x-1 font-semibold text-indigo-900">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        <span>
                          {b.time_start} – {b.time_end} น.
                        </span>
                      </span>
                      <span>·</span>
                      <span className="inline-flex items-center space-x-1">
                        <Building className="w-3.5 h-3.5 text-stone-400" />
                        <span>{b.dept}</span>
                      </span>
                      <span>·</span>
                      <span className="text-stone-500">ผู้จอง: {b.name}</span>
                      <span>·</span>
                      <span className="inline-flex items-center space-x-1">
                        <Users className="w-3.5 h-3.5 text-stone-400" />
                        <span>{b.attendees} ท่าน</span>
                      </span>
                    </div>

                    {/* Notification Status Badges (4 Levels) */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
                      <span className="text-stone-400 font-medium">สถานะแจ้งเตือน LINE:</span>
                      <span
                        title="1. แจ้งเมื่อจองสำเร็จ"
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md border font-medium ${
                          b.sent_ok
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-stone-50 text-stone-400 border-stone-200'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>1.จองสำเร็จ</span>
                      </span>

                      <span
                        title="2. แจ้งล่วงหน้า 1 วัน"
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md border font-medium ${
                          b.sent_1day
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-stone-50 text-stone-400 border-stone-200'
                        }`}
                      >
                        <Bell className="w-3 h-3 text-blue-600" />
                        <span>2.ล่วงหน้า 1 วัน</span>
                      </span>

                      <span
                        title="3. แจ้งล่วงหน้า 1 ชั่วโมง"
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md border font-medium ${
                          b.sent_1hr
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-stone-50 text-stone-400 border-stone-200'
                        }`}
                      >
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>3.ล่วงหน้า 1 ชม.</span>
                      </span>

                      <span
                        title="4. แจ้งล่วงหน้า 30 นาที"
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md border font-medium ${
                          b.sent_30min
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-stone-50 text-stone-400 border-stone-200'
                        }`}
                      >
                        <Zap className="w-3 h-3 text-rose-600" />
                        <span>4.ล่วงหน้า 30 นาที</span>
                      </span>
                    </div>

                    {/* Equipment & Zoom Info */}
                    {b.equipment && (
                      <div className="text-xs text-stone-500 flex items-center space-x-1 pt-0.5">
                        <Wrench className="w-3 h-3 text-stone-400 shrink-0" />
                        <span className="truncate">{b.equipment}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center space-x-1.5 self-end md:self-center shrink-0 pt-2 md:pt-0">
                  <button
                    onClick={() => onOpenLineInvite(b)}
                    title="คัดลอกข้อความแจ้ง LINE กลุ่ม"
                    className="p-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition text-xs font-semibold flex items-center space-x-1"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">แชร์ LINE</span>
                  </button>

                  <button
                    onClick={() => onOpenAction('edit', b)}
                    title="แก้ไขข้อมูลการจอง"
                    className="p-2 rounded-lg bg-stone-100 text-stone-700 hover:bg-stone-200 transition text-xs font-semibold flex items-center space-x-1"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">แก้ไข</span>
                  </button>

                  {!isCancelled && (
                    <button
                      onClick={() => onOpenAction('cancel', b)}
                      title="ยกเลิกการจอง"
                      className="p-2 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition text-xs font-semibold flex items-center space-x-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">ยกเลิก</span>
                    </button>
                  )}

                  <button
                    onClick={() => onOpenAction('delete', b)}
                    title="ลบรายการถาวร"
                    className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition text-xs font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
