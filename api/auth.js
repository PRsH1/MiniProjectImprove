// api/auth.js
const samlify = require('samlify'); 
const { idp, sp } = require('../lib/saml');
const { v4: uuidv4 } = require('uuid');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { email, name, SAMLRequest, RelayState } = req.body;
  const user = { email, name };

  try {
    // 1. SAML 요청 파싱
    // (여기서 samlify 객체를 사용하므로 상단에 require가 필수입니다)
    const parseRequest = SAMLRequest 
      ? await samlify.SamlLib.decodeBase64(SAMLRequest) 
      : { id: 'request_id', issuer: 'urn:eformsign:service' };

    // 2. SAML Response 생성
    const { context } = await idp.createLoginResponse(
      sp,
      { extract: { request: { id: 'request_id' } } },
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
    // 에러 발생 시 명확한 로그 출력
    res.status(500).send('SAML Error: ' + e.message);
  }
};

// 속성 매핑 헬퍼 함수
function createTemplateCallback(user) {
  return (template) => {
    const assertionTag = {
      'saml:AttributeStatement': {
        'saml:Attribute': [
          { '@Name': 'email', 'saml:AttributeValue': user.email },
          { '@Name': 'name', 'saml:AttributeValue': user.name }
        ]
      }
    };
    return {
      id: uuidv4(),
      // (여기서도 samlify 객체를 사용합니다)
      context: samlify.SamlLib.replaceTagsByValue(template, assertionTag),
    };
  };
}