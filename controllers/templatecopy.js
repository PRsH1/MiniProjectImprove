const { promises: fs } = require('fs');
const path = require('path');
const { parse } = require('cookie');

module.exports = async function handler(req, res) {
  const cookies = parse(req.headers.cookie || '');
  const authCookie = cookies['vercel-auth-templatecopy'];

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

  const next = encodeURIComponent('/templatecopy');
  return res.redirect(302, `/auth/login.html?next=${next}&scope=templatecopy`);
};