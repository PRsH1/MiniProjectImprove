const { idp, sp } = require('../lib/saml');

module.exports = async (req, res) => {
  const { email, name } = req.body; 

  if (!email || !name) {
    return res.status(400).send("이메일과 이름이 필요합니다.");
  }

  const user = {
    email: email,
    name: name,
    NameID: email
  };

  try {
  const { context } = await idp.createLoginResponse(
  sp,
  { extract: { request: { id: 'idp_initiated' } } }, // 더미 ID 제공
  'post',
  user
);

    console.log(`🚀 IdP Initiated Login: ${email} (${name})`);
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