/**
 * Sumsub Configuration
 * Carga y valida las credenciales de Sumsub
 */

const sumsubConfig = {
  appToken: process.env.SUMSUB_APP_TOKEN,
  secretKey: process.env.SUMSUB_SECRET_KEY,
  baseUrl: process.env.SUMSUB_BASE_URL || 'https://api.sumsub.com',
  levelName: process.env.SUMSUB_LEVEL_NAME || 'KYC-PEIBO',
  levelNameKyb: process.env.SUMSUB_LEVEL_NAME_KYB || 'KYB-PEIBO',
};

// Validación básica
if (!sumsubConfig.appToken || !sumsubConfig.secretKey) {
  console.warn('WARNING: Sumsub credentials (SUMSUB_APP_TOKEN, SUMSUB_SECRET_KEY) are missing.');
}

module.exports = sumsubConfig;

