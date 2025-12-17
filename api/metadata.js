// api/metadata.js
const { idp } = require('../lib/saml');

module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/xml');
  res.send(idp.getMetadata());
};