// lib/saml.js
const samlify = require('samlify');

const privateKey = process.env.SAML_PRIVATE_KEY
  ? Buffer.from(process.env.SAML_PRIVATE_KEY, 'base64').toString('utf-8')
  : '';

const publicCert = process.env.SAML_PUBLIC_CERT
  ? Buffer.from(process.env.SAML_PUBLIC_CERT, 'base64').toString('utf-8')
  : '';

const SamlLib = samlify.SamlLib; // 보통 여기로 노출됨 (버전에 따라 다르면 아래 대안 참고)

const idpOptions = {
  entityID: 'https://mini-project-improve.vercel.app/api/metadata',
  singleSignOnService: [{
    Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
    Location: 'https://mini-project-improve.vercel.app/api/sso-login'
  }],
  signingCert: publicCert,
  privateKey: privateKey,

  nameIDFormat: ['urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified'],

  // ✅ 핵심: Response 템플릿 + attributes 정의
  loginResponseTemplate: {
    context: SamlLib.defaultLoginResponseTemplate.context,
    attributes: [
      { name: 'email', nameFormat: 'urn:oasis:names:tc:SAML:2.0:attrname-format:basic' },
      { name: 'name',  nameFormat: 'urn:oasis:names:tc:SAML:2.0:attrname-format:basic' },
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
