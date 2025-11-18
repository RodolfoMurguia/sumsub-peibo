/**
 * Swagger Configuration
 * Configuración de Swagger/OpenAPI para documentación de la API
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sumsub Onboarding Service API',
      version: '1.0.0',
      description: 'API para el servicio de reinterpretación de onboarding de Sumsub',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'http://localhost:3000',
        description: 'Production server',
      },
    ],
    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints',
      },
      {
        name: 'Info',
        description: 'Service information endpoints',
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js', './src/app.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
