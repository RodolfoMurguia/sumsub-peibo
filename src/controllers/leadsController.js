/**
 * Leads Controller
 * Maneja las operaciones CRUD para leads
 */

const Lead = require('../models/Lead');
const sumsubService = require('../services/sumsubService');

class LeadsController {
  /**
   * @swagger
   * /leads:
   *   post:
   *     summary: Create a new lead
   *     description: Creates a new lead with duplicate validation (email + phone) and initiates Sumsub applicant creation.
   *     tags: [Leads]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LeadCreateRequest'
   *           examples:
   *             example1:
   *               summary: Lead creation example (Individual)
   *               value:
   *                 first_name: "Juan"
   *                 last_name: "Pérez"
   *                 email: "juan.perez@example.com"
   *                 phone: "+521234567890"
   *                 lead_type: "individual"
   *             example2:
   *               summary: Lead creation example (Company)
   *               value:
   *                 first_name: "Maria"
   *                 last_name: "Gomez"
   *                 email: "maria@techsolutions.com"
   *                 phone: "+521234567891"
   *                 lead_type: "company"
   *                 company_name: "Tech Solutions S.A. de C.V."
   *     responses:
   *       201:
   *         description: Lead created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/LeadResponse'
   *       400:
   *         description: Validation error or duplicate lead
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal Server Error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async createLead(req, res) {
    const timestamp = new Date().toISOString();
    const { first_name, last_name, email, phone, lead_type, company_name } = req.body;

    try {
      console.log(`${timestamp} - [LEADS] Creating new lead - Email: ${email}, Phone: ${phone}, Type: ${lead_type || 'individual'}`);

      // Validar campos requeridos
      const missingFields = [];
      if (!first_name) missingFields.push('first_name');
      if (!last_name) missingFields.push('last_name');
      if (!email) missingFields.push('email');
      if (!phone) missingFields.push('phone');

      // Validar company_name si es company
      if (lead_type === 'company' && !company_name) {
        missingFields.push('company_name');
      }

      if (missingFields.length > 0) {
        console.log(`${timestamp} - [LEADS] Validation error - Missing fields: ${missingFields.join(', ')}`);
        return res.status(400).json({
          status: 'ERROR',
          message: 'Bad Request',
          details: `Missing fields: ${missingFields.join(', ')}`
        });
      }

      // Verificar duplicados
      const duplicate = await Lead.findDuplicate(email, phone);
      if (duplicate) {
        console.log(`${timestamp} - [LEADS] Duplicate lead detected - Email: ${email}, Phone: ${phone}, Existing ID: ${duplicate.external_user_id}`);
        return res.status(400).json({
          status: 'ERROR',
          message: 'Bad Request'
        });
      }

      // Crear nuevo lead
      const newLead = new Lead({
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        status: 'CREATED',
        lead_type: lead_type || 'individual',
        company_name: company_name ? company_name.trim() : undefined,
      });

      let savedLead = await newLead.save();
      console.log(`${timestamp} - [LEADS] Lead created successfully - ID: ${savedLead.external_user_id}`);

      // Integración con Sumsub: Crear Applicant
      try {
        console.log(`${timestamp} - [LEADS] Initiating Sumsub applicant creation for Lead ID: ${savedLead.external_user_id}`);
        const applicantData = await sumsubService.createApplicant(savedLead);
        
        if (applicantData && applicantData.id) {
          // Actualizar lead con datos de Sumsub
          savedLead.applicant_id = applicantData.id;
          savedLead.status = 'KYC_CREATED'; 
          savedLead = await savedLead.save();
          console.log(`${timestamp} - [LEADS] Sumsub applicant created successfully - Applicant ID: ${applicantData.id}, Status updated to KYC_CREATED`);
        }
      } catch (sumsubError) {
        console.error(`${timestamp} - [LEADS] Error creating Sumsub applicant: ${sumsubError.message}`);
      }

      res.status(201).json({
        status: 'SUCCESS',
        data: savedLead,
      });
    } catch (error) {
      console.error(`${timestamp} - [LEADS] Error creating lead - Email: ${email}, Phone: ${phone}, Error: ${error.message}, Stack: ${error.stack}`);
      
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          status: 'ERROR',
          message: 'Bad Request'
        });
      }

      res.status(500).json({
        status: 'ERROR',
        message: 'Internal Server Error'
      });
    }
  }

  /**
   * @swagger
   * /leads/{id}:
   *   get:
   *     summary: Get lead by External User ID (UUID)
   *     description: Retrieves a specific lead using their external_user_id (UUID)
   *     tags: [Leads]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Lead External User ID (UUID)
   *     responses:
   *       200:
   *         description: Lead found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/LeadResponse'
   *       404:
   *         description: Lead not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal Server Error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async getLeadById(req, res) {
    const timestamp = new Date().toISOString();
    const { id } = req.params;

    try {
      console.log(`${timestamp} - [LEADS] Searching lead by External User ID: ${id}`);

      const lead = await Lead.findOne({ external_user_id: id });

      if (!lead) {
        console.log(`${timestamp} - [LEADS] Lead not found - ID: ${id}`);
        return res.status(404).json({
          status: 'ERROR',
          message: 'Lead not found'
        });
      }

      console.log(`${timestamp} - [LEADS] Lead found - ID: ${lead.external_user_id}`);

      res.status(200).json({
        status: 'SUCCESS',
        data: lead,
      });
    } catch (error) {
      console.error(`${timestamp} - [LEADS] Error searching lead by ID: ${id}, Error: ${error.message}`);
      res.status(500).json({
        status: 'ERROR',
        message: 'Internal Server Error'
      });
    }
  }

  /**
   * @swagger
   * /leads/by-email/{email}:
   *   get:
   *     summary: Get lead by email
   *     description: Retrieves a specific lead using their email address
   *     tags: [Leads]
   *     parameters:
   *       - in: path
   *         name: email
   *         required: true
   *         schema:
   *           type: string
   *           format: email
   *         description: Lead email address
   *     responses:
   *       200:
   *         description: Lead found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/LeadResponse'
   *       404:
   *         description: Lead not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal Server Error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async getLeadByEmail(req, res) {
    const timestamp = new Date().toISOString();
    const { email } = req.params;

    try {
      console.log(`${timestamp} - [LEADS] Searching lead by email: ${email}`);

      const lead = await Lead.findOne({ email: email.toLowerCase().trim() });

      if (!lead) {
        console.log(`${timestamp} - [LEADS] Lead not found - Email: ${email}`);
        return res.status(404).json({
          status: 'ERROR',
          message: 'Lead not found'
        });
      }

      console.log(`${timestamp} - [LEADS] Lead found - ID: ${lead.external_user_id}`);

      res.status(200).json({
        status: 'SUCCESS',
        data: lead,
      });
    } catch (error) {
      console.error(`${timestamp} - [LEADS] Error searching lead by email: ${email}, Error: ${error.message}`);
      res.status(500).json({
        status: 'ERROR',
        message: 'Internal Server Error'
      });
    }
  }

  /**
   * @swagger
   * /leads/by-phone/{phone}:
   *   get:
   *     summary: Get lead by phone
   *     description: Retrieves a specific lead using their phone number
   *     tags: [Leads]
   *     parameters:
   *       - in: path
   *         name: phone
   *         required: true
   *         schema:
   *           type: string
   *         description: Lead phone number
   *     responses:
   *       200:
   *         description: Lead found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/LeadResponse'
   *       404:
   *         description: Lead not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal Server Error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async getLeadByPhone(req, res) {
    const timestamp = new Date().toISOString();
    const { phone } = req.params;

    try {
      console.log(`${timestamp} - [LEADS] Searching lead by phone: ${phone}`);

      const lead = await Lead.findOne({ phone: phone.trim() });

      if (!lead) {
        console.log(`${timestamp} - [LEADS] Lead not found - Phone: ${phone}`);
        return res.status(404).json({
          status: 'ERROR',
          message: 'Lead not found'
        });
      }

      console.log(`${timestamp} - [LEADS] Lead found - ID: ${lead.external_user_id}`);

      res.status(200).json({
        status: 'SUCCESS',
        data: lead,
      });
    } catch (error) {
      console.error(`${timestamp} - [LEADS] Error searching lead by phone: ${phone}, Error: ${error.message}`);
      res.status(500).json({
        status: 'ERROR',
        message: 'Internal Server Error'
      });
    }
  }
}

module.exports = new LeadsController();
