// api/auth.js
const { idp, sp } = require('../lib/saml');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { email, name, SAMLRequest, RelayState } = req.body;
  const user = { email, name };

  try {
    // 1. SAML Response 생성
    const { context } = await idp.createLoginResponse(
      sp,
      { extract: { request: { id: 'request_id' } } }, 
      'post',
      user,
      createTemplateCallback(user)
    );

    // [로그 기능 추가]
    console.log("==================================================");
    console.log("🚀 [SAML Response Debug Log]");
    console.log("User Email:", email);
    console.log("User Name:", name);
    console.log("Generated XML:\n", context); // 디코딩된 XML 원본 출력
    console.log("==================================================");

    // 2. 자동 폼 제출 HTML 생성
    const acsUrl = 'https://test-kr-service.eformsign.com/v1.0/saml_redirect';
    
    const autoPostHtml = `
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
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(autoPostHtml);

  } catch (e) {
    console.error("❌ SAML Generation Error:", e);
    res.status(500).send('SAML Error: ' + e.message);
  }
};

// [핵심 수정] Azure AD 표준 Claim URI 적용
function createTemplateCallback(user) {
  return (template) => {
    // Attribute XML 부분을 Azure AD 표준 Claim URI로 대체
    const attributesXml = `
      <saml:Attribute xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" Name="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
        <saml:AttributeValue xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema" xsi:type="xs:string">${user.email}</saml:AttributeValue>
      </saml:Attribute>
      
      <saml:Attribute xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" Name="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
        <saml:AttributeValue xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema" xsi:type="xs:string">${user.name}</saml:AttributeValue>
      </saml:Attribute>
    `;

    const newContext = template.replace(
      '</saml:AttributeStatement>', 
      `${attributesXml}</saml:AttributeStatement>`
    );

    return {
      id: 'response_id_' + Date.now(),
      context: newContext
    };
  };
}