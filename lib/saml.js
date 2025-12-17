// lib/saml.js
const samlify = require('samlify');

// [수정] 파일 시스템(fs, path) 관련 코드는 이제 필요 없습니다.
// 대신 Buffer를 사용해 Base64 환경변수를 디코딩합니다.

const privateKey = process.env.SAML_PRIVATE_KEY 
  ? Buffer.from(process.env.SAML_PRIVATE_KEY, 'base64').toString('utf-8') 
  : '';

const publicCert = process.env.SAML_PUBLIC_CERT 
  ? Buffer.from(process.env.SAML_PUBLIC_CERT, 'base64').toString('utf-8') 
  : '';

// 환경변수가 제대로 로드되지 않았을 때를 대비한 에러 처리
if (!privateKey || !publicCert) {
  console.error("❌ 오류: Vercel 환경변수(SAML_PRIVATE_KEY, SAML_PUBLIC_CERT)가 설정되지 않았습니다.");
}

const idpOptions = {
  // 실제 배포 도메인 확인
  entityID: 'https://mini-project-improve.vercel.app/api/metadata',
  singleSignOnService: [{
    Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
    Location: 'https://mini-project-improve.vercel.app/api/sso-login' 
  }],
  
  // [수정] 파일 경로 대신 변수 사용
  signingCert: publicCert,
  privateKey: privateKey,

  nameIDFormat: [
    'urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified'
  ],
  attributes: [
    {
      name: 'email',
      nameFormat: 'urn:oasis:names:tc:SAML:2.0:attrname-format:basic'
    },
    {
      name: 'name',
      nameFormat: 'urn:oasis:names:tc:SAML:2.0:attrname-format:basic'
    }
  ]
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