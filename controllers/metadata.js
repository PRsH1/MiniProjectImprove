const { idp } = require('../lib/saml');

module.exports = (req, res) => {
  let metadata = idp.getMetadata();

  const attributesXML = `
    <saml:Attribute xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" Name="email" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic" />
    <saml:Attribute xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" Name="name" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic" />
  `;

  metadata = metadata.replace(
    '</IDPSSODescriptor>', 
    `${attributesXML}</IDPSSODescriptor>`
  );

  res.setHeader('Content-Type', 'application/xml');
  res.send(metadata);
};