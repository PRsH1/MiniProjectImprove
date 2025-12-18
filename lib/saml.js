// lib/saml.js
const samlify = require('samlify');

const privateKey = process.env.SAML_PRIVATE_KEY
  ? Buffer.from(process.env.SAML_PRIVATE_KEY, 'base64').toString('utf-8')
  : '';

const publicCert = process.env.SAML_PUBLIC_CERT
  ? Buffer.from(process.env.SAML_PUBLIC_CERT, 'base64').toString('utf-8')
  : '';

const idpOptions = {
  // 실제 배포 도메인으로 변경 (https://...)
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
  
  // Azure AD / eformsign 호환용 포맷
  nameIDFormat: ['urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified']
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