/**
 * Webhook Controller
 * Maneja webhooks entrantes del sistema
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     WebhookSuccess:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *           description: Indica si el webhook fue procesado correctamente
 *         message:
 *           type: string
 *           example: Webhook received successfully
 *           description: Mensaje de confirmación
 *         timestamp:
 *           type: string
 *           format: date-time
 *           example: 2025-11-18T03:45:00.000Z
 *           description: Timestamp de recepción
 */

class WebhookController {
  /**
   * @swagger
   * /results:
   *   post:
   *     summary: Webhook para recibir resultados
   *     description: Endpoint webhook que recibe y procesa resultados del sistema de onboarding
   *     tags: [Webhooks]
   *     requestBody:
   *       description: Payload del webhook (actualmente no procesado)
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             example: {}
   *     responses:
   *       200:
   *         description: Webhook procesado correctamente
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/WebhookSuccess'
   */
  receiveResults(req, res) {
    const response = {
      success: true,
      message: 'Webhook received successfully',
      timestamp: new Date().toISOString()
    };

    res.status(200).json(response);
  }
}

module.exports = new WebhookController();
