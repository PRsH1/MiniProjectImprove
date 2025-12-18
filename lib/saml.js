// lib/saml.js
const samlify = require('samlify');

const privateKey = process.env.SAML_PRIVATE_KEY
  ? Buffer.from(process.env.SAML_PRIVATE_KEY, 'base64').toString('utf-8')
  : '';

const publicCert = process.env.SAML_PUBLIC_CERT
  ? Buffer.from(process.env.SAML_PUBLIC_CERT, 'base64').toString('utf-8')
  : '';

const SamlLib = samlify.SamlLib;

const idpOptions = {
  entityID: 'https://mini-project-improve.vercel.app/api/metadata',
  singleSignOnService: [{
    Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
    Location: 'https://mini-project-improve.vercel.app/api/sso-login'
  }],
  signingCert: publicCert,
  privateKey: privateKey,

  nameIDFormat: ['urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified'],

  // ✅ 핵심: valueTag/valueXsiType 필수
  loginResponseTemplate: {
    context: SamlLib.defaultLoginResponseTemplate.context,
    attributes: [
      {
        name: 'email',
        valueTag: 'user.email',
        nameFormat: 'urn:oasis:names:tc:SAML:2.0:attrname-format:basic',
        valueXsiType: 'xs:string',
      },
      {
        name: 'name',
        valueTag: 'user.name',
        nameFormat: 'urn:oasis:names:tc:SAML:2.0:attrname-format:basic',
        valueXsiType: 'xs:string',
      },

      // (선택) eformsign이 idp_type=azure에서 claim URI만 찾는 경우 대비
      {
        name: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
        valueTag: 'user.email',
        nameFormat: 'urn:oasis:names:tc:SAML:2.0:attrname-format:basic',
        valueXsiType: 'xs:string',
      },
      {
        name: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
        valueTag: 'user.name',
        nameFormat: 'urn:oasis:names:tc:SAML:2.0:attrname-format:basic',
        valueXsiType: 'xs:string',
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
