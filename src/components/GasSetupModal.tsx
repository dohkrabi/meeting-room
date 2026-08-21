import React, { useState } from 'react';
import {
  X,
  Code2,
  Copy,
  Check,
  ExternalLink,
  Settings,
  ShieldCheck,
  Layers,
  Sparkles,
  Bell,
} from 'lucide-react';
import { getGasUrl, setGasUrl, DEFAULT_GAS_URL } from '../services/bookingService';

interface GasSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

const GAS_FULL_CODE = `// =====================================================
// ระบบจองห้องประชุม แขวงทางหลวงกระบี่
// Google Apps Script — version 2.0 (พร้อมระบบแจ้งเตือน 4 ระดับ)
// 1. เมื่อจองสำเร็จ
// 2. ล่วงหน้า 1 วัน
// 3. ล่วงหน้า 1 ชั่วโมง
// 4. ล่วงหน้า 30 นาที
// =====================================================

const CFG = {
  LINE_TOKEN:    'vxV4tQd0MMhWyMkZzF1WQ07JkRcAZbOtUBYNwhdT81/Q1907ovTVPqpD45PeJC5jFwBKYCylen58GSexPBzTc6ikHEQCPdop8evKwFZiBJuO0ZQw/tvTnFwyM9Na3G9pvVqasRT1qL2eH1ucvNMGrAdB04t89/1O/w1cDnyilFU=',
  LINE_GROUP_ID: 'C868abb047827e341510767e402e6af61',
  SHEET_NAME:    'การจองห้องประชุม',
  ROOM_NAME:     'ห้องประชุม แขวงทางหลวงกระบี่ ชั้น 3',
  CALENDAR_ID:   'primary',
  TZ:            'Asia/Bangkok',
};

const COL = {
  TIMESTAMP:  1,  // A = ประทับเวลา
  NAME:       2,  // B = ชื่อผู้จอง
  DEPT:       3,  // C = หน่วย/ฝ่าย
  DATE:       4,  // D = วันที่ประชุม
  TIME_START: 5,  // E = เวลาเริ่ม (HH:MM)
  TIME_END:   6,  // F = เวลาสิ้นสุด (HH:MM)
  TOPIC:      7,  // G = หัวข้อการประชุม
  ATTENDEES:  8,  // H = จำนวนผู้เข้าร่วม
  EQUIPMENT:  9,  // I = อุปกรณ์
  USE_ZOOM:   10, // J = ใช้ Zoom (TRUE/FALSE)
  ZOOM_URL:   11, // K = ลิงก์ Zoom
  MEET_ID:    12, // L = Meeting ID
  PASSCODE:   13, // M = Passcode
  NOTE:       14, // N = หมายเหตุ
  STATUS:     15, // O = สถานะ (จอง/ชนกัน/ยกเลิก)
  SENT_OK:    16, // P = แจ้ง_จองสำเร็จ (1. เมื่อจองสำเร็จ)
  SENT_1DAY:  17, // Q = แจ้ง_1วัน (2. ล่วงหน้า 1 วัน)
  SENT_1HR:   18, // R = แจ้ง_1ชม (3. ล่วงหน้า 1 ชม.)
  SENT_30MIN: 19, // S = แจ้ง_30นาที (4. ล่วงหน้า 30 นาที)
  CAL_ID:     20, // T = CalendarEventID
};

// ─────────────────────────────────────────────────────
// 1. ตรวจสอบและส่งแจ้งเตือนอัตโนมัติ (Time Trigger ทุก 10 นาที)
// ─────────────────────────────────────────────────────
function checkAndNotify() {
  const sheet = getSheet();
  const rows  = sheet.getDataRange().getValues();
  const now   = new Date();

  for (let i = 1; i < rows.length; i++) {
    const r      = rows[i];
    const status = String(r[COL.STATUS - 1] || '').trim();
    if (status === 'ยกเลิก' || status === 'ชนกัน') continue;

    const startTime = parseDateTime(r[COL.DATE - 1], r[COL.TIME_START - 1]);
    if (!startTime) continue;

    const diffMin  = (startTime.getTime() - now.getTime()) / 60000;
    const sheetRow = i + 1;

    // 2. แจ้งเตือนล่วงหน้า 1 วัน (ช่วง 23 ชม. ถึง 24.5 ชม. = 1380–1470 นาที)
    if (!r[COL.SENT_1DAY - 1] && diffMin >= 1380 && diffMin <= 1470) {
      sendLine(build1DayMsg(r));
      sheet.getRange(sheetRow, COL.SENT_1DAY).setValue(true);
    }

    // 3. แจ้งเตือนล่วงหน้า 1 ชั่วโมง (ช่วง 45 ถึง 75 นาที)
    if (!r[COL.SENT_1HR - 1] && diffMin >= 45 && diffMin <= 75) {
      sendLine(build1HrMsg(r));
      sheet.getRange(sheetRow, COL.SENT_1HR).setValue(true);
    }

    // 4. แจ้งเตือนล่วงหน้า 30 นาที (ช่วง 15 ถึง 35 นาที)
    if (!r[COL.SENT_30MIN - 1] && diffMin >= 15 && diffMin <= 35) {
      sendLine(build30MinMsg(r));
      sheet.getRange(sheetRow, COL.SENT_30MIN).setValue(true);
    }
  }
}

// ─────────────────────────────────────────────────────
// 2. API สำหรับ Web App (doGet / doPost)
// ─────────────────────────────────────────────────────
function doGet(e) {
  const sheet = getSheet();
  const rows  = sheet.getDataRange().getValues();

  const data = rows.slice(1)
    .map((r, idx) => ({ r, sheetRow: idx + 2 }))
    .filter(x => {
      const dateVal = x.r[COL.DATE - 1];
      return dateVal && String(dateVal).trim() !== '';
    })
    .map(x => {
      const r      = x.r;
      const status = String(r[COL.STATUS - 1] || '').trim();
      return {
        row:        x.sheetRow,
        name:       r[COL.NAME  - 1] || '',
        dept:       r[COL.DEPT  - 1] || '',
        date:       formatDate(r[COL.DATE - 1]),
        time_start: toStr(r[COL.TIME_START - 1]),
        time_end:   toStr(r[COL.TIME_END   - 1]),
        topic:      r[COL.TOPIC - 1] || '',
        attendees:  r[COL.ATTENDEES - 1] || '',
        equipment:  r[COL.EQUIPMENT - 1] || '',
        use_zoom:   r[COL.USE_ZOOM  - 1] || false,
        zoom_url:   r[COL.ZOOM_URL  - 1] || '',
        meeting_id: r[COL.MEET_ID   - 1] || '',
        passcode:   r[COL.PASSCODE  - 1] || '',
        note:       r[COL.NOTE      - 1] || '',
        status:     status || 'จอง',
        sent_ok:    !!r[COL.SENT_OK   - 1],
        sent_1day:  !!r[COL.SENT_1DAY - 1],
        sent_1hr:   !!r[COL.SENT_1HR  - 1],
        sent_30min: !!r[COL.SENT_30MIN- 1],
      };
    });

  return jsonOut({ ok: true, data, room: CFG.ROOM_NAME });
}

function doPost(e) {
  try {
    const p      = JSON.parse(e.postData.contents);
    const sheet  = getSheet();

    if (p.action === 'book')        return handleBook(sheet, p);
    if (p.action === 'update')      return handleUpdate(sheet, p);
    if (p.action === 'delete')      return handleDelete(sheet, p);
    if (p.action === 'cancel')      return handleCancel(sheet, p);
    if (p.action === 'test_notify') return handleTestNotify(p);

    return jsonOut({ ok: false, error: 'unknown action' });
  } catch(err) {
    return jsonOut({ ok: false, error: err.message });
  }
}

// ─────────────────────────────────────────────────────
// 3. จองห้องประชุม + 1. ส่งแจ้งเตือนเมื่อจองสำเร็จทันที
// ─────────────────────────────────────────────────────
function handleBook(sheet, p) {
  if (!p.name || !p.dept || !p.date || !p.time_start || !p.time_end || !p.topic) {
    return jsonOut({ ok: false, error: 'ข้อมูลไม่ครบถ้วน' });
  }
  const now      = new Date();
  const dateStr  = String(p.date).trim();
  const startStr = String(p.time_start).trim();
  const endStr   = String(p.time_end).trim();
  const newRow   = sheet.getLastRow() + 1;

  sheet.getRange(newRow, 1, 1, 4).setValues([[
    Utilities.formatDate(now, CFG.TZ, 'yyyy-MM-dd HH:mm:ss'),
    p.name, p.dept, dateStr
  ]]);
  sheet.getRange(newRow, 7, 1, 14).setValues([[
    p.topic, p.attendees || '', p.equipment || '',
    p.use_zoom || false, p.zoom_url || '', p.meeting_id || '',
    p.passcode || '', p.note || '', 'จอง',
    false, false, false, false, ''
  ]]);

  sheet.getRange(newRow, COL.TIME_START).setNumberFormat('@STRING@').setValue(startStr);
  sheet.getRange(newRow, COL.TIME_END).setNumberFormat('@STRING@').setValue(endStr);

  const rowData = sheet.getRange(newRow, 1, 1, 20).getValues()[0];

  // 1. แจ้งเตือนเมื่อจองสำเร็จทันที
  sendLine(buildBookingMsg(rowData));
  sheet.getRange(newRow, COL.SENT_OK).setValue(true);

  // เพิ่ม Google Calendar
  const calId = addToCalendar(rowData);
  if (calId) sheet.getRange(newRow, COL.CAL_ID).setValue(calId);

  return jsonOut({ ok: true });
}

// ─────────────────────────────────────────────────────
// 4. รูปแบบข้อความแจ้งเตือนทั้ง 4 รูปแบบ
// ─────────────────────────────────────────────────────

// 1. เมื่อจองสำเร็จ
function buildBookingMsg(r) {
  const dateLabel = formatThaiDate(r[COL.DATE - 1]);
  return [
    \`✅ จองห้องประชุมสำเร็จ\`,
    \`\`,
    \`🏢 \${CFG.ROOM_NAME}\`,
    \`📋 หัวข้อ: \${r[COL.TOPIC - 1]}\`,
    \`👤 ผู้จอง: \${r[COL.NAME - 1]} — \${r[COL.DEPT - 1]}\`,
    \`📅 วันที่: \${dateLabel}\`,
    \`⏰ เวลา: \${toStr(r[COL.TIME_START - 1])} – \${toStr(r[COL.TIME_END - 1])} น.\`,
    \`👥 ผู้เข้าร่วม: \${r[COL.ATTENDEES - 1]} คน\`,
    r[COL.EQUIPMENT - 1] ? \`🔧 อุปกรณ์: \${r[COL.EQUIPMENT - 1]}\` : '',
    r[COL.USE_ZOOM - 1]  ? \`📹 ใช้ระบบ Zoom: \${r[COL.ZOOM_URL - 1]}\` : '📍 ประชุม ณ ห้องประชุม ชั้น 3',
    r[COL.NOTE - 1]      ? \`📝 หมายเหตุ: \${r[COL.NOTE - 1]}\` : '',
  ].filter(Boolean).join('\\n');
}

// 2. ล่วงหน้า 1 วัน
function build1DayMsg(r) {
  const dateLabel = formatThaiDate(r[COL.DATE - 1]);
  return [
    \`🔔 แจ้งเตือน: มีการประชุมในวันพรุ่งนี้\`,
    \`\`,
    \`🏢 \${CFG.ROOM_NAME}\`,
    \`📋 เรื่อง: \${r[COL.TOPIC - 1]}\`,
    \`👤 ผู้จอง: \${r[COL.NAME - 1]} — \${r[COL.DEPT - 1]}\`,
    \`📅 วันที่: \${dateLabel}\`,
    \`⏰ เวลา: \${toStr(r[COL.TIME_START - 1])} – \${toStr(r[COL.TIME_END - 1])} น.\`,
    \`👥 ผู้เข้าร่วม: \${r[COL.ATTENDEES - 1]} คน\`,
    r[COL.USE_ZOOM - 1] ? \`📹 ลิงก์ Zoom: \${r[COL.ZOOM_URL - 1]}\` : '',
    \`\`,
    \`*กรุณาเตรียมเอกสารประกอบการประชุมล่วงหน้า*\`,
  ].filter(Boolean).join('\\n');
}

// 3. ล่วงหน้า 1 ชั่วโมง
function build1HrMsg(r) {
  const dateLabel = formatThaiDate(r[COL.DATE - 1]);
  return [
    \`🔔 แจ้งเตือน: การประชุมจะเริ่มในอีก 1 ชั่วโมง\`,
    \`\`,
    \`🏢 \${CFG.ROOM_NAME}\`,
    \`📋 เรื่อง: \${r[COL.TOPIC - 1]}\`,
    \`👤 ผู้จอง: \${r[COL.NAME - 1]} — \${r[COL.DEPT - 1]}\`,
    \`📅 วันที่: \${dateLabel}\`,
    \`⏰ เวลา: \${toStr(r[COL.TIME_START - 1])} – \${toStr(r[COL.TIME_END - 1])} น.\`,
    \`👥 ผู้เข้าร่วม: \${r[COL.ATTENDEES - 1]} คน\`,
    r[COL.EQUIPMENT - 1] ? \`🔧 อุปกรณ์: \${r[COL.EQUIPMENT - 1]}\` : '',
    r[COL.USE_ZOOM - 1]  ? \`📹 Zoom: \${r[COL.ZOOM_URL - 1]}\\n🆔 Meeting ID: \${r[COL.MEET_ID - 1]}\\n🔑 Passcode: \${r[COL.PASSCODE - 1]}\` : '',
  ].filter(Boolean).join('\\n');
}

// 4. ล่วงหน้า 30 นาที
function build30MinMsg(r) {
  return [
    \`⏰ แจ้งเตือนด่วน: การประชุมจะเริ่มในอีก 30 นาที\`,
    \`\`,
    \`🏢 \${CFG.ROOM_NAME}\`,
    \`📋 เรื่อง: \${r[COL.TOPIC - 1]}\`,
    \`👤 ผู้จอง: \${r[COL.NAME - 1]} — \${r[COL.DEPT - 1]}\`,
    \`⏰ วันนี้ เวลา: \${toStr(r[COL.TIME_START - 1])} – \${toStr(r[COL.TIME_END - 1])} น.\`,
    r[COL.EQUIPMENT - 1] ? \`🔧 อุปกรณ์: \${r[COL.EQUIPMENT - 1]}\` : '',
    r[COL.USE_ZOOM - 1]  ? \`📹 ลิงก์ Zoom: \${r[COL.ZOOM_URL - 1]}\` : '',
    \`\`,
    \`⚡ *กรุณาเปิดเครื่องปรับอากาศและทดสอบระบบก่อนเริ่มประชุม*\`,
  ].filter(Boolean).join('\\n');
}

// ─────────────────────────────────────────────────────
// 5. ติดตั้ง Trigger (รันครั้งเดียว)
// ─────────────────────────────────────────────────────
function setupTriggers() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));

  // ตรวจสอบส่งแจ้งเตือนทุกๆ 10 นาที
  ScriptApp.newTrigger('checkAndNotify')
    .timeBased().everyMinutes(10).create();

  Logger.log('✅ ตั้งค่า Trigger ระบบแจ้งเตือน 4 ระดับเรียบร้อยแล้ว');
}

function getSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CFG.SHEET_NAME);
}

function toStr(timeVal) {
  if (!timeVal) return '';
  if (timeVal instanceof Date) {
    const totalMin = Math.round(timeVal.getTime() / 60000) + new Date().getTimezoneOffset() * -1;
    const h = Math.floor(((totalMin % 1440) + 1440) % 1440 / 60);
    const m = ((totalMin % 1440) + 1440) % 1440 % 60;
    return \`\${String(h).padStart(2,'0')}:\${String(m).padStart(2,'0')}\`;
  }
  return String(timeVal).trim();
}

function formatDate(dateVal) {
  try {
    return Utilities.formatDate(new Date(dateVal), CFG.TZ, 'yyyy-MM-dd');
  } catch(e) { return String(dateVal); }
}

function formatThaiDate(dateVal) {
  try {
    const d = dateVal instanceof Date ? dateVal : new Date(dateVal);
    const months = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.',
                    'ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
    return \`\${d.getDate()} \${months[d.getMonth()]} \${d.getFullYear() + 543}\`;
  } catch(e) { return String(dateVal); }
}

function parseDateTime(dateVal, timeVal) {
  try {
    let year, month, day;
    if (dateVal instanceof Date) {
      year = dateVal.getFullYear(); month = dateVal.getMonth(); day = dateVal.getDate();
    } else {
      const s = String(dateVal).trim();
      if (!s) return null;
      if (s.includes('-')) {
        const p = s.split('-').map(Number);
        year = p[0]; month = p[1] - 1; day = p[2];
      } else if (s.includes('/')) {
        const p = s.split('/').map(Number);
        day = p[0]; month = p[1] - 1; year = p[2] > 2400 ? p[2] - 543 : p[2];
      } else return null;
    }
    let [h, m] = String(timeVal).split(':').map(Number);
    return new Date(year, month, day, h, m);
  } catch(e) { return null; }
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function sendLine(message) {
  try {
    UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
      method: 'post',
      contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + CFG.LINE_TOKEN },
      payload: JSON.stringify({
        to: CFG.LINE_GROUP_ID,
        messages: [{ type: 'text', text: message }]
      })
    });
  } catch(e) { Logger.log('Line error: ' + e.message); }
}`;

