/**
 * Peibo Configuration
 * Configuración para la integración con Peibo
 */

const peiboConfig = {
  baseUrl: process.env.PEIBO_BASE_URL || 'https://api.peibo.mx/v1', // URL placeholder
  apiKey: process.env.PEIBO_API_KEY,
};

if (!peiboConfig.apiKey) {
  console.warn('WARNING: PEIBO_API_KEY is missing.');
}

module.exports = peiboConfig;




