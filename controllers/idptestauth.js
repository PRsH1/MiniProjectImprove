const { promises: fs } = require('fs');
const path = require('path');
const { parse } = require('cookie');

module.exports = async function handler(req, res) {
  const cookies = parse(req.headers.cookie || '');
  const authCookie = cookies['vercel-auth-idp-test'];

  if (authCookie === process.env.AUTH_COOKIE_VALUE) {
    try {
      const filePath = path.join(process.cwd(), 'private', 'idp-test.html');
      const html = await fs.readFile(filePath, 'utf8');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(html);
    } catch (err) {
      console.error('IDP Test read error:', err);
      return res.status(500).send('Error loading page.');
    }
  }

  const next = encodeURIComponent('/idptestauth');
  return res.redirect(302, `/auth/login.html?next=${next}&scope=idptestauth`);
};