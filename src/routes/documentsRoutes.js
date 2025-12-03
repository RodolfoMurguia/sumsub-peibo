/**
 * Documents Routes
 * Define las rutas relacionadas con documentos
 */

const express = require('express');
const router = express.Router();
const documentsController = require('../controllers/documentsController');

// GET /documents - Obtener información de documentos
router.get('/', documentsController.getDocuments);

module.exports = router;
