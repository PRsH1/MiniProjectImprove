// api/auth.js
const { idp, sp } = require('../lib/saml');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { email, name, RelayState } = req.body;
  const user = { email, name };

  try {
    const { context } = await idp.createLoginResponse(
      sp,
      { extract: { request: { id: 'request_id' } } },
      'post',
      user
      // 커스텀 치환 콜백은 우선 제거
    );

    const acsUrl = 'https://test-kr-service.eformsign.com/v1.0/saml_redirect';
    console.log("✅ SAML Response generated, redirecting to ACS:", acsUrl);
    console.log("SAML Response Context:", context);
    console.log("RelayState:", RelayState);
    console.log("User Info:", user);
    console.log("user name: ", name);
    console.log("Request ID:", 'request_id');
    console.log("Timestamp:", new Date().toISOString());
    console.log("--------------------------------------------------");
    

    res.setHeader('Content-Type', 'text/html');
    res.send(`
      <!DOCTYPE html>
      <html>
      <body onload="document.forms[0].submit()">
        <form method="POST" action="${acsUrl}">
          <input type="hidden" name="SAMLResponse" value="${context}">
          <input type="hidden" name="RelayState" value="${RelayState || ''}">
        </form>
        <p>eformsign 으로 이동 중입니다...</p>
      </body>
      </html>
    `);
  } catch (e) {
    console.error("❌ SAML Generation Error:", e);
    res.status(500).send('SAML Error: ' + e.message);
  }
};
