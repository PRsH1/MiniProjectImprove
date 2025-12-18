// api/auth.js
const { idp, sp } = require('../lib/saml');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { email, name, SAMLRequest, RelayState } = req.body;
  
  // samlify가 위 설정의 valueTag('email', 'name')를 여기서 찾습니다.
  const user = { email, name };

  try {
    // [수정] 콜백 함수 제거 -> 기본 설정(lib/saml.js)을 따르도록 함
    const { context } = await idp.createLoginResponse(
      sp,
      { extract: { request: { id: 'request_id' } } },
      'post',
      user
    );

    // 로그 확인
    console.log("🚀 SAML Response Generated");
    console.log(context); 
    console.log("User Info:", user);
    

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