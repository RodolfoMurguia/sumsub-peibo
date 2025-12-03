/**
 * Webhook Controller
 * Maneja los webhooks recibidos de Sumsub
 */

const Lead = require('../models/Lead');
const PeiboOnboarding = require('../models/PeiboOnboarding');
const sumsubConfig = require('../config/sumsub');
const sumsubService = require('../services/sumsubService');
const peiboService = require('../services/peiboService');
const { formatSumsubDataToPeibo } = require('../utils/peiboFormatter');
const crypto = require('crypto');

class WebhookController {
  async handleWebhook(req, res) {
    const timestamp = new Date().toISOString();
    const payload = req.body;
    
    try {
      console.log(`${timestamp} - [WEBHOOK] Received Sumsub webhook:`, JSON.stringify(payload));

      // 1. Validar nivel (Level Name)
      // Nota: applicantCreated a veces llega sin levelName o con uno diferente si es global, 
      // pero los críticos (pending, reviewed) suelen traerlo.
      // Si el payload trae levelName, lo validamos contra el configurado.
      if (payload.levelName && payload.levelName !== sumsubConfig.levelName && payload.levelName !== sumsubConfig.levelNameKyb) {
        console.warn(`${timestamp} - [WEBHOOK] Ignored webhook for different level: ${payload.levelName} (Expected: ${sumsubConfig.levelName} or ${sumsubConfig.levelNameKyb})`);
      if (payload.levelName && payload.levelName !== sumsubConfig.levelName) {
        console.warn(`${timestamp} - [WEBHOOK] Ignored webhook for different level: ${payload.levelName} (Expected: ${sumsubConfig.levelName})`);
      if (payload.levelName && payload.levelName !== sumsubConfig.levelName && payload.levelName !== sumsubConfig.levelNameKyb) {
        console.warn(`${timestamp} - [WEBHOOK] Ignored webhook for different level: ${payload.levelName} (Expected: ${sumsubConfig.levelName} or ${sumsubConfig.levelNameKyb})`);

      if (payload.levelName && payload.levelName !== sumsubConfig.levelName && payload.levelName !== sumsubConfig.levelNameKyb) {
        console.warn(`${timestamp} - [WEBHOOK] Ignored webhook for different level: ${payload.levelName} (Expected: ${sumsubConfig.levelName} or ${sumsubConfig.levelNameKyb})`);

      if (payload.levelName && payload.levelName !== sumsubConfig.levelName && payload.levelName !== sumsubConfig.levelNameKyb) {
        console.warn(`${timestamp} - [WEBHOOK] Ignored webhook for different level: ${payload.levelName} (Expected: ${sumsubConfig.levelName} or ${sumsubConfig.levelNameKyb})`);

      if (payload.levelName && payload.levelName !== sumsubConfig.levelName && payload.levelName !== sumsubConfig.levelNameKyb) {
        console.warn(`${timestamp} - [WEBHOOK] Ignored webhook for different level: ${payload.levelName} (Expected: ${sumsubConfig.levelName} or ${sumsubConfig.levelNameKyb})`);

      if (payload.levelName && payload.levelName !== sumsubConfig.levelName && payload.levelName !== sumsubConfig.levelNameKyb) {
        console.warn(`${timestamp} - [WEBHOOK] Ignored webhook for different level: ${payload.levelName} (Expected: ${sumsubConfig.levelName} or ${sumsubConfig.levelNameKyb})`);

      if (payload.levelName && payload.levelName !== sumsubConfig.levelName && payload.levelName !== sumsubConfig.levelNameKyb) {
        console.warn(`${timestamp} - [WEBHOOK] Ignored webhook for different level: ${payload.levelName} (Expected: ${sumsubConfig.levelName} or ${sumsubConfig.levelNameKyb})`);

      if (payload.levelName && payload.levelName !== sumsubConfig.levelName && payload.levelName !== sumsubConfig.levelNameKyb) {
        console.warn(`${timestamp} - [WEBHOOK] Ignored webhook for different level: ${payload.levelName} (Expected: ${sumsubConfig.levelName} or ${sumsubConfig.levelNameKyb})`);

      if (payload.levelName && payload.levelName !== sumsubConfig.levelName && payload.levelName !== sumsubConfig.levelNameKyb) {
        console.warn(`${timestamp} - [WEBHOOK] Ignored webhook for different level: ${payload.levelName} (Expected: ${sumsubConfig.levelName} or ${sumsubConfig.levelNameKyb})`);

      if (payload.levelName && payload.levelName !== sumsubConfig.levelName && payload.levelName !== sumsubConfig.levelNameKyb) {
        console.warn(`${timestamp} - [WEBHOOK] Ignored webhook for different level: ${payload.levelName} (Expected: ${sumsubConfig.levelName} or ${sumsubConfig.levelNameKyb})`);

        return res.status(200).send('Ignored'); // Responder 200 para que Sumsub no reintente infinitamente
      }

      const { externalUserId, applicantId, type, reviewStatus, reviewResult } = payload;

      if (!externalUserId) {
        console.error(`${timestamp} - [WEBHOOK] Missing externalUserId`);
        // Respondemos 200 para evitar reintentos de un payload inválido
        return res.status(200).send('Missing externalUserId');
      }

      // 2. Buscar Lead
      const lead = await Lead.findOne({ external_user_id: externalUserId });

      if (!lead) {
        console.error(`${timestamp} - [WEBHOOK] Lead not found for externalUserId: ${externalUserId}`);
        return res.status(200).send('Lead not found');
      }

      // 3. Validar applicantId (si el lead ya lo tiene)
      if (lead.applicant_id && lead.applicant_id !== applicantId) {
        console.warn(`${timestamp} - [WEBHOOK] Mismatch applicantId. Lead: ${lead.applicant_id}, Webhook: ${applicantId}`);
        // Continuamos, asumiendo que el webhook trae la info más reciente o relevante.
      }

      // Si el lead no tenía applicantId, lo guardamos ahora
      if (!lead.applicant_id) {
        lead.applicant_id = applicantId;
      }

      // 4. Mapear Status y Actualizar
      // Convertir type a UPPER_SNAKE_CASE (ej: applicantPending -> APPLICANT_PENDING)
      const newStatus = type.replace(/([A-Z])/g, '_$1').toUpperCase();

      // Construir detalles del evento
      let details = `Webhook type: ${type}`;
      
      if (reviewStatus) {
        details += `, Review Status: ${reviewStatus}`;
      }
      
      if (reviewResult && reviewResult.reviewAnswer) {
        details += `, Answer: ${reviewResult.reviewAnswer}`;
        
        // Lógica para APPLICANT_REVIEWED
        // Nota: Sumsub envía applicantReviewed, que mapeamos a APPLICANT_REVIEWED
        if (newStatus === 'APPLICANT_REVIEWED') {
          if (reviewResult.reviewAnswer === 'GREEN') {
            lead.kyc_result = 'GREEN';
            
            // Obtener datos completos del applicant y sus documentos
            try {
              console.log(`${timestamp} - [WEBHOOK] Applicant approved. Fetching full data for ID: ${applicantId}`);
              
              // Obtener datos del applicant y metadata de documentos en paralelo
              const [applicantData, metadataResourcesResponse] = await Promise.all([
                sumsubService.getApplicantData(applicantId),
                sumsubService.getApplicantMetadataResources(applicantId)
              ]);
              
              console.log(`${timestamp} - [WEBHOOK] Full Applicant Data for ${externalUserId}:`, JSON.stringify(applicantData, null, 2));
              console.log(`${timestamp} - [WEBHOOK] Metadata Resources Response:`, JSON.stringify(metadataResourcesResponse, null, 2));
              
              // Extraer el array de items de la respuesta
              const metadataResources = metadataResourcesResponse?.items || [];
              console.log(`${timestamp} - [WEBHOOK] Extracted ${metadataResources.length} metadata resources`);

              // Procesamiento condicional según lead_type
              console.log(`${timestamp} - [WEBHOOK] Lead data - lead_type: "${lead.lead_type}", company_name: "${lead.company_name}"`);
              console.log(`${timestamp} - [WEBHOOK] Checking condition: lead.lead_type === 'company' => ${lead.lead_type === 'company'}`);
              
              if (lead.lead_type === 'company') {
                // ========== PROCESO KYB (PERSONA MORAL) ==========
                console.log(`${timestamp} - [WEBHOOK] Processing KYB for company: ${lead.company_name}`);
                
                try {
                  const { formatKybDataToPeibo, identifyRepresentanteLegal, validateCritical } = require('../utils/peiboFormatterCompany');
                  
                  // Validar estructura KYB
                  if (!applicantData.fixedInfo?.companyInfo?.beneficiaries) {
                    throw new Error('KYB data missing beneficiaries structure');
                  }
                  
                  // Identificar Representante Legal
                  const repLegalUbo = identifyRepresentanteLegal(applicantData.fixedInfo.companyInfo.beneficiaries);
                  
                  if (!repLegalUbo || !repLegalUbo.applicantId) {
                    throw new Error('Representative Legal not found or missing KYC applicantId');
                  }
                  
                  console.log(`${timestamp} - [WEBHOOK] Rep Legal identified: ${repLegalUbo.firstName} ${repLegalUbo.lastName} (applicantId: ${repLegalUbo.applicantId})`);
                  
                  // Obtener KYC del Representante Legal
                  const repLegalKyc = await sumsubService.getApplicantData(repLegalUbo.applicantId);
                  console.log(`${timestamp} - [WEBHOOK] Rep Legal KYC obtained successfully`);
                  
                  // Obtener beneficiarios (excluir Rep Legal)
                  const beneficiariosList = applicantData.fixedInfo.companyInfo.beneficiaries.filter(
                    ubo => !ubo.types?.includes('authorizedSignatory')
                  );
                  
                  console.log(`${timestamp} - [WEBHOOK] Found ${beneficiariosList.length} beneficiarios to process`);
                  
                  // Obtener KYCs de beneficiarios en paralelo
                  const beneficiariosKyc = await Promise.all(
                    beneficiariosList.map(async (ubo) => {
                      if (ubo.applicantId) {
                        try {
                          console.log(`${timestamp} - [WEBHOOK] Fetching KYC for beneficiary: ${ubo.firstName} ${ubo.lastName} (${ubo.applicantId})`);
                          const kyc = await sumsubService.getApplicantData(ubo.applicantId);
                          return { ubo, kyc };
                        } catch (err) {
                          console.warn(`${timestamp} - [WEBHOOK] Failed to get KYC for beneficiary ${ubo.applicantId}: ${err.message}`);
                          return { ubo, kyc: null };
                        }
                      }
                      console.log(`${timestamp} - [WEBHOOK] Beneficiary ${ubo.firstName} ${ubo.lastName} has no applicantId, using basic data`);
                      return { ubo, kyc: null };
                    })
                  );
                  
                  // Validaciones críticas
                  validateCritical({
                    representanteLegal: repLegalKyc,
                    beneficiarios: applicantData.fixedInfo.companyInfo.beneficiaries
                  });
                  
                  console.log(`${timestamp} - [WEBHOOK] All critical validations passed`);
                  
                  // Formatear datos a formato Peibo
                  const peiboPayload = formatKybDataToPeibo(
                    applicantData,
                    lead,
                    metadataResources,
                    { repLegalKyc, beneficiariosKyc }
                  );
                  
                  console.log(`${timestamp} - [WEBHOOK] KYB Peibo Payload generated successfully`);
                  
                  // Guardar payload en MongoDB
                  const peiboOnboarding = new PeiboOnboarding({
                    external_user_id: externalUserId,
                    applicant_id: applicantId,
                    lead_id: lead._id,
                    payload: peiboPayload,
                    status: 'PENDING'
                  });
                  
                  await peiboOnboarding.save();
                  console.log(`${timestamp} - [WEBHOOK] ✓ KYB Peibo payload saved to database with ID: ${peiboOnboarding._id}`);
                  
                  // Registrar evento en lead
                  lead.event_history.push({
                    status: 'KYB_PAYLOAD_GENERATED',
                    timestamp: new Date(),
                    details: `KYB Peibo payload generated for ${lead.company_name}. Onboarding ID: ${peiboOnboarding._id}`
                  });
                  
                } catch (kybError) {
                  console.error(`${timestamp} - [WEBHOOK] KYB processing failed: ${kybError.message}`);
                  console.error(`${timestamp} - [WEBHOOK] KYB Error stack:`, kybError.stack);
                  
                  lead.kyc_result = 'RED';
                  lead.rejection_details = {
                    type: 'KYB_PROCESSING_ERROR',
                    details: kybError.message
                  };
                  
                  lead.event_history.push({
                    status: 'KYB_PROCESSING_FAILED',
                    timestamp: new Date(),
                    details: `KYB processing failed: ${kybError.message}`
                  });
                }
                
              } else {
                // ========== PROCESO KYC (PERSONA FÍSICA) ==========
                try {
                  const peiboPayload = formatSumsubDataToPeibo(applicantData, lead, metadataResources);
                  console.log(`${timestamp} - [WEBHOOK] Peibo Payload:`, JSON.stringify(peiboPayload, null, 2));
                  
                  // Guardar payload en colección peibo_onboardings
                  const peiboOnboarding = new PeiboOnboarding({
                    external_user_id: externalUserId,
                    applicant_id: applicantId,
                    lead_id: lead._id,
                    payload: peiboPayload,
                    status: 'PENDING'
                  });
                  
                  await peiboOnboarding.save();
                  console.log(`${timestamp} - [WEBHOOK] ✓ Peibo payload saved to database with ID: ${peiboOnboarding._id}`);
                  
                  // TODO: Descomentar cuando se quiera enviar a Peibo
                  /*
                  console.log(`${timestamp} - [WEBHOOK] Sending data to Peibo...`);
                  const peiboResponse = await peiboService.sendOnboardingData(peiboPayload);
                  console.log(`${timestamp} - [WEBHOOK] Peibo response:`, JSON.stringify(peiboResponse));
                  
                  // Actualizar registro con respuesta exitosa
                  peiboOnboarding.status = 'SENT';
                  peiboOnboarding.peibo_response = peiboResponse;
                  await peiboOnboarding.save();
                  */
                  
                  // Guardar referencia de que se guardó el payload
                  lead.event_history.push({
                    status: 'PAYLOAD_GENERATED',
                    timestamp: new Date(),
                    details: `Peibo payload generated and saved. Onboarding ID: ${peiboOnboarding._id}`
                  });
                } catch (peiboError) {
                  console.error(`${timestamp} - [WEBHOOK] Failed to generate/save Peibo payload:`, peiboError.message);
                  
                  lead.event_history.push({
                    status: 'PAYLOAD_GENERATION_FAILED',
                    timestamp: new Date(),
                    details: `Failed to generate Peibo payload: ${peiboError.message}`
                  });
                }
              }

            } catch (dataError) {
              console.error(`${timestamp} - [WEBHOOK] Error fetching applicant data:`, dataError.message);
            }

          } else if (reviewResult.reviewAnswer === 'RED') {
            lead.kyc_result = 'RED';
            if (reviewResult.reviewRejectType) {
              lead.rejection_details = {
                type: reviewResult.reviewRejectType,
                details: reviewResult.rejectLabels || 'No specific labels'
              };
            }
          }
        }
      }

      if (reviewResult && reviewResult.reviewRejectType) {
        details += `, Reject Type: ${reviewResult.reviewRejectType}`;
      }

      // Actualizar status
      // El hook pre-save detectará el cambio de status y agregará un evento genérico.
      lead.status = newStatus;
      
      // Para tener más detalle, agregamos manualmente el evento con los detalles ricos del webhook.
      // Nota: Esto podría causar que haya dos eventos seguidos si el hook también corre, 
      // pero preferimos tener la data detallada.
      // Como lead.status cambió, el hook correrá.
      // Una estrategia limpia es dejar que el hook registre el cambio de status,
      // y nosotros solo nos aseguramos de que el status se actualice.
      
      // Sin embargo, el usuario pidió registrar detalles específicos ("reviewAnswer", etc).
      // Modificamos el array event_history directamente.
      lead.event_history.push({
        status: newStatus,
        timestamp: new Date(),
        details: details
      });

      // Al guardar, como 'status' cambió, el hook pre-save intentará agregar otro evento.
      // Esto puede resultar en duplicados. 
      // Para evitarlo, podríamos confiar en el hook SI el hook fuera lo suficientemente inteligente para ver detalles,
      // pero no lo es. 
      // Aceptaremos el comportamiento del hook (registro de cambio de estado) + nuestro registro detallado, 
      // O modificamos el modelo para que no duplique si ya existe un evento reciente con el mismo status.
      // Por ahora, dejaremos que Mongo maneje el guardado.
      
      await lead.save();
      console.log(`${timestamp} - [WEBHOOK] Lead updated. Status: ${newStatus}, ExternalID: ${externalUserId}`);

      res.status(200).send('OK');

    } catch (error) {
      console.error(`${timestamp} - [WEBHOOK] Error processing webhook:`, error);
      res.status(500).send('Internal Server Error');
    }
  }
}

module.exports = new WebhookController();
