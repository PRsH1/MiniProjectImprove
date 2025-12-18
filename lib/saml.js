// lib/saml.js
const samlify = require('samlify');
const { SamlLib } = samlify;

const privateKey = process.env.SAML_PRIVATE_KEY
  ? Buffer.from(process.env.SAML_PRIVATE_KEY, 'base64').toString('utf-8')
  : '';

const publicCert = process.env.SAML_PUBLIC_CERT
  ? Buffer.from(process.env.SAML_PUBLIC_CERT, 'base64').toString('utf-8')
  : '';

const CLAIM_EMAIL = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress';
const CLAIM_NAME  = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name';
const BASIC_FMT   = 'urn:oasis:names:tc:SAML:2.0:attrname-format:basic';

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
  privateKey,

  nameIDFormat: ['urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress'],

 
  loginResponseTemplate: {
    ...SamlLib.defaultLoginResponseTemplate,
    attributes: [
      {
        name: CLAIM_EMAIL,
        nameFormat: BASIC_FMT,
        valueTag: 'email',          // ✅ user.email에서 꺼냄
        valueXsiType: 'xs:string',
      },
      {
        name: CLAIM_NAME,
        nameFormat: BASIC_FMT,
        valueTag: 'name',           // ✅ user.name에서 꺼냄
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
const sp  = samlify.ServiceProvider(spOptions);

module.exports = { idp, sp };
