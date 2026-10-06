import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  CalendarClock,
  Clock,
  Building,
  Users,
  User,
  Phone,
  Wrench,
  Video,
  Check,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Inbox,
  Pencil,
  Save,
  ShieldCheck,
} from 'lucide-react';
import {
  listRequests,
  approveRequest,
  rejectRequest,
  updateRequest,
  checkAvailability,
  BookingRequest,
  RequestEdit,
} from '../services/bookingService';
import { formatThaiDate } from '../utils/thaiDate';

type Tab = 'pending' | 'approved' | 'rejected';
const TAB_STATUS: Record<Tab, string> = {
  pending: 'รออนุมัติ',
  approved: 'อนุมัติแล้ว',
  rejected: 'ปฏิเสธ',
};

interface RequestsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  /** เรียกเมื่อจำนวนรออนุมัติเปลี่ยน / มีการอนุมัติ (ให้ App รีเฟรชปฏิทิน + badge) */
  onChanged: (pending: number, bookingsChanged: boolean) => void;
  onToast: (msg: string, icon?: 'success' | 'error' | 'warning' | 'info') => void;
}

// "2026-10-06 14:05:00" → "6 ต.ค. 2569 เวลา 14:05 น."
function fmtSubmitted(ts: string): string {
  const m = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/.exec(ts || '');
  if (!m) return ts || '';
  return `${formatThaiDate(m[1], true)} เวลา ${m[2]} น.`;
}

