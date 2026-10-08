// Service worker — DOH-Krabi Meeting
// หลักการ (กันปัญหา "มือถือค้างเวอร์ชันเก่า"):
//  1) หน้า HTML: โหลดจากเน็ตก่อนเสมอ (network-first) → deploy ใหม่เห็นทันที; ออฟไลน์ค่อยใช้ตัวที่เก็บไว้
//  2) ไฟล์ใน /assets/ (ชื่อไฟล์มี hash เปลี่ยนทุก build): เก็บในเครื่อง (cache-first) ไม่มีวันค้างเพราะชื่อใหม่ทุกครั้ง
//  3) /api/ (ข้อมูลการจอง): ไม่แตะเลย ปล่อยผ่านเน็ตตรง — ข้อมูลที่เห็นเป็นของจริงเสมอ
//  4) ติดตั้งตัวใหม่แล้วทำงานทันที (skipWaiting + clients.claim) ไม่ต้องปิด-เปิดแอปสองรอบ
const VERSION = 'v1';
const SHELL_CACHE = `krabi-meeting-shell-${VERSION}`;
const ASSET_CACHE = `krabi-meeting-assets-${VERSION}`;
const MAX_ASSETS = 60;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((c) => c.addAll(['/', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/favicon.svg']))
      .catch(() => {}) // precache ไม่ได้ (เช่นเน็ตหลุด) ก็ยังติดตั้ง SW ได้
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== SHELL_CACHE && k !== ASSET_CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

async function trimAssets() {
  const cache = await caches.open(ASSET_CACHE);
  const keys = await cache.keys();
  if (keys.length > MAX_ASSETS) {
    await Promise.all(keys.slice(0, keys.length - MAX_ASSETS).map((k) => cache.delete(k)));
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // ฟอนต์/CDN ภายนอก: ให้เบราว์เซอร์จัดการเอง
  if (url.pathname.startsWith('/api/')) return; // ข้อมูลการจอง: ห้ามแคช

  // หน้า HTML: เน็ตก่อน → ออฟไลน์ใช้ตัวที่เก็บไว้
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(SHELL_CACHE).then((c) => c.put('/', copy));
          }
          return res;
        })
        .catch(() => caches.match('/').then((r) => r || Response.error()))
    );
    return;
  }

  // ไฟล์ build ที่มี hash: ใช้ในเครื่องก่อน
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(ASSET_CACHE).then((c) => c.put(req, copy).then(trimAssets));
            }
            return res;
          })
      )
    );
    return;
  }

  // ไฟล์อื่นในเว็บ (ไอคอน, manifest): ใช้ตัวในเครื่องทันที แล้วอัปเดตเบื้องหลัง
  event.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(SHELL_CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => hit);
      return hit || net;
    })
  );
});
