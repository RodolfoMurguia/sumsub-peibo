/**
 * Leads Routes
 * Define las rutas relacionadas con la gestión de leads
 */

const express = require('express');
const router = express.Router();
const leadsController = require('../controllers/leadsController');

/**
 * @swagger
 * components:
 *   schemas:
 *     EventHistory:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           description: Status at that point in time
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: When the status change occurred
 *         details:
 *           type: string
 *           description: Additional details about the event
 *     Lead:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Mongo Object ID
 *         external_user_id:
 *           type: string
 *           format: uuid
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *           description: External User ID (Public UUID)
 *         first_name:
 *           type: string
 *           example: "Juan"
 *           description: Lead first name
 *         last_name:
 *           type: string
 *           example: "Pérez"
 *           description: Lead last name
 *         email:
 *           type: string
 *           format: email
 *           example: "juan.perez@example.com"
 *           description: Lead email address
 *         phone:
 *           type: string
 *           example: "+521234567890"
 *           description: Lead phone number
 *         applicant_id:
 *           type: string
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *           description: Sumsub applicant ID
 *         status:
 *           type: string
 *           example: "CREATED"
 *           description: Lead status
 *         kyc_result:
 *           type: string
 *           enum: [GREEN, RED]
 *           example: "GREEN"
 *           description: Sumsub KYC Result
 *         rejection_details:
 *           type: object
 *           description: Details if KYC was rejected
 *         event_history:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/EventHistory'
 *           description: History of status changes
 *         created_at:
 *           type: string
 *           format: date-time
 *           example: "2025-01-18T10:30:00.000Z"
 *           description: Creation timestamp
 *         updated_at:
 *           type: string
 *           format: date-time
 *           example: "2025-01-18T10:30:00.000Z"
 *           description: Last update timestamp
 *     LeadCreateRequest:
 *       type: object
 *       required:
 *         - first_name
 *         - last_name
 *         - email
 *         - phone
 *       properties:
 *         first_name:
 *           type: string
 *           example: "Juan"
 *         last_name:
 *           type: string
 *           example: "Pérez"
 *         email:
 *           type: string
 *           format: email
 *           example: "juan.perez@example.com"
 *         phone:
 *           type: string
 *           example: "+521234567890"
 *     LeadResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: "SUCCESS"
 *         data:
 *           $ref: '#/components/schemas/Lead'
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: "ERROR"
 *         message:
 *           type: string
 *           example: "Error message"
 */

router.post('/', leadsController.createLead);
router.get('/by-email/:email', leadsController.getLeadByEmail);
router.get('/by-phone/:phone', leadsController.getLeadByPhone);
router.get('/:id', leadsController.getLeadById);

module.exports = router;
