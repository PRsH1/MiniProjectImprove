// api/auth.js
const { idp, sp } = require('../lib/saml');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { email, name, RelayState } = req.body;

  // ★ valueTag(user.email/user.name) 대비 + 기존 호환까지 같이
  const user = {
    email,
    name,
    user: { email, name },
  };

  const { context } = await idp.createLoginResponse(
    sp,
    { extract: { request: { id: 'request_id' } } },
    'post',
    user
  );

  // (디버그) 여기서 true가 떠야 정상
  const decoded = Buffer.from(context, 'base64').toString('utf-8');
  console.log('has AttributeStatement?', decoded.includes('<saml:AttributeStatement'));
  console.log('SAML Response:', decoded);
  console.log('context (base64):', context);    
  console.log('RelayState:', RelayState);
  console.log('User Info:', user);
  console.log('user name:', name);
  console.log('---');

  const acsUrl = 'https://test-kr-service.eformsign.com/v1.0/saml_redirect';
  res.setHeader('Content-Type', 'text/html');
  res.send(`
    <!DOCTYPE html><html><body onload="document.forms[0].submit()">
      <form method="POST" action="${acsUrl}">
        <input type="hidden" name="SAMLResponse" value="${context}">
        <input type="hidden" name="RelayState" value="${RelayState || ''}">
      </form>
    </body></html>
  `);
};
