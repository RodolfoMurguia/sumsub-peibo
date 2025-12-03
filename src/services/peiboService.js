/**
 * Peibo Service
 * Servicio para interactuar con la API de Peibo
 */

const axios = require('axios');
const peiboConfig = require('../config/peibo');

class PeiboService {
  constructor() {
    this.client = axios.create({
      baseURL: peiboConfig.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        // Asumimos Bearer token o API Key en header. Ajustar según la doc real de Peibo.
        'Authorization': `Bearer ${peiboConfig.apiKey}`, 
        'X-API-KEY': peiboConfig.apiKey // Backup común
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          console.error(`[PEIBO] API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        } else {
          console.error(`[PEIBO] Network Error: ${error.message}`);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Envía los datos de onboarding a Peibo
   * @param {object} payload - Datos formateados (ver peiboFormatter)
   * @returns {Promise<object>} Respuesta de Peibo
   */
  async sendOnboardingData(payload) {
    try {
      console.log(`[PEIBO] Sending onboarding data for ExternalID: ${payload.external_id}`);
      // Endpoint hipotético /onboarding/sync o similar
      const response = await this.client.post('/onboarding/sync', payload);
      return response.data;
    } catch (error) {
      console.error(`[PEIBO] Failed to send onboarding data: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new PeiboService();




