/// <reference types="vite/client" />
// ตัวช่วย PWA: ลงทะเบียน service worker, เก็บสัญญาณ "ติดตั้งได้" (Android/คอมพิวเตอร์), ตรวจ iPhone/iPad
// ต้อง import ไฟล์นี้ตั้งแต่ต้น (main.tsx) เพราะเบราว์เซอร์ส่งสัญญาณติดตั้งมาเร็ว อาจก่อน React วาดเสร็จ

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };

let deferredPrompt: BIPEvent | null = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); // เก็บไว้ให้กดจากปุ่มของเราเอง
  deferredPrompt = e as BIPEvent;
  window.dispatchEvent(new Event('pwa-installable'));
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  window.dispatchEvent(new Event('pwa-installed'));
});

export const canPromptInstall = () => !!deferredPrompt;

export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferredPrompt) return 'unavailable';
  const ev = deferredPrompt;
  deferredPrompt = null; // ใช้ได้ครั้งเดียว
  await ev.prompt();
  const { outcome } = await ev.userChoice;
  window.dispatchEvent(new Event('pwa-installable'));
  return outcome;
}

// เปิดอยู่ในรูปแบบแอปแล้วหรือยัง
export const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  // iOS Safari
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

// iPhone / iPad (รวม iPad รุ่นใหม่ที่รายงานตัวเป็น Mac)
export const isIOS = () =>
  /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;
  window.addEventListener('load', async () => {
    const hadController = !!navigator.serviceWorker.controller;
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      // เช็กเวอร์ชันใหม่ทุกครั้งที่กลับมาเปิดแอป
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') reg.update().catch(() => {});
      });
    } catch (err) {
      console.warn('SW register failed:', err);
    }
    // SW ตัวใหม่เข้ามาคุมหน้า ขณะที่หน้านี้ยังรันโค้ดเวอร์ชันเก่า → บอกให้โหลดใหม่
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hadController) window.dispatchEvent(new Event('pwa-update'));
    });
  });
}