export const GasSetupModal: React.FC<GasSetupModalProps> = ({
  isOpen,
  onClose,
  onRefresh,
}) => {
  const [copied, setCopied] = useState(false);
  const [gasUrlInput, setGasUrlInput] = useState(getGasUrl());
  const [saveMsg, setSaveMsg] = useState('');

  if (!isOpen) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(GAS_FULL_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleSaveGasUrl = () => {
    setGasUrl(gasUrlInput.trim());
    setSaveMsg('บันทึก Web App URL สำเร็จ');
    setTimeout(() => {
      setSaveMsg('');
      onRefresh();
    }, 1200);
  };

  const handleResetDefaultUrl = () => {
    setGasUrlInput(DEFAULT_GAS_URL);
    setGasUrl(DEFAULT_GAS_URL);
    setSaveMsg('รีเซ็ตเป็น URL เริ่มต้นแล้ว');
    setTimeout(() => {
      setSaveMsg('');
      onRefresh();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/80 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-700 text-white flex items-center justify-center shadow-xs">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 font-['Prompt',sans-serif]">
                โค้ด Google Apps Script Backend (แจ้งเตือน 4 ระดับ)
              </h3>
              <p className="text-xs text-stone-500">
                1. เมื่อจองสำเร็จ · 2. ล่วงหน้า 1 วัน · 3. ล่วงหน้า 1 ชม. · 4. ล่วงหน้า 30 นาที
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

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1 text-xs sm:text-sm text-stone-700">
          {/* Notification Schedule Summary Card */}
          <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 space-y-3">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-indigo-700" />
              <h4 className="font-bold text-indigo-900 text-sm">
                เงื่อนไขการส่งแจ้งเตือนทั้ง 4 ขั้นตอน
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white border border-indigo-100">
                <span className="font-bold text-emerald-700">1. เมื่อจองสำเร็จ:</span>
                <p className="text-stone-600 mt-0.5">ส่งยืนยันเข้า LINE กลุ่มทันทีที่กดบันทึกการจอง</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-indigo-100">
                <span className="font-bold text-blue-700">2. ล่วงหน้า 1 วัน:</span>
                <p className="text-stone-600 mt-0.5">ส่งเตือนก่อนการประชุม 24 ชั่วโมง (วันก่อนหน้า)</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-indigo-100">
                <span className="font-bold text-amber-700">3. ล่วงหน้า 1 ชม.:</span>
                <p className="text-stone-600 mt-0.5">ส่งเตือน 60 นาทีก่อนเริ่ม พร้อมส่งข้อมูล Zoom</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-indigo-100">
                <span className="font-bold text-rose-700">4. ล่วงหน้า 30 นาที:</span>
                <p className="text-stone-600 mt-0.5">ส่งเตือนด่วน 30 นาทีก่อนเริ่ม ให้เจ้าหน้าที่เปิดแอร์/ไมค์</p>
              </div>
            </div>
          </div>

          {/* API URL Config */}
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center space-x-2">
              <Settings className="w-4 h-4 text-stone-700" />
              <h4 className="font-bold text-stone-900 text-xs">
                Web App URL สำหรับเชื่อมต่อ Google Apps Script
              </h4>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={gasUrlInput}
                onChange={(e) => setGasUrlInput(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-stone-300 text-xs font-mono bg-white focus:outline-none focus:border-indigo-600"
              />
              <button
                onClick={handleSaveGasUrl}
                className="px-4 py-2 rounded-xl bg-indigo-700 text-white font-bold text-xs hover:bg-indigo-800 transition"
              >
                บันทึก URL
              </button>
            </div>
            {saveMsg && <p className="text-xs font-semibold text-emerald-600">{saveMsg}</p>}
          </div>

          {/* Code Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-stone-800 text-xs">
                โค้ด Google Apps Script (Code.gs) พร้อมฟังก์ชัน <code>checkAndNotify()</code>
              </span>
              <button
                onClick={handleCopyCode}
                className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold transition"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'คัดลอกแล้ว!' : 'คัดลอกโค้ดทั้งหมด'}</span>
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-stone-900 text-stone-100 text-xs font-mono overflow-x-auto max-h-72 border border-stone-800 leading-relaxed">
              <code>{GAS_FULL_CODE}</code>
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-100 flex items-center justify-end bg-stone-50/80 shrink-0">
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
