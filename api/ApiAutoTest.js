// /api/ApiAutoTest.js
import { promises as fs } from 'fs';
import path from 'path';
import { parse } from 'cookie';

export default async function handler(req, res) {
  const cookies = parse(req.headers.cookie || '');
  // API 자동 테스트 페이지용 쿠키 이름 사용
  const authCookie = cookies['vercel-auth-apiautotest'];

  if (authCookie === process.env.AUTH_COOKIE_VALUE) {
    try {
      const filePath = path.join(process.cwd(), 'private', 'ApiAutoTest.html');
      const html = await fs.readFile(filePath, 'utf8');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(html);
    } catch (err) {
      console.error('ApiAutoTest read error:', err);
      return res.status(500).send('Error loading page.');
    }
  }

  const next = encodeURIComponent('/ApiAutoTest');
  res.redirect(302, `/auth/login.html?next=${next}`);
}
