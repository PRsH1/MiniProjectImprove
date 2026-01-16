const { serialize } = require('cookie');

const PAGE_CONFIG = {
  member: {
    passwordEnv: 'MEMBER_PAGE_PASSWORD',
    cookieName: 'vercel-auth-member',
    defaultNext: '/private/Member.html',
  },
  templatecopy: {
    passwordEnv: 'TEMPLATECOPY_PAGE_PASSWORD',
    cookieName: 'vercel-auth-templatecopy',
    defaultNext: '/templatecopy',
  },
  apiautotest: {
    passwordEnv: 'APIAUTOTEST_PAGE_PASSWORD',
    cookieName: 'vercel-auth-apiautotest',
    defaultNext: '/ApiAutoTest',
  },
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Method Not Allowed');
  }

  const body = req.body || {};
  const next = body.next || '';
  const scope = body.scope || 'member'; 
  const password = body.password || '';

  const cfg = PAGE_CONFIG[scope] || PAGE_CONFIG.member;
  const expectedPassword = process.env[cfg.passwordEnv];

  if (expectedPassword && password === expectedPassword) {
    const cookie = serialize(cfg.cookieName, process.env.AUTH_COOKIE_VALUE, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      maxAge: 60 * 15, // 15분
      sameSite: 'strict',
      path: '/',
    });

    res.setHeader('Set-Cookie', cookie);
    return res.redirect(302, next || cfg.defaultNext);
  }

  const params = new URLSearchParams();
  params.set('error', '1');
  if (next) params.set('next', next);
  params.set('scope', scope);

  return res.redirect(302, `/auth/login.html?${params.toString()}`);
};