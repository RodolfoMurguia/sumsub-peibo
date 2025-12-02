/**
 * Sumsub Service Base
 * Cliente HTTP base para interactuar con la API de Sumsub
 */

const axios = require('axios');
const sumsubConfig = require('../config/sumsub');
const { createSignature } = require('../utils/sumsubSigner');

class SumsubService {
  constructor() {
    this.client = axios.create({
      baseURL: sumsubConfig.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Interceptor para firmar peticiones automáticamente
    this.client.interceptors.request.use(
      (config) => {
        // Si la URL es completa (comienza con http), no usar baseURL y extraer el path relativo si es posible,
        // o usar la URL completa si la lógica de firmado lo requiere (depende de Sumsub, normalmente es path relativo)
        // Axios combina baseURL + url antes de este interceptor si url es relativa.
        
        // Extraer el path relativo de la URL completa para firmar
        let urlToSign = config.url;
        
        // Si config.url no tiene el host, axios lo combinará después, pero necesitamos saber qué firmar.
        // Si axios ya combinó (en versiones nuevas puede variar), lo manejamos.
        // Asumimos que config.url es el path relativo (ej: /resources/...) que pasamos al método get/post
        
        // NOTA: Axios combina baseURL y url ANTES de enviar, pero en el interceptor 'config.url' 
        // suele ser lo que pasamos al llamar al método (path relativo).
        
        // Generar firma
        const method = config.method.toUpperCase();
        const body = config.data || null;
        
        const authHeaders = createSignature(method, urlToSign, body);

        // Agregar headers de autenticación
        config.headers = {
          ...config.headers,
          ...authHeaders,
        };

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Interceptor de respuesta para manejo de errores básico
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          console.error(`[SUMSUB] API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        } else {
          console.error(`[SUMSUB] Network Error: ${error.message}`);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Realiza una petición GET a Sumsub
   * @param {string} url - Path del recurso
   * @param {object} config - Configuración adicional de Axios
   */
  async get(url, config = {}) {
    return this.client.get(url, config);
  }

  /**
   * Realiza una petición POST a Sumsub
   * @param {string} url - Path del recurso
   * @param {object} data - Cuerpo de la petición
   * @param {object} config - Configuración adicional de Axios
   */
  async post(url, data, config = {}) {
    return this.client.post(url, data, config);
  }

  /**
   * Crea un nuevo applicant en Sumsub
   * @param {object} leadData - Datos del lead (first_name, last_name, email, phone, external_user_id)
   * @returns {Promise<object>} Datos del applicant creado
   */
  async createApplicant(leadData) {
    const levelName = sumsubConfig.levelName;
    const url = `/resources/applicants?levelName=${levelName}`;
    
    // Mapear datos del lead al payload de Sumsub
    // Usamos fixedInfo como solicitado en el ejemplo para datos pre-llenados
    const payload = {
      externalUserId: leadData.external_user_id || leadData.id,
      lang: 'es', // Default a español
      fixedInfo: {
        firstName: leadData.first_name,
        lastName: leadData.last_name,
        email: leadData.email,
        phone: leadData.phone,
        country: 'MEX', // Default a México según el ejemplo
        // Otros campos opcionales se omiten por ahora ya que el lead no los tiene
      },
      type: 'individual'
    };

    try {
      console.log(`[SUMSUB] Creating applicant for externalUserId: ${payload.externalUserId}`);
      const response = await this.post(url, payload);
      return response.data;
    } catch (error) {
      console.error(`[SUMSUB] Failed to create applicant: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene los datos de un applicant específico
   * @param {string} applicantId - ID del applicant en Sumsub
   * @returns {Promise<object>} Datos del applicant
   */
  async getApplicantData(applicantId) {
    const url = `/resources/applicants/${applicantId}/one`;
    
    try {
      console.log(`[SUMSUB] Fetching applicant data for ID: ${applicantId}`);
      const response = await this.get(url);
      return response.data;
    } catch (error) {
      console.error(`[SUMSUB] Failed to fetch applicant data: ${error.message}`);
      throw error;
    }
  }
  /**
   * Obtiene los metadatos de los recursos (documentos) de un applicant
   * @param {string} applicantId - ID del applicant en Sumsub
   * @returns {Promise<Array>} Lista de recursos con metadatos
   */
  async getApplicantMetadataResources(applicantId) {
    const url = `/resources/applicants/${applicantId}/metadata/resources`;
    
    try {
      console.log(`[SUMSUB] Fetching metadata resources for applicant ID: ${applicantId}`);
      const response = await this.get(url);
      return response.data;
    } catch (error) {
      console.error(`[SUMSUB] Failed to fetch metadata resources: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new SumsubService();

