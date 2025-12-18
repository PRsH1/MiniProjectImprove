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

    // [로그 확인] 최종 생성된 XML 확인
    console.log("🚀 [SAML Response Generated]");
    console.log(context); 

    
    const acsUrl = 'https://test-kr-service.eformsign.com/v1.0/saml_redirect';
    
    const autoPostHtml = `
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
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(autoPostHtml);

  } catch (e) {
    console.error("❌ SAML Generation Error:", e);
    res.status(500).send('SAML Error: ' + e.message);
  }
};

// [핵심 수정 함수]
function createTemplateCallback(user) {
  return (template) => {
    const now = new Date().toISOString();
    const uniqueSessionId = 'session_' + Date.now();
    
    // 1. AuthnStatement (로그인 인증 정보)
    const authnStatement = `
      <saml:AuthnStatement AuthnInstant="${now}" SessionIndex="${uniqueSessionId}">
        <saml:AuthnContext>
          <saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:unspecified</saml:AuthnContextClassRef>
        </saml:AuthnContext>
      </saml:AuthnStatement>
    `;

    // 2. AttributeStatement (사용자 속성 정보 - Azure 포맷)
    const attributesStatement = `
      <saml:AttributeStatement>
        <saml:Attribute Name="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
          <saml:AttributeValue xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema" xsi:type="xs:string">${user.email}</saml:AttributeValue>
        </saml:Attribute>
        
        <saml:Attribute Name="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
          <saml:AttributeValue xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema" xsi:type="xs:string">${user.name}</saml:AttributeValue>
        </saml:Attribute>
      </saml:AttributeStatement>
    `;

   
    const targetTag = '</saml:Assertion>';

    // 만약 template에 이 태그가 없다면 로그에 경고를 출력합니다.
    if (!template.includes(targetTag)) {
        console.error("❌ Template replacement failed: '</saml:Assertion>' tag not found in template.");
        console.log("Template dump:", template);
        return { id: 'error', context: template };
    }

    const newContext = template.replace(
      targetTag, 
      `${authnStatement}${attributesStatement}${targetTag}`
    );

    console.log("✅ Custom Attributes Injected Successfully");

    return {
      id: 'response_id_' + Date.now(),
      context: newContext
    };
  };
}