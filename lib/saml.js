// lib/saml.js
const samlify = require('samlify');
const fs = require('fs');
const path = require('path');

const keyPath = path.join(process.cwd(), 'certs');

const idpOptions = {
  // 실제 배포된 Vercel 도메인으로 변경 필수
  entityID: 'https://mini-project-improve.vercel.app/api/metadata',

  // [수정된 부분] loginURL 대신 singleSignOnService를 사용해야 합니다.
  singleSignOnService: [{
    Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
    Location: 'https://mini-project-improve.vercel.app/api/sso-login'
  }],
  
  signingCert: fs.readFileSync(path.join(keyPath, 'idp-public-cert.pem')),
  privateKey: fs.readFileSync(path.join(keyPath, 'idp-private-key.pem')),
};

const spOptions = {
  entityID: 'urn:eformsign:service',
  assertionConsumerService: [{
    Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
    Location: 'https://kr-service.eformsign.com/v1.0/saml_redirect',
  }],
};

const idp = samlify.IdentityProvider(idpOptions);
const sp = samlify.ServiceProvider(spOptions);

module.exports = { idp, sp };