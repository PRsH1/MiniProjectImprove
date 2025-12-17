// lib/saml.js
import * as samlify from 'samlify';
import fs from 'fs';
import path from 'path';

// Vercel 환경에서는 파일을 읽기 위해 process.cwd() 사용 필요 (또는 환경변수에 키 내용 전체를 넣는 것 권장)
const keyPath = path.join(process.cwd(), 'certs');

// IdP (내 테스트 페이지) 설정
const idpOptions = {
  entityID: 'https://mini-project-improve.vercel.app/api/metadata', // 나중에 실제 배포 주소로 변경 필요
  loginURL: 'https://mini-project-improve.vercel.app/login',       // 나중에 실제 배포 주소로 변경 필요
  signingCert: fs.readFileSync(path.join(keyPath, 'idp-public-cert.pem')),
  privateKey: fs.readFileSync(path.join(keyPath, 'idp-private-key.pem')),
};

// SP (B사이트: eformsign) 설정
// 주의: eformsign 관리자 페이지에서 설정된 "Entity ID"가 있다면 그것과 정확히 일치해야 합니다.
const spOptions = {
  entityID: 'urn:eformsign:service', // B사이트에 등록할 때 이 값과 맞춰야 함
  assertionConsumerService: [{
    Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
    Location: 'https://kr-service.eformsign.com/v1.0/saml_redirect', // 요청하신 Redirect URL
  }],
};

export const idp = samlify.IdentityProvider(idpOptions);
export const sp = samlify.ServiceProvider(spOptions);