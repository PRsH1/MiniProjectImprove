// api/auth.js

const { idp, sp } = require('../lib/saml');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { email, name, SAMLRequest, RelayState } = req.body;
  const user = { email, name };

  try {
  

  
    const { context } = await idp.createLoginResponse(
      sp,
      { extract: { request: { id: 'request_id' } } }, // 테스트용 요청 ID 강제 주입
      'post',
      user,
      createTemplateCallback(user)
    );

    // 3. B사이트로 자동 Submit 되는 HTML 반환
    const acsUrl = 'https://test-kr-service.eformsign.com/v1.0/saml_redirect';

    const autoPostHtml = `
      <!DOCTYPE html>
      <html>
      <body onload="document.forms[0].submit()">
        <form method="POST" action="${acsUrl}">
          <input type="hidden" name="SAMLResponse" value="${context}">
          <input type="hidden" name="RelayState" value="${RelayState || ''}">
        </form>
        <p>eformsign 사이트로 이동 중입니다...</p>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(autoPostHtml);

  } catch (e) {
    console.error(e);
    res.status(500).send('SAML Error: ' + e.message);
  }
};

// [핵심 수정] 라이브러리 의존성 없이 직접 XML을 주입하는 함수
function createTemplateCallback(user) {
  return (template) => {
    // 1. 주입할 Attribute XML 생성
    // (xsi:type과 xmlns 정의를 명확히 하여 호환성을 높였습니다)
    const attributesXml = `
      <saml:Attribute xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" Name="email" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
        <saml:AttributeValue xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="xs:string">${user.email}</saml:AttributeValue>
      </saml:Attribute>
      <saml:Attribute xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" Name="name" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
        <saml:AttributeValue xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="xs:string">${user.name}</saml:AttributeValue>
      </saml:Attribute>
    `;

    // 2. AttributeStatement 태그 안에 우리가 만든 XML을 삽입합니다.
    // 기존 템플릿의 닫는 태그 </saml:AttributeStatement> 직전에 삽입하는 방식
    const newContext = template.replace(
      '</saml:AttributeStatement>', 
      `${attributesXml}</saml:AttributeStatement>`
    );

    return {
      id: 'response_id_' + Date.now(), // 고유 ID 생성
      context: newContext
    };
  };
}