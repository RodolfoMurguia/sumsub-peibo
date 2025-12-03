/**
 * Sumsub Signer
 * Utilidad para firmar peticiones a la API de Sumsub usando HMAC-SHA256
 */

const crypto = require('crypto');
const sumsubConfig = require('../config/sumsub');

/**
 * Genera los headers firmados para una petición a Sumsub
 * @param {string} method - Método HTTP (GET, POST, etc.)
 * @param {string} url - Path de la URL (ej: /resources/applicants/...)
 * @param {object|string} body - Cuerpo de la petición (opcional)
 * @returns {object} Headers con X-App-Token, X-App-Access-Ts y X-App-Access-Sig
 */
const createSignature = (method, url, body = null) => {
  const ts = Math.floor(Date.now() / 1000).toString();
  
  let bodyString = '';
  if (body) {
    bodyString = typeof body === 'string' ? body : JSON.stringify(body);
  }

  // Construir el string a firmar: timestamp + method + url + body
  const signatureString = ts + method.toUpperCase() + url + bodyString;

  // Generar firma HMAC-SHA256
  const signature = crypto
    .createHmac('sha256', sumsubConfig.secretKey)
    .update(signatureString)
    .digest('hex');

  return {
    'X-App-Token': sumsubConfig.appToken,
    'X-App-Access-Ts': ts,
    'X-App-Access-Sig': signature,
  };
};

module.exports = {
  createSignature,
};




