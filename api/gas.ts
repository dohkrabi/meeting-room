// Vercel Serverless Function — proxy ไป Google Apps Script (เลี่ยง CORS)
// browser → /api/gas (origin เดียวกับเว็บ) → GAS (ฝั่งเซิร์ฟเวอร์ ไม่มี CORS)

const GAS_URL =
  'https://script.google.com/macros/s/AKfycbxJPCHLd3nzgbo4dyi6yu_lTNoPMOrqFtk5CnVkbRrfWHnP8x_n0hlgaPKnRJGn56La/exec';

export default async function handler(req: any, res: any) {
  try {
    let upstream: Response;

    if (req.method === 'GET') {
      // ส่งต่อ query string (เช่น ?t=timestamp) ไปด้วย
      const qs = req.url && req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
      upstream = await fetch(GAS_URL + qs, { method: 'GET', redirect: 'follow' });
    } else if (req.method === 'POST') {
      // req.body อาจเป็น object (Vercel parse ให้) หรือ string
      const body =
        typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {});
      upstream = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body,
        redirect: 'follow',
      });
    } else {
      res.status(405).json({ ok: false, error: 'method not allowed' });
      return;
    }

    const text = await upstream.text();
    // ส่งกลับเป็น JSON ตามที่ GAS ตอบ (GAS ตอบ JSON เสมอ)
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send(text);
  } catch (err: any) {
    res.status(502).json({ ok: false, error: 'proxy error: ' + (err?.message || 'unknown') });
  }
}
