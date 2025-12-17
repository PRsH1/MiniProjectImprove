// api/metadata.js
const { idp } = require('../lib/saml');

module.exports = (req, res) => {
  // 1. 기본 메타데이터 생성
  let metadata = idp.getMetadata();

  // 2. 강제로 넣을 Attribute XML 정의
  // (참고하신 예시 XML과 동일한 네임스페이스 형식을 사용합니다)
  const attributesXML = `
    <saml:Attribute xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" Name="email" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic" />
    <saml:Attribute xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" Name="name" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic" />
  `;

  // 3. </IDPSSODescriptor> 태그 바로 앞에 위 내용을 삽입
  metadata = metadata.replace(
    '</IDPSSODescriptor>', 
    `${attributesXML}</IDPSSODescriptor>`
  );

  // 4. 응답 전송
  res.setHeader('Content-Type', 'application/xml');
  res.send(metadata);
};