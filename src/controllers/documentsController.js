/**
 * Documents Controller
 * Maneja la obtención y procesamiento de documentos
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     DocumentResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *           description: Indica si la operación fue exitosa
 *         data:
 *           type: object
 *           properties:
 *             documentId:
 *               type: string
 *               example: doc_12345abcde
 *               description: Identificador único del documento
 *             type:
 *               type: string
 *               example: passport
 *               description: Tipo de documento
 *             status:
 *               type: string
 *               example: verified
 *               description: Estado del documento
 *             uploadedAt:
 *               type: string
 *               format: date-time
 *               example: 2025-11-18T03:45:00.000Z
 *               description: Fecha de carga del documento
 *             metadata:
 *               type: object
 *               properties:
 *                 country:
 *                   type: string
 *                   example: US
 *                 expiryDate:
 *                   type: string
 *                   format: date
 *                   example: 2030-12-31
 *         timestamp:
 *           type: string
 *           format: date-time
 *           example: 2025-11-18T03:45:00.000Z
 *           description: Timestamp de la respuesta
 */

class DocumentsController {
  /**
   * @swagger
   * /documents:
   *   get:
   *     summary: Obtener información de documentos
   *     description: Retorna información de muestra sobre documentos procesados
   *     tags: [Documents]
   *     responses:
   *       200:
   *         description: Información de documentos obtenida correctamente
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/DocumentResponse'
   */
  getDocuments(req, res) {
    const response = {
      success: true,
      data: {
        documentId: 'doc_12345abcde',
        type: 'passport',
        status: 'verified',
        uploadedAt: new Date().toISOString(),
        metadata: {
          country: 'US',
          expiryDate: '2030-12-31'
        }
      },
      timestamp: new Date().toISOString()
    };

    res.status(200).json(response);
  }
}

module.exports = new DocumentsController();
