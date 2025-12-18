// api/auth.js
const { idp, sp } = require('../lib/saml');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { email, name, SAMLRequest, RelayState } = req.body;
  const user = { email, name };

  try {
    // 1. SAML Response 생성
    // createTemplateCallback을 통해 XML 생성 직전에 내용을 가로채서 수정합니다.
    const { context } = await idp.createLoginResponse(
      sp,
      { extract: { request: { id: 'request_id' } } },
      'post',
      user,
      createTemplateCallback(user)
    );

    // [디버그] 로그 확인 (Vercel Function Log에서 확인 가능)
    console.log("🚀 SAML Response Generated.");
    console.log(context); // 전체 XML 확인 필요 시 주석 해제
    console.log("🚀 RelayState:", RelayState)
    console.log("🚀 SAMLResponse Length:", context.length);
    console.log("🚀 Sample SAMLResponse (first 500 chars):", context.substring(0, 500));
    console.log("user.email:", user.email);
    console.log("user.name:", user.name);

    // 2. eformsign으로 자동 전송
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
 * XML 템플릿을 가로채서 Azure AD 형식의 Attribute를 강제로 주입하는 함수
 */
function createTemplateCallback(user) {
  return (template) => {
    const now = new Date().toISOString();
    const sessionId = 'session_' + Date.now();
    
    // 1. AuthnStatement (로그인 인증 정보)
    const authnXml = `
      <saml:AuthnStatement AuthnInstant="${now}" SessionIndex="${sessionId}">
        <saml:AuthnContext>
          <saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:unspecified</saml:AuthnContextClassRef>
        </saml:AuthnContext>
      </saml:AuthnStatement>
    `;

    // 2. AttributeStatement (Azure AD 표준 Claim URI 사용)
    // 변수 ${user.email}, ${user.name}을 직접 넣어 누락 방지
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

    // 3. [핵심] 정규표현식으로 닫는 태그 찾기
    // </saml:Assertion> 또는 </saml2:Assertion> 등 접두어에 상관없이 찾습니다.
    const assertionCloseRegex = /<\/[a-zA-Z0-9_:-]*Assertion>/;
    
    const match = template.match(assertionCloseRegex);
    
    if (!match) {
        console.error("❌ CRITICAL: Could not find closing Assertion tag in template.");

        // 실패 시 원본 반환 (에러 방지)
        return { id: 'error', context: template };
        
        
    }

    const closingTag = match[0]; // 예: </saml:Assertion>

    // 4. 닫는 태그 앞에 우리가 만든 XML 주입
    const newContext = template.replace(
      closingTag, 
      authnXml + attributesXml + closingTag
    );

    return {
      id: 'response_id_' + Date.now(),
      context: newContext
    };
  };
}