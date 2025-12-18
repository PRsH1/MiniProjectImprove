// api/auth.js
const { idp, sp } = require('../lib/saml');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { email, name, RelayState } = req.body;
  const user = { email, name };

  const { context } = await idp.createLoginResponse(
    sp,
    { extract: { request: { id: 'request_id' } } },
    'post',
    user
  );

  // ✅ 디버그: AttributeStatement 포함 여부 즉시 확인
  const xml = Buffer.from(context, 'base64').toString('utf-8');
  console.log('has AttributeStatement?', xml.includes('AttributeStatement'));
  console.log(xml); // 필요 시 전체 출력
  console.log('----');

  // eformsign ACS URL로 POST 폼 전송

  const acsUrl = 'https://test-kr-service.eformsign.com/v1.0/saml_redirect';
  res.setHeader('Content-Type', 'text/html');
  res.send(`
    <!doctype html><html><body onload="document.forms[0].submit()">
      <form method="POST" action="${acsUrl}">
        <input type="hidden" name="SAMLResponse" value="${context}">
        <input type="hidden" name="RelayState" value="${RelayState || ''}">
      </form>
      <p>eformsign 으로 이동 중입니다...</p>
    </body></html>
  `);
};