export const RequestsPanel: React.FC<RequestsPanelProps> = ({ isOpen, onClose, onChanged, onToast }) => {
  const [tab, setTab] = useState<Tab>('pending');
  const [items, setItems] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [busyRow, setBusyRow] = useState<number | null>(null);
  const [confirmRow, setConfirmRow] = useState<number | null>(null);
  const [rejectRow, setRejectRow] = useState<number | null>(null);
  const [editRow, setEditRow] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [rowError, setRowError] = useState<{ row: number; msg: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    const res = await listRequests();
    setLoading(false);
    if (res.ok) {
      setItems(res.requests || []);
      onChanged(res.pending ?? 0, false);
    } else {
      setLoadError(res.error || 'โหลดไม่สำเร็จ');
    }
  }, [onChanged]);

  useEffect(() => {
    if (isOpen) {
      setTab('pending');
      setConfirmRow(null);
      setRejectRow(null);
      setEditRow(null);
      setRowError(null);
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ยกเลิกสถานะ "ยืนยันอนุมัติ" อัตโนมัติถ้าไม่กดภายใน 5 วิ
  useEffect(() => {
    if (confirmRow == null) return;
    const t = setTimeout(() => setConfirmRow(null), 5000);
    return () => clearTimeout(t);
  }, [confirmRow]);

  if (!isOpen) return null;

  const counts = {
    pending: items.filter((r) => r.status === TAB_STATUS.pending).length,
    approved: items.filter((r) => r.status === TAB_STATUS.approved).length,
    rejected: items.filter((r) => r.status === TAB_STATUS.rejected).length,
  };
  const shown = items.filter((r) => r.status === TAB_STATUS[tab]);

  const handleApprove = async (r: BookingRequest) => {
    if (confirmRow !== r.row) {
      setConfirmRow(r.row);
      setRejectRow(null);
      return;
    }
    setConfirmRow(null);
    setBusyRow(r.row);
    setRowError(null);
    const res = await approveRequest(r.row);
    setBusyRow(null);
    if (res.ok) {
      onToast(`อนุมัติแล้ว · "${r.topic}" เข้าปฏิทินและแจ้ง LINE กลุ่มเรียบร้อย`, 'success');
      const next = items.map((x) => (x.row === r.row ? { ...x, status: TAB_STATUS.approved } : x));
      setItems(next);
      onChanged(next.filter((x) => x.status === TAB_STATUS.pending).length, true);
    } else {
      setRowError({
        row: r.row,
        msg:
          res.code === 'SLOT_TAKEN' && res.conflict
            ? `อนุมัติไม่ได้: ช่วงเวลานี้ชนกับ "${res.conflict.topic}" (${res.conflict.time_start}–${res.conflict.time_end} น.) — ปฏิเสธพร้อมแจ้งเหตุผลแทน`
            : res.error || 'อนุมัติไม่สำเร็จ',
      });
    }
  };

  const handleReject = async (r: BookingRequest) => {
    setBusyRow(r.row);
    setRowError(null);
    const res = await rejectRequest(r.row, reason.trim());
    setBusyRow(null);
    if (res.ok) {
      onToast(`ปฏิเสธคำขอ "${r.topic}" แล้ว`, 'info');
      const next = items.map((x) =>
        x.row === r.row ? { ...x, status: TAB_STATUS.rejected, reject_reason: reason.trim() } : x
      );
      setItems(next);
      setRejectRow(null);
      setReason('');
      onChanged(next.filter((x) => x.status === TAB_STATUS.pending).length, false);
    } else {
      setRowError({ row: r.row, msg: res.error || 'ปฏิเสธไม่สำเร็จ' });
    }
  };

  const handleEdited = (r: BookingRequest, edit: RequestEdit) => {
    setItems(items.map((x) => (x.row === r.row ? { ...x, ...edit } : x)));
    setEditRow(null);
    setRowError(null);
    onToast('บันทึกการแก้ไขแล้ว — ตรวจสอบอีกครั้งแล้วกดอนุมัติเมื่อพร้อม', 'success');
  };

  const copyPhone = async (phone: string) => {
    try {
      await navigator.clipboard.writeText(phone);
      onToast(`คัดลอกเบอร์ ${phone} แล้ว`, 'info');
    } catch {
      onToast(phone, 'info');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center shrink-0">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-stone-900 font-['Prompt',sans-serif]">
                คำขอจองห้องประชุม
              </h3>
              <p className="text-xs text-stone-500">ตรวจสอบและยืนยันคำขอจากผู้ใช้ทั่วไป · ห้องประชุม ชั้น 3</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-xs font-semibold">
              {(['pending', 'approved', 'rejected'] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                    tab === t ? 'bg-white text-teal-800 shadow-sm' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {TAB_STATUS[t]}
                  {t === 'pending' && counts.pending > 0 && (
                    <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-teal-600 text-white text-[10px] flex items-center justify-center">
                      {counts.pending}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={load}
              disabled={loading}
              title="รีเฟรช"
              className="p-2 rounded-lg text-stone-500 hover:text-teal-700 hover:bg-teal-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose} className="p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          {loading && items.length === 0 ? (
            <div className="py-16 text-center text-sm text-stone-500 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> กำลังโหลดคำขอ...
            </div>
          ) : loadError ? (
            <div className="m-5 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {loadError}
            </div>
          ) : shown.length === 0 ? (
            <div className="py-16 text-center px-4">
              <Inbox className="w-10 h-10 text-stone-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-stone-600">
                {tab === 'pending' ? 'ไม่มีคำขอรออนุมัติ' : `ยังไม่มีคำขอที่${TAB_STATUS[tab]}`}
              </p>
            </div>
          ) : tab === 'pending' ? (
            <div className="divide-y divide-stone-100">
              {shown.map((r) => {
                const d = new Date(r.date);
                const busy = busyRow === r.row;
                return (
                  <article key={r.row} className="p-5 hover:bg-stone-50/60">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        <div className="shrink-0 w-14 text-center rounded-xl p-2 border bg-teal-50 border-teal-100 text-teal-800">
                          <div className="text-xl font-extrabold leading-none">
                            {isNaN(d.getDate()) ? '—' : d.getDate()}
                          </div>
                          <div className="text-[10px] font-bold mt-1">
                            {formatThaiDate(r.date, true).split(' ')[1]}
                          </div>
                        </div>
                        <div className="min-w-0 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-bold text-sm sm:text-base text-stone-900">{r.topic}</h4>
                            {r.use_zoom && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                <Video className="w-3 h-3" /> ระบบ Zoom
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-600">
                            <span className="inline-flex items-center gap-1 font-semibold text-teal-900">
                              <Clock className="w-3.5 h-3.5 text-teal-600" />
                              {formatThaiDate(r.date, false)} · {r.time_start} – {r.time_end} น.
                            </span>
                            <span>·</span>
                            <span className="inline-flex items-center gap-1">
                              <Building className="w-3.5 h-3.5 text-stone-400" /> {r.dept}
                            </span>
                            {r.attendees ? (
                              <>
                                <span>·</span>
                                <span className="inline-flex items-center gap-1">
                                  <Users className="w-3.5 h-3.5 text-stone-400" /> {r.attendees} ท่าน
                                </span>
                              </>
                            ) : null}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-600">
                            <span className="inline-flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-stone-400" /> ผู้ขอ: {r.name}
                            </span>
                            <span>·</span>
                            <button
                              onClick={() => copyPhone(r.phone)}
                              title="คัดลอกเบอร์"
                              className="inline-flex items-center gap-1 text-teal-700 hover:underline font-medium select-all"
                            >
                              <Phone className="w-3.5 h-3.5" /> {r.phone}
                            </button>
                          </div>
                          {r.equipment && (
                            <div className="text-xs text-stone-500 flex items-start gap-1 min-w-0">
                              <Wrench className="w-3 h-3 mt-0.5 text-stone-400 shrink-0" />
                              <span className="min-w-0 break-words">{r.equipment}</span>
                            </div>
                          )}
                          {r.note && (
                            <div className="text-xs text-stone-600 bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5">
                              หมายเหตุ: {r.note}
                            </div>
                          )}
                          <div className="text-[11px] text-stone-400 pt-0.5">
                            ส่งคำขอเมื่อ {fmtSubmitted(r.timestamp)}
                          </div>
                        </div>
                      </div>

                      {editRow !== r.row && (
                      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                        <button
                          onClick={() => {
                            setEditRow(r.row);
                            setRejectRow(null);
                            setConfirmRow(null);
                            setRowError(null);
                          }}
                          disabled={busy}
                          className="px-3 py-2 rounded-lg border border-stone-200 text-stone-700 text-xs font-semibold hover:bg-stone-100 flex items-center gap-1.5 disabled:opacity-60"
                        >
                          <Pencil className="w-3.5 h-3.5" /> แก้ไข
                        </button>
                        <button
                          onClick={() => handleApprove(r)}
                          disabled={busy}
                          className={`px-3.5 py-2 rounded-lg text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-60 transition ${
                            confirmRow === r.row
                              ? 'bg-emerald-600 hover:bg-emerald-700 ring-2 ring-emerald-200'
                              : 'bg-teal-700 hover:bg-teal-800'
                          }`}
                        >
                          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          {confirmRow === r.row ? 'กดอีกครั้งเพื่อยืนยัน' : 'อนุมัติ'}
                        </button>
                        <button
                          onClick={() => {
                            setRejectRow(rejectRow === r.row ? null : r.row);
                            setConfirmRow(null);
                            setReason('');
                          }}
                          disabled={busy}
                          className="px-3.5 py-2 rounded-lg border border-rose-200 text-rose-700 text-xs font-semibold hover:bg-rose-50 flex items-center gap-1.5 disabled:opacity-60"
                        >
                          <X className="w-3.5 h-3.5" /> ปฏิเสธ
                        </button>
                      </div>
                      )}
                    </div>

                    {editRow === r.row && (
                      <EditRequestForm
                        request={r}
                        onCancel={() => setEditRow(null)}
                        onSaved={(edit) => handleEdited(r, edit)}
                      />
                    )}

                    {rowError?.row === r.row && (
                      <div className="mt-3 md:ml-[4.4rem] p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" /> <span>{rowError.msg}</span>
                      </div>
                    )}

                    {rejectRow === r.row && (
                      <div className="mt-3 md:ml-[4.4rem] bg-rose-50/60 border border-rose-200 rounded-xl p-3 space-y-2">
                        <label htmlFor={`reason-${r.row}`} className="text-xs font-semibold text-rose-800">
                          เหตุผลการปฏิเสธ (ไม่บังคับ — บันทึกไว้ในชีตคำขอ)
                        </label>
                        <textarea
                          id={`reason-${r.row}`}
                          rows={2}
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="เช่น ช่วงเวลานี้มีการใช้งานของผู้บริหารแล้ว ขอให้เลือกวันอื่น"
                          className="w-full text-xs rounded-lg border border-rose-200 px-3 py-2 focus:outline-none focus:border-rose-400 bg-white"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setRejectRow(null)}
                            className="px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-100"
                          >
                            ยกเลิก
                          </button>
                          <button
                            onClick={() => handleReject(r)}
                            disabled={busy}
                            className="px-3.5 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:opacity-60 flex items-center gap-1.5"
                          >
                            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} ยืนยันปฏิเสธ
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            /* ประวัติ: อนุมัติแล้ว / ปฏิเสธ */
            <div className="p-5 space-y-3">
              {shown.map((r) => {
                const approved = tab === 'approved';
                return (
                  <div
                    key={r.row}
                    className={`flex items-center gap-3 p-4 rounded-xl border ${
                      approved ? 'border-emerald-200 bg-emerald-50/50' : 'border-stone-200 bg-stone-50'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                        approved ? 'bg-emerald-100 text-emerald-600' : 'bg-stone-200 text-stone-500'
                      }`}
                    >
                      {approved ? <CheckCircle2 className="w-5 h-5" /> : <X className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={`font-semibold text-sm ${approved ? 'text-stone-800' : 'text-stone-600 line-through'}`}>
                        {r.topic}
                      </div>
                      <div className="text-xs text-stone-500">
                        {formatThaiDate(r.date, true)} · {r.time_start}–{r.time_end} น. · {r.dept} · {r.name} ({r.phone})
                      </div>
                      {!approved && r.reject_reason && (
                        <div className="text-[11px] text-rose-600 mt-0.5">เหตุผล: {r.reject_reason}</div>
                      )}
                    </div>
                    <div className="text-right text-[11px] shrink-0 text-stone-500">
                      {approved ? 'อนุมัติ' : 'ปฏิเสธ'}โดย {r.reviewed_by || '-'}
                      {r.reviewed_at && <div className="text-stone-400">{fmtSubmitted(r.reviewed_at)}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── ฟอร์มแก้คำขอ (วัน/เวลา/หัวข้อ/จำนวนคน/หมายเหตุ) ──
const EditRequestForm: React.FC<{
  request: BookingRequest;
  onCancel: () => void;
  onSaved: (edit: RequestEdit) => void;
}> = ({ request: r, onCancel, onSaved }) => {
  const [date, setDate] = useState(r.date);
  const [ts, setTs] = useState(r.time_start);
  const [te, setTe] = useState(r.time_end);
  const [topic, setTopic] = useState(r.topic);
  const [attendees, setAttendees] = useState<string>(String(r.attendees ?? ''));
  const [note, setNote] = useState(r.note || '');
  const [avail, setAvail] = useState<'idle' | 'checking' | 'free' | 'busy' | 'error'>('idle');
  const [conflict, setConflict] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const timeValid = !!date && !!ts && !!te && ts < te;
  const scheduleChanged = date !== r.date || ts !== r.time_start || te !== r.time_end;

  // เช็กห้องว่างเมื่อเปลี่ยนวัน/เวลา (ไม่นับคำขอตัวเอง)
  useEffect(() => {
    if (!timeValid) {
      setAvail('idle');
      return;
    }
    if (!scheduleChanged) {
      setAvail('free');
      setConflict(null);
      return;
    }
    let cancelled = false;
    setAvail('checking');
    const id = setTimeout(async () => {
      const res = await checkAvailability(date, ts, te, r.row);
      if (cancelled) return;
      if (!res.ok) setAvail('error');
      else if (res.available) {
        setAvail('free');
        setConflict(null);
      } else {
        setAvail('busy');
        setConflict(res.conflict);
      }
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [date, ts, te, timeValid, scheduleChanged, r.row]);

  const save = async () => {
    setError('');
    if (!topic.trim()) return setError('กรุณาระบุหัวข้อการประชุม');
    if (!timeValid) return setError('เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม');
    const edit: RequestEdit = {
      date,
      time_start: ts,
      time_end: te,
      topic: topic.trim(),
      attendees: attendees === '' ? '' : Number(attendees),
      note: note.trim(),
    };
    setSaving(true);
    const res = await updateRequest(r.row, edit);
    setSaving(false);
    if (res.ok) onSaved(edit);
    else if (res.code === 'SLOT_TAKEN') {
      setAvail('busy');
      setConflict(res.conflict);
      setError('ช่วงเวลาใหม่เพิ่งถูกจอง กรุณาเลือกเวลาอื่น');
    } else setError(res.error || 'บันทึกไม่สำเร็จ');
  };

  const inputCls =
    'w-full px-3 py-2 rounded-lg border border-stone-300 text-xs sm:text-sm focus:outline-none focus:border-teal-600 bg-white';
  const was = (changed: boolean, old: string) =>
    changed ? <span className="font-normal text-amber-700"> (เดิม {old})</span> : null;

  return (
    <div className="mt-3 md:ml-[4.4rem] bg-amber-50/50 border border-amber-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
        <Pencil className="w-3.5 h-3.5" /> แก้ไขคำขอ
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-3">
          <label htmlFor={`e-topic-${r.row}`} className="block text-xs font-semibold text-stone-700 mb-1">
            หัวข้อการประชุม
          </label>
          <input id={`e-topic-${r.row}`} value={topic} onChange={(e) => setTopic(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label htmlFor={`e-date-${r.row}`} className="block text-xs font-semibold text-stone-700 mb-1">
            วันที่{was(date !== r.date, formatThaiDate(r.date, true))}
          </label>
          <input id={`e-date-${r.row}`} type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label htmlFor={`e-ts-${r.row}`} className="block text-xs font-semibold text-stone-700 mb-1">
            เวลาเริ่ม{was(ts !== r.time_start, r.time_start)}
          </label>
          <input id={`e-ts-${r.row}`} type="time" step={60} value={ts} onChange={(e) => setTs(e.target.value)} className={inputCls + ' font-mono'} />
        </div>
        <div>
          <label htmlFor={`e-te-${r.row}`} className="block text-xs font-semibold text-stone-700 mb-1">
            เวลาสิ้นสุด{was(te !== r.time_end, r.time_end)}
          </label>
          <input id={`e-te-${r.row}`} type="time" step={60} value={te} onChange={(e) => setTe(e.target.value)} className={inputCls + ' font-mono'} />
        </div>
        <div>
          <label htmlFor={`e-att-${r.row}`} className="block text-xs font-semibold text-stone-700 mb-1">
            จำนวนผู้เข้าร่วม
          </label>
          <input id={`e-att-${r.row}`} type="number" min={1} max={60} value={attendees} onChange={(e) => setAttendees(e.target.value)} className={inputCls} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`e-note-${r.row}`} className="block text-xs font-semibold text-stone-700 mb-1">
            หมายเหตุ
          </label>
          <input
            id={`e-note-${r.row}`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="เช่น แก้วันที่ตามที่โทรยืนยันกับผู้ขอแล้ว"
            className={inputCls}
          />
        </div>
      </div>

      {!timeValid ? (
        <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 text-stone-500 text-xs">เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม</div>
      ) : avail === 'checking' ? (
        <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 text-stone-600 text-xs flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> กำลังตรวจสอบห้องว่าง...
        </div>
      ) : avail === 'busy' ? (
        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            ช่วงเวลาใหม่ไม่ว่าง{conflict?.kind ? ` (${conflict.kind})` : ''}
            {conflict?.topic ? ` · ${conflict.topic} ${conflict.time_start}–${conflict.time_end} น.` : ''}
          </span>
        </div>
      ) : avail === 'error' ? (
        <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs">ตรวจสอบห้องว่างไม่สำเร็จ ลองปรับเวลาอีกครั้ง</div>
      ) : (
        <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          {scheduleChanged ? 'วันและเวลาใหม่ว่าง — บันทึกได้' : 'วันและเวลาไม่เปลี่ยน'}
        </div>
      )}

      <p className="text-[11px] text-stone-500">ชื่อ เบอร์ อุปกรณ์ และ Zoom ของผู้ขอแก้ในขั้นนี้ไม่ได้</p>

      {error && (
        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">{error}</div>
      )}

      <div className="flex items-center justify-end gap-2">
        <button onClick={onCancel} className="px-3 py-2 rounded-lg border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-100">
          ยกเลิก
        </button>
        <button
          onClick={save}
          disabled={saving || avail !== 'free'}
          className="px-3.5 py-2 rounded-lg bg-stone-800 text-white text-xs font-bold hover:bg-stone-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          บันทึกการแก้ไข
        </button>
      </div>
    </div>
  );
};
