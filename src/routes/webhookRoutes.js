/**
 * Webhook Routes
 * Define las rutas para recibir notificaciones (webhooks)
 */

const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

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
 *         message:
 *           type: string
 *           example: "Webhook received successfully"
 *         timestamp:
 *           type: string
 *           format: date-time
 *           example: "2025-01-18T10:30:00.000Z"
 */

/**
 * @swagger
 * /results:
 *   post:
 *     summary: Recibir resultados de Sumsub
 *     description: Endpoint webhook que procesa notificaciones de Sumsub, actualiza el estado del lead y registra el historial.
 *     tags: [Webhooks]
 *     requestBody:
 *       description: Payload del webhook de Sumsub
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               applicantId:
 *                 type: string
 *               inspectionId:
 *                 type: string
 *               correlationId:
 *                 type: string
 *               levelName:
 *                 type: string
 *               externalUserId:
 *                 type: string
 *               type:
 *                 type: string
 *                 description: Tipo de evento (applicantCreated, applicantPending, etc.)
 *               reviewStatus:
 *                 type: string
 *               reviewResult:
 *                 type: object
 *               createdAtMs:
 *                 type: string
 *             example:
 *               applicantId: "5c9e177b0a975a6eeccf5960"
 *               inspectionId: "5c9e177b0a975a6eeccf5961"
 *               correlationId: "req-63f92830-4d68-4eee-98d5-875d53a12258"
 *               levelName: "KYC-PEIBO"
 *               externalUserId: "550e8400-e29b-41d4-a716-446655440000"
 *               type: "applicantCreated"
 *               reviewStatus: "init"
 *               createdAtMs: "2020-02-21 13:23:19.002"
 *     responses:
 *       200:
 *         description: Webhook procesado o ignorado correctamente
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "OK"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Internal Server Error"
 */
router.post('/', webhookController.handleWebhook);

module.exports = router;
