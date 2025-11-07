// /api/login.js
import { serialize } from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).setHeader('Allow', 'POST').send('Method Not Allowed');
  }

  // body 파싱 (Next.js면 req.body 존재, 아닐 수도 있어 대비)
  const body = req.body || {};
  // 폼에서 hidden으로 넘겨줄 next(예: /templatecopy)
  const next = body.next;

  const { password } = body;
  if (password === process.env.MEMBER_PAGE_PASSWORD) {
    const cookie = serialize('vercel-auth-cookie', process.env.AUTH_COOKIE_VALUE, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      maxAge: 60 * 15,
      sameSite: 'strict',
      path: '/',
    });

    res.setHeader('Set-Cookie', cookie);
    // ✅ next 있으면 next로, 없으면 기존 경로 유지
    return res.redirect(302, next || '/private/Member.html');
  }

  // 실패 시 에러 표시 + next 보존
  const q = new URLSearchParams({ error: '1', ...(next ? { next } : {}) }).toString();
  return res.redirect(302, `/auth/login.html?${q}`);
}
