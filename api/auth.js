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

    // 2. B사이트로 자동 Submit
    const acsUrl = 'https://test-kr-service.eformsign.com/v1.0/saml_redirect';
    
    const autoPostHtml = `
      <!DOCTYPE html>
      <html>
      <body onload="document.forms[0].submit()">
        <form method="POST" action="${acsUrl}">
          <input type="hidden" name="SAMLResponse" value="${context}">
          <input type="hidden" name="RelayState" value="${RelayState || ''}">
        </form>
        <p>B사이트로 이동 중입니다...</p>
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

// [핵심 수정 사항]
function createTemplateCallback(user) {
  return (template) => {
    /* 수정 1: xmlns:xs="http://www.w3.org/2001/XMLSchema" 추가 (xs:string 타입을 인식시키기 위함)
      수정 2: NameFormat을 'unspecified'로 변경 (Azure 등 호환성 증대)
    */
    const attributesXml = `
      <saml:Attribute xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" Name="email" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:unspecified">
        <saml:AttributeValue xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema" xsi:type="xs:string">${user.email}</saml:AttributeValue>
      </saml:Attribute>
      <saml:Attribute xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" Name="name" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:unspecified">
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