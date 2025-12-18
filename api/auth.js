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

    // [로그 확인용] 생성된 XML 구조 확인
    console.log("🚀 [SAML Response Generated]");
    console.log("====================================");
    console.log("Generated SAML Response XML:");   
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


function createTemplateCallback(user) {
  return (template) => {
    const now = new Date().toISOString();
    
   
    const authnStatement = `
      <saml:AuthnStatement AuthnInstant="${now}" SessionIndex="session_${Date.now()}">
        <saml:AuthnContext>
          <saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:unspecified</saml:AuthnContextClassRef>
        </saml:AuthnContext>
      </saml:AuthnStatement>
    `;

  
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


    const newContext = template.replace(
      '</saml:Conditions>', 
      `</saml:Conditions>${authnStatement}${attributesStatement}`
    );

    return {
      id: 'response_id_' + Date.now(),
      context: newContext
    };
  };
}