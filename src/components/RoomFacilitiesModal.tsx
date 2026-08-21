import React from 'react';
import {
  X,
  Building2,
  Users,
  Tv,
  Mic,
  Wifi,
  Sparkles,
  ShieldCheck,
  Phone,
  FileCheck,
  Coffee,
  CheckCircle,
} from 'lucide-react';
import { ROOM_INFO } from '../types';

interface RoomFacilitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenBook: () => void;
}

export const RoomFacilitiesModal: React.FC<RoomFacilitiesModalProps> = ({
  isOpen,
  onClose,
  onOpenBook,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/80 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-700 text-white flex items-center justify-center shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 font-['Prompt',sans-serif]">
                ข้อมูลและสิ่งอำนวยความสะดวก
              </h3>
              <p className="text-xs text-stone-500">{ROOM_INFO.name} ({ROOM_INFO.floor})</p>
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
        <div className="overflow-y-auto p-6 space-y-5 flex-1 text-xs sm:text-sm text-stone-700">
          {/* Key Specifications */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100">
              <div className="text-indigo-600 font-medium text-xs mb-1">สถานที่ตั้ง</div>
              <div className="font-bold text-indigo-950 text-sm">{ROOM_INFO.floor} {ROOM_INFO.building}</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100">
              <div className="text-indigo-600 font-medium text-xs mb-1">ความจุผู้เข้าร่วม</div>
              <div className="font-bold text-indigo-950 text-sm">{ROOM_INFO.capacity}</div>
            </div>
          </div>

          {/* Amenities List */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-stone-900 uppercase tracking-wider text-xs">
              อุปกรณ์และระบบภายในห้อง
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {ROOM_INFO.features.map((feat, idx) => (
                <div
                  key={idx}
                  className="flex items-center space-x-2.5 p-2.5 rounded-xl bg-stone-50 border border-stone-200/80"
                >
                  <CheckCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="font-medium text-stone-800">{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Guidelines */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2 text-xs text-amber-900">
            <div className="font-bold flex items-center space-x-1.5 text-amber-800">
              <FileCheck className="w-4 h-4" />
              <span>ข้อปฏิบัติในการใช้ห้องประชุม</span>
            </div>
            <ul className="list-disc list-inside space-y-1 pl-1 text-amber-800/90 leading-relaxed">
              <li>กรุณาปิดเครื่องปรับอากาศและเครื่องเสียงทุกครั้งหลังเสร็จสิ้นการประชุม</li>
              <li>หากต้องการจัดโต๊ะประชุมรูปแบบพิเศษ กรุณาประสานงานเจ้าหน้าที่ล่วงหน้าอย่างน้อย 1 วัน</li>
              <li>รักษาความสะอาด และทิ้งขยะในภาชนะที่จัดเตรียมไว้บริเวณหน้าห้องประชุม</li>
            </ul>
          </div>

          {/* Contact */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-100 border border-stone-200 text-xs">
            <div>
              <span className="font-semibold text-stone-800">ผู้ดูแลระบบห้องประชุม: </span>
              <span className="text-stone-600">{ROOM_INFO.contact}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-100 flex items-center justify-between bg-stone-50/80 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-100"
          >
            ปิด
          </button>
          <button
            onClick={() => {
              onClose();
              onOpenBook();
            }}
            className="px-5 py-2 rounded-xl bg-indigo-700 text-white font-bold text-xs hover:bg-indigo-800 transition shadow-xs"
          >
            จองห้องประชุมทันที
          </button>
        </div>
      </div>
    </div>
  );
};
