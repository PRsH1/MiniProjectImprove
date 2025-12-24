// api/auth.js
const { idp, sp } = require('../lib/saml');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { email, name, SAMLRequest, RelayState } = req.body;

  // 템플릿의 {email}, {name}, {NameID} 치환자와 매핑될 객체입니다.
  const user = { 
    email: email, 
    name: name,
    NameID: email // Subject NameID도 이메일로 설정
  };

  try {
    // 이제 콜백 함수 없이 호출해도 됩니다.
    // 라이브러리가 lib/saml.js에 정의된 템플릿을 사용하여 값을 채웁니다.
    const { context } = await idp.createLoginResponse(
      sp,
      { extract: { request: { id: 'request_id' } } }, // 필요 시 ID 파싱 로직 추가 가능
      'post',
      user
    );

    // [디버그] 결과 확인
    const hasAttributes = context.includes('AttributeStatement');
    console.log(`🚀 SAML Response Generated. Has Attributes? ${hasAttributes}`);
    
    // eformsign ACS URL로 전송
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