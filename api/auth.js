// api/auth.js
const { idp, sp } = require('../lib/saml');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { email, name, SAMLRequest, RelayState } = req.body;
  const user = { email, name };

  try {
    // createTemplateCallback을 사용하여 XML 생성 과정에 개입
    const { context } = await idp.createLoginResponse(
      sp,
      { extract: { request: { id: 'request_id' } } },
      'post',
      user,
      createTemplateCallback(user)
    );

    // [디버그] 주입된 결과 확인
    // 배포 후 Vercel 로그에서 "AttributeStatement"가 포함되어 있는지 확인하세요.
    const hasAttributes = context.includes('AttributeStatement');
    console.log(`🚀 SAML Response Generated. Has Attributes? ${hasAttributes}`);
    console.log("SAML Response: ", context);
    console.log("User Info: ", user);

    // eformsign ACS URL로 자동 POST 폼 전송

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

/**
 * XML 템플릿 수정 콜백
 */
function createTemplateCallback(user) {
  return (template) => {
    const now = new Date().toISOString();
    const sessionId = 'session_' + Date.now();
    
    // 1. 주입할 XML 조각 (Azure AD 표준 속성)
    const injectionXml = `
      <saml:AuthnStatement AuthnInstant="${now}" SessionIndex="${sessionId}">
        <saml:AuthnContext>
          <saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:unspecified</saml:AuthnContextClassRef>
        </saml:AuthnContext>
      </saml:AuthnStatement>
      <saml:AttributeStatement>
        <saml:Attribute Name="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
          <saml:AttributeValue xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema" xsi:type="xs:string">${user.email}</saml:AttributeValue>
        </saml:Attribute>
        <saml:Attribute Name="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
          <saml:AttributeValue xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema" xsi:type="xs:string">${user.name}</saml:AttributeValue>
        </saml:Attribute>
      </saml:AttributeStatement>
    `;

   
    const assertionCloseRegex = /<\/[a-zA-Z0-9_:-]*Assertion>/;
    const match = template.match(assertionCloseRegex);

    if (!match) {
        console.error("❌ CRITICAL: Could not find closing Assertion tag via Regex.");
        console.log("Template Preview:", template.substring(template.length - 200)); // 템플릿 끝부분 출력해보기
        return { id: 'error', context: template };
    }

    const closingTag = match[0];
    console.log(`✅ Found closing tag: ${closingTag}. Injecting attributes...`);

    // 3. 치환
    const newContext = template.replace(
      closingTag, 
      injectionXml + closingTag
    );

    return {
      id: 'response_id_' + Date.now(),
      context: newContext
    };
  };
}