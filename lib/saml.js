// lib/saml.js
const samlify = require('samlify');
const { SamlLib } = samlify;

const privateKey = process.env.SAML_PRIVATE_KEY
  ? Buffer.from(process.env.SAML_PRIVATE_KEY, 'base64').toString('utf-8')
  : '';

const publicCert = process.env.SAML_PUBLIC_CERT
  ? Buffer.from(process.env.SAML_PUBLIC_CERT, 'base64').toString('utf-8')
  : '';

const idpOptions = {
  entityID: 'https://mini-project-improve.vercel.app/api/metadata',
  singleSignOnService: [{
    Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
    Location: 'https://mini-project-improve.vercel.app/api/sso-login'
  }],

  // ✅ (선택) SLO 안 쓰면 아예 빼도 됩니다.
  // 넣을 거면 "비어있지 않은 endpoint"로 넣어 warning 없애기
  singleLogoutService: [{
    Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
    Location: 'https://mini-project-improve.vercel.app/api/slo'
  }],

  signingCert: publicCert,
  privateKey,

  // (권장) NameID를 emailAddress로
  nameIDFormat: ['urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress'],

  // ✅ 핵심: AttributeStatement 생성용 템플릿 + attributes
  loginResponseTemplate: {
    context: SamlLib.defaultLoginResponseTemplate.context, // 기본 템플릿 그대로 사용 :contentReference[oaicite:2]{index=2}
    attributes: [
      // eformsign(couchdb)에서 매핑한 claim URI들
      {
        name: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
        nameFormat: 'urn:oasis:names:tc:SAML:2.0:attrname-format:basic',
        valueTag: 'user.email',
        valueXsiType: 'xs:string',
        valueXmlnsXs: 'http://www.w3.org/2001/XMLSchema',
        valueXmlnsXsi: 'http://www.w3.org/2001/XMLSchema-instance',
      },
      {
        name: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
        nameFormat: 'urn:oasis:names:tc:SAML:2.0:attrname-format:basic',
        valueTag: 'user.name',
        valueXsiType: 'xs:string',
        valueXmlnsXs: 'http://www.w3.org/2001/XMLSchema',
        valueXmlnsXsi: 'http://www.w3.org/2001/XMLSchema-instance',
      },

      // (옵션) 혹시 eformsign이 단축키(name/email)만 찾는 케이스 대비 “중복” 제공
      {
        name: 'email',
        nameFormat: 'urn:oasis:names:tc:SAML:2.0:attrname-format:basic',
        valueTag: 'user.email',
        valueXsiType: 'xs:string',
        valueXmlnsXs: 'http://www.w3.org/2001/XMLSchema',
        valueXmlnsXsi: 'http://www.w3.org/2001/XMLSchema-instance',
      },
      {
        name: 'name',
        nameFormat: 'urn:oasis:names:tc:SAML:2.0:attrname-format:basic',
        valueTag: 'user.name',
        valueXsiType: 'xs:string',
        valueXmlnsXs: 'http://www.w3.org/2001/XMLSchema',
        valueXmlnsXsi: 'http://www.w3.org/2001/XMLSchema-instance',
      },
    ],
  },
};

const spOptions = {
  entityID: 'urn:eformsign:service',
  assertionConsumerService: [{
    Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
    Location: 'https://test-kr-service.eformsign.com/v1.0/saml_redirect',
  }],
};

const idp = samlify.IdentityProvider(idpOptions);
const sp = samlify.ServiceProvider(spOptions);

module.exports = { idp, sp };
