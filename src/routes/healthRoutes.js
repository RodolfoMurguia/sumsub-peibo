/**
 * Health Routes
 * Define las rutas relacionadas con el health check
 */

const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');

// GET /health - Health check endpoint
router.get('/', healthController.getHealth);

module.exports = router;
