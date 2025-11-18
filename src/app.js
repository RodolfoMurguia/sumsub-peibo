/**
 * App Configuration
 * Configura Express y los middlewares de la aplicación
 */

const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const healthRoutes = require('./routes/healthRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const documentsRoutes = require('./routes/documentsRoutes');

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Sumsub Onboarding API Docs'
}));

// Routes
app.use('/health', healthRoutes);
app.use('/results', webhookRoutes);
app.use('/documents', documentsRoutes);

/**
 * @swagger
 * /:
 *   get:
 *     summary: Información del servicio
 *     description: Retorna información básica del servicio y endpoints disponibles
 *     tags: [Info]
 *     responses:
 *       200:
 *         description: Información del servicio
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 service:
 *                   type: string
 *                   example: Sumsub Onboarding Service
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 documentation:
 *                   type: string
 *                   example: /api-docs
 *                 endpoints:
 *                   type: object
 *                   properties:
 *                     health:
 *                       type: string
 *                       example: /health
 *                     results:
 *                       type: string
 *                       example: /results
 *                     documents:
 *                       type: string
 *                       example: /documents
 */
app.get('/', (req, res) => {
  res.json({
    service: 'Sumsub Onboarding Service',
    version: '1.0.0',
    documentation: '/api-docs',
    endpoints: {
      health: '/health',
      results: '/results',
      documents: '/documents'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'ERROR',
    message: err.message || 'Internal Server Error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'ERROR',
    message: 'Endpoint not found'
  });
});

module.exports = app;
