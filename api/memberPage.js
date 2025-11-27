// /api/memberPage.js
import { promises as fs } from 'fs';
import path from 'path';
import { parse } from 'cookie';

export default async function handler(req, res) {
  const cookies = parse(req.headers.cookie || '');
  const authCookie = cookies['vercel-auth-member'];

  if (authCookie === process.env.AUTH_COOKIE_VALUE) {
    try {
      const filePath = path.join(process.cwd(), 'private', 'Member.html');
      const html = await fs.readFile(filePath, 'utf8');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(html);
    } catch (err) {
      console.error('Member read error:', err);
      return res.status(500).send('Error loading page.');
    }
  }

  const next = encodeURIComponent('/private/Member.html'); // 또는 너가 쓰는 멤버 경로
  return res.redirect(302, `/auth/login.html?next=${next}&scope=member`);
}
