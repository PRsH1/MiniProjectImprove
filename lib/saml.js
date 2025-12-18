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


  singleLogoutService: [{
    Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
    Location: 'https://mini-project-improve.vercel.app/api/slo'
  }],

  signingCert: publicCert,
  privateKey: privateKey,

  nameIDFormat: [
    'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress'
  ],

  // ★ 여기로 Response AttributeStatement가 생성됩니다.
  loginResponseTemplate: {
    context: SamlLib.defaultLoginResponseTemplate.context,
    attributes: [
      {
        name: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
        nameFormat: 'urn:oasis:names:tc:SAML:2.0:attrname-format:basic',
        valueTag: 'user.email',
        valueXsiType: 'xs:string',
      },
      {
        name: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
        nameFormat: 'urn:oasis:names:tc:SAML:2.0:attrname-format:basic',
        valueTag: 'user.name',
        valueXsiType: 'xs:string',
      }
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
