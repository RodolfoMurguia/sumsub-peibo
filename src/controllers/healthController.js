/**
 * Health Controller
 * Maneja el endpoint de health check del servicio
 */

class HealthController {
  /**
   * GET /health
   * Retorna el estado de salud del servicio
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
