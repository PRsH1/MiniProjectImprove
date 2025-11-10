// /api/templatecopy.js
import { promises as fs } from 'fs';
import path from 'path';
import { parse } from 'cookie';

export default async function handler(req, res) {
  const cookies = parse(req.headers.cookie || '');
  const authCookie = cookies['vercel-auth-cookie'];

  if (authCookie === process.env.AUTH_COOKIE_VALUE) {
    try {
      const filePath = path.join(process.cwd(), 'private', 'templatecopy.html');
      const html = await fs.readFile(filePath, 'utf8');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(html);
    } catch (err) {
      console.error('templatecopy read error:', err);
      return res.status(500).send('Error loading page.');
    }
  }

  // 인증 실패 시: 기존 로그인 페이지로, next 전달
  const next = encodeURIComponent('/templatecopy');
  res.redirect(302, `/auth/login.html?next=${next}`);
}
