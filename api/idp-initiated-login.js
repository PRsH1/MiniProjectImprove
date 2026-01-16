// api/idp-initiated-login.js
const { idp, sp } = require('../lib/saml');

module.exports = async (req, res) => {
  // 1. 테스트 페이지에서 보낸 사용자 정보 수신
  const { email, name } = req.body; // POST 방식이므로 body에서 꺼냄

  if (!email || !name) {
    return res.status(400).send("이메일과 이름이 필요합니다.");
  }

  // 2. 템플릿 치환을 위한 사용자 객체 생성
  // lib/saml.js의 템플릿에 있는 {email}, {name}, {NameID} 등을 채워줍니다.
  const user = {
    email: email,
    name: name,
    NameID: email // Subject의 NameID도 이메일로 설정
  };

  try {
    // 3. SAML Response 생성 (IdP Initiated)
    // request_id가 없으므로 두 번째 인자는 빈 객체 {} 로 넘깁니다.
    const { context } = await idp.createLoginResponse(
      sp,
      {}, // parseResult: IdP Initiated이므로 요청 정보 없음
      'post',
      user
    );

    // [디버그] 로그
    console.log(`🚀 IdP Initiated Login: ${email} (${name})`);

    // 4. eformsign으로 자동 전송 (Auto-POST)
    const acsUrl = 'https://test-kr-service.eformsign.com/v1.0/saml_redirect';

    res.setHeader('Content-Type', 'text/html');
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Redirecting to eformsign...</title>
      </head>
      <body onload="document.forms[0].submit()">
        <form method="POST" action="${acsUrl}">
          <input type="hidden" name="SAMLResponse" value="${context}">
          <input type="hidden" name="RelayState" value=""> 
        </form>
        <div style="text-align:center; margin-top: 20%; font-family: sans-serif;">
          <p>eformsign으로 안전하게 이동 중입니다...</p>
          <p>잠시만 기다려주세요.</p>
        </div>
      </body>
      </html>
    `);

  } catch (e) {
    console.error("❌ SSO Error:", e);
    res.status(500).send('SSO Generation Failed: ' + e.message);
  }
};