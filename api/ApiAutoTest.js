// /api/ApiAutoTest.js
import { promises as fs } from 'fs';
import path from 'path';
import { parse } from 'cookie';

export default async function handler(req, res) {
  const cookies = parse(req.headers.cookie || '');
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
  return res.redirect(302, `/auth/login.html?next=${next}&scope=apiautotest`);
}
