/**
 * Webhook Routes
 * Define las rutas relacionadas con webhooks
 */

const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

// POST /results - Recibir webhook de resultados
router.post('/', webhookController.receiveResults);

module.exports = router;
