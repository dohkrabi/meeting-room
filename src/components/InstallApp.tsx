import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, X, Share, SquarePlus, RefreshCw } from 'lucide-react';
import { canPromptInstall, promptInstall, isStandalone, isIOS } from '../pwa';

/** ปุ่ม "ติดตั้งแอป" — โชว์เมื่อยังไม่ได้ติดตั้ง และเครื่องติดตั้งได้ */
export const InstallAppButton: React.FC = () => {
  const [installable, setInstallable] = useState(canPromptInstall());
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installed, setInstalled] = useState(isStandalone());
  const ios = isIOS();

  useEffect(() => {
    const onAvail = () => setInstallable(canPromptInstall());
    const onInstalled = () => setInstalled(true);
    window.addEventListener('pwa-installable', onAvail);
    window.addEventListener('pwa-installed', onInstalled);
    return () => {
      window.removeEventListener('pwa-installable', onAvail);
      window.removeEventListener('pwa-installed', onInstalled);
    };
  }, []);

  if (installed || (!installable && !ios)) return null;

  const onClick = async () => {
    if (canPromptInstall()) await promptInstall();
    else if (ios) setShowIOSGuide(true);
  };

  return (
    <>
      <button
        onClick={onClick}
        title="ติดตั้งเป็นแอปบนเครื่องนี้"
        className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors"
      >
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">ติดตั้งแอป</span>
      </button>
      {showIOSGuide && createPortal(<IOSInstallGuide onClose={() => setShowIOSGuide(false)} />, document.body)}
    </>
  );
};

/** วิธีเพิ่มลงหน้าจอโฮมบน iPhone / iPad (Safari ไม่มีปุ่มติดตั้งที่เว็บเรียกได้) */
const IOSInstallGuide: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const iPad = navigator.platform === 'MacIntel' || /iPad/i.test(navigator.userAgent);
  return (
    <div className="fixed inset-0 z-[90] bg-stone-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ios-guide-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src="/icons/icon-b.svg" alt="" className="w-14 h-14 rounded-2xl shadow-md" />
            <div>
              <h3 id="ios-guide-title" className="font-bold text-stone-900 font-['Prompt',sans-serif]">
                ติดตั้ง DOH-Krabi Meeting
              </h3>
              <p className="text-xs text-stone-500">เพิ่มลงหน้าจอโฮม ใช้งานแบบแอปเต็มจอ</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="ปิด" className="p-1.5 rounded-lg text-stone-400 hover:bg-stone-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <ol className="space-y-3 text-sm text-stone-700">
          <li className="flex items-start gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">1</span>
            <span>
              แตะปุ่ม <b>แชร์</b> <Share className="inline w-4 h-4 text-blue-600 -mt-0.5" />{' '}
              {iPad ? 'ที่มุมขวาบนของ Safari' : 'ที่แถบล่างของ Safari'}
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">2</span>
            <span>
              เลื่อนลงแล้วแตะ <b>เพิ่มไปยังหน้าจอโฮม</b> <SquarePlus className="inline w-4 h-4 -mt-0.5" />
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">3</span>
            <span>
              แตะ <b>เพิ่ม</b> มุมขวาบน · ไอคอน "Krabi Meeting" จะอยู่บนหน้าจอโฮม
            </span>
          </li>
        </ol>

        <p className="text-[11px] text-stone-500 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2">
          ถ้าไม่เห็นเมนูนี้ ให้เปิดหน้าเว็บนี้ด้วย <b>Safari</b> ก่อน
        </p>

        <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-indigo-700 text-white text-sm font-bold hover:bg-indigo-800">
          เข้าใจแล้ว
        </button>
      </div>
    </div>
  );
};

/** แถบ "มีเวอร์ชันใหม่" — โชว์เมื่อ deploy ใหม่ระหว่างที่แอปเปิดค้างอยู่ */
export const UpdateToast: React.FC = () => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(true);
    window.addEventListener('pwa-update', on);
    return () => window.removeEventListener('pwa-update', on);
  }, []);
  if (!show) return null;
  return (
    <div className="fixed left-1/2 -translate-x-1/2 z-[95] px-4 w-full max-w-md" style={{ bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}>
      <button
        onClick={() => window.location.reload()}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-stone-900 text-white shadow-2xl text-sm"
      >
        <span>มีเวอร์ชันใหม่ของระบบ</span>
        <span className="inline-flex items-center gap-1.5 font-bold text-amber-300">
          <RefreshCw className="w-4 h-4" /> แตะเพื่อโหลด
        </span>
      </button>
    </div>
  );
};
