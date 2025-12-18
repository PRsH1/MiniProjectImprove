// api/auth.js
const { SignedXml } = require('xml-crypto');
const { DOMParser } = require('@xmldom/xmldom');
const zlib = require('zlib');
const { v4: uuidv4 } = require('uuid');

const privateKey = process.env.SAML_PRIVATE_KEY
  ? Buffer.from(process.env.SAML_PRIVATE_KEY, 'base64').toString('utf-8')
  : '';

const publicCert = process.env.SAML_PUBLIC_CERT
  ? Buffer.from(process.env.SAML_PUBLIC_CERT, 'base64').toString('utf-8')
  : '';

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { email, name, SAMLRequest, RelayState } = req.body;

  try {
    const issuer = 'https://mini-project-improve.vercel.app/api/metadata';
    const acsUrl = 'https://test-kr-service.eformsign.com/v1.0/saml_redirect';
    const now = new Date();
    const issueInstant = now.toISOString();
    const notOnOrAfter = new Date(now.getTime() + 5 * 60 * 1000).toISOString();
    const responseId = '_' + uuidv4();
    const assertionId = '_' + uuidv4();

    // SAMLRequest ID 추출
    let requestId = null;
    if (SAMLRequest) {
      try {
        let decoded = '';
        try {
          // Redirect Binding (Deflated)
          decoded = zlib.inflateRawSync(Buffer.from(SAMLRequest, 'base64')).toString();
        } catch (e) {
          // POST Binding (Plain Base64)
          decoded = Buffer.from(SAMLRequest, 'base64').toString('utf-8');
        }
        const match = decoded.match(/ID="([^"]+)"/);
        if (match) requestId = match[1];
      } catch (e) {
        console.warn("ID Extraction failed", e);
      }
    }
    const inResponseToAttr = requestId ? `InResponseTo="${requestId}"` : '';

    /* [중요 수정 사항]
       1. 모든 XML을 공백 없이 한 줄로 연결 (Canonicalization 이슈 방지)
       2. xmlns 정의를 최상위 요소로 통합
    */
    const xml = `<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema" ID="${responseId}" Version="2.0" IssueInstant="${issueInstant}" Destination="${acsUrl}" ${inResponseToAttr}><saml:Issuer>${issuer}</saml:Issuer><samlp:Status><samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/></samlp:Status><saml:Assertion ID="${assertionId}" Version="2.0" IssueInstant="${issueInstant}"><saml:Issuer>${issuer}</saml:Issuer><saml:Subject><saml:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified">${email}</saml:NameID><saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer"><saml:SubjectConfirmationData NotOnOrAfter="${notOnOrAfter}" Recipient="${acsUrl}" ${inResponseToAttr}/></saml:SubjectConfirmation></saml:Subject><saml:Conditions NotBefore="${issueInstant}" NotOnOrAfter="${notOnOrAfter}"><saml:AudienceRestriction><saml:Audience>urn:eformsign:service</saml:Audience></saml:AudienceRestriction></saml:Conditions><saml:AuthnStatement AuthnInstant="${issueInstant}" SessionIndex="${assertionId}"><saml:AuthnContext><saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:unspecified</saml:AuthnContextClassRef></saml:AuthnContext></saml:AuthnStatement><saml:AttributeStatement><saml:Attribute Name="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic"><saml:AttributeValue xsi:type="xs:string">${email}</saml:AttributeValue></saml:Attribute><saml:Attribute Name="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic"><saml:AttributeValue xsi:type="xs:string">${name}</saml:AttributeValue></saml:Attribute></saml:AttributeStatement></saml:Assertion></samlp:Response>`;

    // 서명 생성
    const sig = new SignedXml();
    sig.signatureAlgorithm = "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256";
    sig.addReference(
      "//*[local-name(.)='Response']",
      ["http://www.w3.org/2000/09/xmldsig#enveloped-signature", "http://www.w3.org/2001/10/xml-exc-c14n#"],
      "http://www.w3.org/2001/04/xmlenc#sha256"
    );

    sig.signingKey = privateKey;

    const cleanCert = publicCert.replace(/-----BEGIN CERTIFICATE-----/g, '').replace(/-----END CERTIFICATE-----/g, '').replace(/\s/g, '');
    sig.keyInfoProvider = {
      getKeyInfo: () => `<ds:X509Data><ds:X509Certificate>${cleanCert}</ds:X509Certificate></ds:X509Data>`
    };

    sig.computeSignature(xml, {
      location: { reference: "//*[local-name(.)='Issuer']", action: "after" }
    });

    const signedXml = sig.getSignedXml();
    console.log("✅ Custom XML Generated & Signed successfully.");

    res.setHeader('Content-Type', 'text/html');
    res.send(`
      <!DOCTYPE html>
      <html>
      <body onload="document.forms[0].submit()">
        <form method="POST" action="${acsUrl}">
          <input type="hidden" name="SAMLResponse" value="${Buffer.from(signedXml).toString('base64')}">
          <input type="hidden" name="RelayState" value="${RelayState || ''}">
        </form>
        <p>eformsign으로 이동 중입니다...</p>
      </body>
      </html>
    `);

  } catch (e) {
    console.error("❌ Generation Error:", e);
    res.status(500).send('SAML Gen Error: ' + e.message);
  }
};