import React from 'react';
import {
  X,
  Calendar,
  Clock,
  Building,
  User,
  Users,
  Video,
  Wrench,
  FileText,
  Plus,
  AlertTriangle,
  Share2,
} from 'lucide-react';
import { Booking } from '../types';
import { formatThaiDateWithDay, formatThaiDate, normalizeDate } from '../utils/thaiDate';

interface DayDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateStr: string | null;
  bookings: Booking[];
  onBookOnDate: (dateStr: string) => void;
  onOpenLineInvite: (booking: Booking) => void;
  onOpenAction: (action: 'edit' | 'cancel' | 'delete', booking: Booking) => void;
}

export const DayDetailModal: React.FC<DayDetailModalProps> = ({
  isOpen,
  onClose,
  dateStr,
  bookings,
  onBookOnDate,
  onOpenLineInvite,
  onOpenAction,
}) => {
  if (!isOpen || !dateStr) return null;

  const normalized = normalizeDate(dateStr);
  const dayBookings = bookings.filter(
    (b) => normalizeDate(b.date) === normalized && b.status !== 'ยกเลิก'
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 font-['Prompt',sans-serif]">
                {formatThaiDateWithDay(normalized)}
              </h3>
              <p className="text-xs text-stone-500">
                รายการจองห้องประชุมทั้งหมด {dayBookings.length} รายการ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 space-y-4 flex-1">
          {dayBookings.length === 0 ? (
            <div className="text-center py-10 px-4 bg-stone-50/60 rounded-2xl border border-dashed border-stone-200">
              <Clock className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
              <h4 className="text-sm font-bold text-stone-800">ไม่มีการจองในวันนี้</h4>
              <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                ห้องประชุมว่างตลอดทั้งวัน สามารถจองเพื่อใช้งานได้ทันที
              </p>
              <button
                onClick={() => {
                  onClose();
                  onBookOnDate(normalized);
                }}
                className="mt-4 inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-700 text-white text-xs font-semibold hover:bg-indigo-800 transition shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>จองห้องประชุมวันนี้</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {dayBookings.map((b, idx) => {
                const isConflict = b.status === 'ชนกัน';
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border transition-all ${
                      isConflict
                        ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                        : 'bg-white border-stone-200 hover:border-indigo-200 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-stone-900">{b.topic}</span>
                          {isConflict && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-200 text-rose-800">
                              <AlertTriangle className="w-3 h-3" />
                              <span>เวลาชนกัน</span>
                            </span>
                          )}
                          {b.use_zoom && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700">
                              <Video className="w-3 h-3" />
                              <span>Zoom</span>
                            </span>
                          )}
                        </div>

                        <div className="space-y-1 text-xs text-stone-600">
                          <div className="flex items-center space-x-1.5 font-semibold text-indigo-800">
                            <Clock className="w-3.5 h-3.5 text-indigo-600" />
                            <span>
                              {b.time_start} – {b.time_end} น.
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5">
                            <span className="flex items-center space-x-1">
                              <Building className="w-3.5 h-3.5 text-stone-400" />
                              <span>{b.dept}</span>
                            </span>
                            <span>·</span>
                            <span className="flex items-center space-x-1">
                              <User className="w-3.5 h-3.5 text-stone-400" />
                              <span>{b.name}</span>
                            </span>
                            <span>·</span>
                            <span className="flex items-center space-x-1">
                              <Users className="w-3.5 h-3.5 text-stone-400" />
                              <span>{b.attendees} ท่าน</span>
                            </span>
                          </div>

                          {b.equipment && (
                            <div className="flex items-center space-x-1.5 text-stone-500 pt-0.5">
                              <Wrench className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                              <span>{b.equipment}</span>
                            </div>
                          )}

                          {b.zoom_url && (
                            <div className="pt-0.5">
                              <a
                                href={b.zoom_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center space-x-1 text-blue-700 hover:text-blue-900 hover:underline text-[11px] font-semibold"
                              >
                                <Video className="w-3.5 h-3.5 shrink-0" />
                                <span>เปิดลิงก์ Zoom</span>
                              </a>
                            </div>
                          )}

                          {b.note && (
                            <div className="flex items-center space-x-1.5 text-stone-500 italic pt-0.5">
                              <FileText className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                              <span>{b.note}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex flex-col gap-1 shrink-0">
                        <button
                          onClick={() => onOpenLineInvite(b)}
                          title="แชร์แจ้ง LINE"
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition text-xs"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onOpenAction('edit', b)}
                          title="แก้ไข"
                          className="p-1.5 rounded-lg bg-stone-100 text-stone-700 hover:bg-stone-200 transition text-xs"
                        >
                          <span className="text-[11px] font-medium px-1">แก้ไข</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-100 flex items-center justify-between bg-stone-50/70 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-100"
          >
            ปิด
          </button>
          <button
            onClick={() => {
              onClose();
              onBookOnDate(normalized);
            }}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-700 text-white text-xs font-bold hover:bg-indigo-800 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>จองช่วงเวลาอื่นในวันนี้</span>
          </button>
        </div>
      </div>
    </div>
  );
};
