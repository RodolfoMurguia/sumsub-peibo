/**
 * Health Controller
 * Maneja el endpoint de health check del servicio
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     HealthCheck:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: OK
 *           description: Estado de salud del servicio
 *         timestamp:
 *           type: string
 *           format: date-time
 *           example: 2025-11-18T03:45:00.000Z
 *           description: Timestamp actual
 *         uptime:
 *           type: number
 *           example: 123.456
 *           description: Tiempo de actividad en segundos
 *         service:
 *           type: string
 *           example: sumsub-onboarding-service
 *           description: Nombre del servicio
 *         version:
 *           type: string
 *           example: 1.0.0
 *           description: Versión del servicio
 *         environment:
 *           type: string
 *           example: development
 *           description: Ambiente de ejecución
 */

class HealthController {
  /**
   * @swagger
   * /health:
   *   get:
   *     summary: Health check del servicio
   *     description: Retorna el estado de salud del servicio incluyendo uptime, versión y ambiente
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: Servicio funcionando correctamente
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/HealthCheck'
   */
  getHealth(req, res) {
    const healthCheck = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'sumsub-onboarding-service',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    };

    res.status(200).json(healthCheck);
  }
}

module.exports = new HealthController();
