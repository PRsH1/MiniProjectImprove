// api/auth.js
const { idp, sp } = require('../lib/saml');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { email, name, SAMLRequest, RelayState } = req.body;
  
  // 사용자 정보 객체
  const user = { email, name };

  try {
    // SAML Response 생성 (콜백을 통해 커스텀 XML 주입)
    const { context } = await idp.createLoginResponse(
      sp,
      { extract: { request: { id: 'request_id' } } },
      'post',
      user,
      createTemplateCallback(user) 
    );

    // [디버그용] 로그에서 <saml:AttributeStatement>가 들어갔는지 확인
    console.log("🚀 XML Generated. Contains AttributeStatement?", context.includes('AttributeStatement'));
    console.log("🚀 Generated SAML Response:", context);
    console.log("🚀 RelayState:", RelayState);
    console.log("🚀 User Info:", user);

    // eformsign으로 전송
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
    res.status(500).send(e.message);
  }
};

/**
 * 서명이 생성되기 전에 XML 템플릿을 수정하는 콜백 함수입니다.
 * 여기서 AttributeStatement를 강제로 주입해야 서명이 깨지지 않습니다.
 */
function createTemplateCallback(user) {
  return (template) => {
    const now = new Date().toISOString();
    const sessionId = 'session_' + new Date().getTime();

    // 1. AuthnStatement (로그인 인증 정보)
    const authnXml = `
      <saml:AuthnStatement AuthnInstant="${now}" SessionIndex="${sessionId}">
        <saml:AuthnContext>
          <saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:unspecified</saml:AuthnContextClassRef>
        </saml:AuthnContext>
      </saml:AuthnStatement>
    `;

    // 2. AttributeStatement (사용자 속성 - Azure AD 표준 Claim URI 사용)
    const attributesXml = `
      <saml:AttributeStatement>
        <saml:Attribute Name="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
          <saml:AttributeValue xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema" xsi:type="xs:string">${user.email}</saml:AttributeValue>
        </saml:Attribute>
        
        <saml:Attribute Name="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
          <saml:AttributeValue xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema" xsi:type="xs:string">${user.name}</saml:AttributeValue>
        </saml:Attribute>
      </saml:AttributeStatement>
    `;

    // 3. 주입 위치 찾기: </saml:Assertion> 바로 앞
    const targetTag = '</saml:Assertion>';
    
    // 안전 장치: 태그가 없으면 에러 로그
    if (!template.includes(targetTag)) {
        console.error("CRITICAL: </saml:Assertion> tag not found in template.");
        return { id: 'error', context: template };
    }

    // 4. XML 내용 치환 (Assertion 닫기 전에 내용 끼워넣기)
    const newContext = template.replace(
      targetTag, 
      authnXml + attributesXml + targetTag
    );

    return {
      id: 'response_id_' + Date.now(),
      context: newContext
    };
  };
}