// Vercel Serverless Function — proxy ไป Google Apps Script (เลี่ยง CORS)
// browser → /api/gas (origin เดียวกับเว็บ) → GAS (ฝั่งเซิร์ฟเวอร์ ไม่มี CORS)

export const config = { maxDuration: 10 }; // Hobby cap = 10 วิ

const GAS_URL =
  'https://script.google.com/macros/s/AKfycbxJPCHLd3nzgbo4dyi6yu_lTNoPMOrqFtk5CnVkbRrfWHnP8x_n0hlgaPKnRJGn56La/exec';

// ตาม redirect ของ GAS เอง (302 → googleusercontent) พร้อม timeout กันค้าง
async function fetchFollow(
  startUrl: string,
  method: string,
  body?: string,
  timeoutMs = 9000
): Promise<{ status: number; text: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let url = startUrl;
    let curMethod = method;
    let curBody = body;

    for (let i = 0; i < 6; i++) {
      const init: any = {
        method: curMethod,
        redirect: 'manual',
        signal: controller.signal,
        headers: {},
      };
      if (curMethod === 'POST' && curBody != null) {
        init.headers['Content-Type'] = 'text/plain;charset=utf-8';
        init.body = curBody;
      }

      const r = await fetch(url, init);

      // ตาม redirect เอง
      if (r.status >= 300 && r.status < 400) {
        const loc = r.headers.get('location');
        if (!loc) {
          return { status: r.status, text: await r.text() };
        }
        url = loc.startsWith('http') ? loc : new URL(loc, url).toString();
        curMethod = 'GET'; // GAS redirect → ดึงผลด้วย GET เสมอ
        curBody = undefined;
        continue;
      }

      return { status: r.status, text: await r.text() };
    }
    return { status: 508, text: JSON.stringify({ ok: false, error: 'too many redirects' }) };
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req: any, res: any) {
  try {
    let result: { status: number; text: string };

    if (req.method === 'GET') {
      const qs = req.url && req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
      result = await fetchFollow(GAS_URL + qs, 'GET');
    } else if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {});
      result = await fetchFollow(GAS_URL, 'POST', body);
    } else {
      res.status(405).json({ ok: false, error: 'method not allowed' });
      return;
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send(result.text);
  } catch (err: any) {
    const msg = err?.name === 'AbortError' ? 'GAS ตอบช้าเกินกำหนด (timeout)' : (err?.message || 'unknown');
    res.status(502).json({ ok: false, error: 'proxy error: ' + msg });
  }
}
