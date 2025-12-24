// api/auth.js
const { idp, sp } = require('../lib/saml');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { email, name, SAMLRequest, RelayState } = req.body;

  // lib/saml.js의 valueTag('email', 'name')와 일치하는 키를 가진 객체 생성
  const user = { 
    email: email, 
    name: name
  };

  try {
    // createLoginResponse 호출 (콜백 함수 불필요)
    const { context } = await idp.createLoginResponse(
      sp,
      { extract: { request: { id: 'request_id' } } },
      'post',
      user 
    );

    // [디버그] 속성 포함 여부 확인
    const hasAttributes = context.includes('AttributeStatement');
    console.log(`🚀 SAML Response Generated. Has Attributes? ${hasAttributes}`);
    console.log('Generated SAML Response:', context);
    console.log('User Info:', user);

    // eformsign ACS URL로 자동 제출 폼 생성

    const acsUrl = 'https://test-kr-service.eformsign.com/v1.0/saml_redirect';
    
    res.setHeader('Content-Type', 'text/html');
    res.send(`
      <!DOCTYPE html>
      <html>
      <body onload="document.forms[0].submit()">
        <form method="POST" action="${acsUrl}">
          <input type="hidden" name="SAMLResponse" value="${context}">
          <input type="hidden" name="RelayState" value="${RelayState || ''}">
        </form>
        <p>eformsign으로 이동 중입니다...</p>
      </body>
      </html>
    `);

  } catch (e) {
    console.error("❌ SAML Error:", e);
    res.status(500).send('SAML Error: ' + e.message);
  }
};