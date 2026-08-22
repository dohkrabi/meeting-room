import React, { useState, useEffect } from 'react';
import {
  X, Building2, FileCheck, CheckCircle, Pencil, Plus, Trash2, Save, Loader2, RotateCcw,
} from 'lucide-react';
import { ROOM_INFO } from '../types';
import { getFacilities, saveFacilities, Facilities } from '../services/bookingService';

interface RoomFacilitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenBook: () => void;
  isAdmin: boolean;
  onToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

function defaultFacilities(): Facilities {
  return {
    location: `${ROOM_INFO.floor} ${ROOM_INFO.building}`,
    capacity: ROOM_INFO.capacity,
    equipment: [...ROOM_INFO.features],
    rules: [
      'กรุณาปิดเครื่องปรับอากาศและเครื่องเสียงทุกครั้งหลังเสร็จสิ้นการประชุม',
      'หากต้องการจัดโต๊ะประชุมรูปแบบพิเศษ กรุณาประสานงานเจ้าหน้าที่ล่วงหน้าอย่างน้อย 1 วัน',
      'รักษาความสะอาด และทิ้งขยะในภาชนะที่จัดเตรียมไว้บริเวณหน้าห้องประชุม',
    ],
    contact: ROOM_INFO.contact,
  };
}

export const RoomFacilitiesModal: React.FC<RoomFacilitiesModalProps> = ({
  isOpen, onClose, onOpenBook, isAdmin, onToast,
}) => {
  const [data, setData] = useState<Facilities>(defaultFacilities());
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Facilities>(defaultFacilities());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEditing(false);
      setLoading(true);
      getFacilities().then((f) => {
        setData(f || defaultFacilities());
        setLoading(false);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const startEdit = () => {
    setDraft(JSON.parse(JSON.stringify(data)));
    setEditing(true);
  };

  const save = async () => {
    setSaving(true);
    const res = await saveFacilities(draft);
    setSaving(false);
    if (res.ok) {
      setData(draft);
      setEditing(false);
      onToast('บันทึกข้อมูลห้องเรียบร้อย', 'success');
    } else {
      onToast(res.error || 'บันทึกไม่สำเร็จ', 'error');
    }
  };

  // helpers แก้ไข list
  const editList = (key: 'equipment' | 'rules', idx: number, val: string) => {
    setDraft((d) => {
      const arr = [...d[key]];
      arr[idx] = val;
      return { ...d, [key]: arr };
    });
  };
  const addList = (key: 'equipment' | 'rules') =>
    setDraft((d) => ({ ...d, [key]: [...d[key], ''] }));
  const removeList = (key: 'equipment' | 'rules', idx: number) =>
    setDraft((d) => ({ ...d, [key]: d[key].filter((_, i) => i !== idx) }));

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
          <div className="flex items-center space-x-1">
            {isAdmin && !editing && (
              <button
                onClick={startEdit}
                className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>แก้ไข</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-5 flex-1 text-xs sm:text-sm text-stone-700">
          {loading ? (
            <div className="py-10 text-center text-stone-400">
              <Loader2 className="w-5 h-5 animate-spin inline" /> กำลังโหลด...
            </div>
          ) : !editing ? (
            <>
              {/* Key Specs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100">
                  <div className="text-indigo-600 font-medium text-xs mb-1">สถานที่ตั้ง</div>
                  <div className="font-bold text-indigo-950 text-sm">{data.location}</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100">
                  <div className="text-indigo-600 font-medium text-xs mb-1">ความจุผู้เข้าร่วม</div>
                  <div className="font-bold text-indigo-950 text-sm">{data.capacity}</div>
                </div>
              </div>

              {/* Equipment */}
              <div className="space-y-2.5">
                <h4 className="font-bold text-stone-900 uppercase tracking-wider text-xs">
                  อุปกรณ์และระบบภายในห้อง
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {data.equipment.map((feat, idx) => (
                    <div key={idx} className="flex items-center space-x-2.5 p-2.5 rounded-xl bg-stone-50 border border-stone-200/80">
                      <CheckCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span className="font-medium text-stone-800">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rules */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2 text-xs text-amber-900">
                <div className="font-bold flex items-center space-x-1.5 text-amber-800">
                  <FileCheck className="w-4 h-4" />
                  <span>ข้อปฏิบัติในการใช้ห้องประชุม</span>
                </div>
                <ul className="list-disc list-inside space-y-1 pl-1 text-amber-800/90 leading-relaxed">
                  {data.rules.map((r, idx) => <li key={idx}>{r}</li>)}
                </ul>
              </div>

              {/* Contact */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-100 border border-stone-200 text-xs">
                <div>
                  <span className="font-semibold text-stone-800">ผู้ดูแลระบบห้องประชุม: </span>
                  <span className="text-stone-600">{data.contact}</span>
                </div>
              </div>
            </>
          ) : (
            /* ── โหมดแก้ไข (admin) ── */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-600">สถานที่ตั้ง</label>
                  <input
                    value={draft.location}
                    onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-600">ความจุผู้เข้าร่วม</label>
                  <input
                    value={draft.capacity}
                    onChange={(e) => setDraft({ ...draft, capacity: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Equipment editor */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-stone-600">อุปกรณ์และระบบ</label>
                  <button onClick={() => addList('equipment')} className="inline-flex items-center space-x-1 text-xs text-indigo-700 hover:text-indigo-900">
                    <Plus className="w-3.5 h-3.5" /><span>เพิ่ม</span>
                  </button>
                </div>
                <div className="space-y-2">
                  {draft.equipment.map((eq, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <input
                        value={eq}
                        onChange={(e) => editList('equipment', idx, e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                      <button onClick={() => removeList('equipment', idx)} className="p-2 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rules editor */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-stone-600">ข้อปฏิบัติการใช้ห้อง</label>
                  <button onClick={() => addList('rules')} className="inline-flex items-center space-x-1 text-xs text-indigo-700 hover:text-indigo-900">
                    <Plus className="w-3.5 h-3.5" /><span>เพิ่ม</span>
                  </button>
                </div>
                <div className="space-y-2">
                  {draft.rules.map((r, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <input
                        value={r}
                        onChange={(e) => editList('rules', idx, e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                      <button onClick={() => removeList('rules', idx)} className="p-2 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-600">ผู้ดูแลระบบห้องประชุม</label>
                <input
                  value={draft.contact}
                  onChange={(e) => setDraft({ ...draft, contact: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-100 flex items-center justify-between bg-stone-50/80 shrink-0">
          {editing ? (
            <>
              <button
                onClick={() => setEditing(false)}
                className="inline-flex items-center space-x-1 px-4 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-100"
              >
                <RotateCcw className="w-3.5 h-3.5" /><span>ยกเลิก</span>
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-indigo-700 text-white font-bold text-xs hover:bg-indigo-800 transition shadow-xs disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>บันทึกข้อมูลห้อง</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-100"
              >
                ปิด
              </button>
              <button
                onClick={() => { onClose(); onOpenBook(); }}
                className="px-5 py-2 rounded-xl bg-indigo-700 text-white font-bold text-xs hover:bg-indigo-800 transition shadow-xs"
              >
                จองห้องประชุมทันที
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
