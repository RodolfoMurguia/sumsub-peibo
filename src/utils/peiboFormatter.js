/**
 * Peibo Formatter
 * Utilidad para transformar datos de Sumsub al formato de Peibo
 */

/**
 * Helper seguro para extraer valores de cuestionarios
 * @param {Array} questionnaires - Array de cuestionarios de Sumsub
 * @param {string} sectionId - ID de la sección (ej: informacionPersonal)
 * @param {string} fieldId - ID del campo (ej: rfc)
 * @returns {string} Valor del campo o string vacío
 */
const getQuestionValue = (questionnaires, sectionId, fieldId) => {
  if (!questionnaires || !Array.isArray(questionnaires)) return '';
  
  // Buscar el cuestionario que contiene la sección
  // Estructura: questionnaires[i].sections[sectionId].items[fieldId].value
  for (const q of questionnaires) {
    if (q.sections && q.sections[sectionId]) {
      const section = q.sections[sectionId];
      // Verificar si tiene la estructura con 'items'
      if (section.items && section.items[fieldId]) {
        return section.items[fieldId].value || '';
      }
      // Fallback: estructura directa sin 'items'
      if (section[fieldId]) {
        return section[fieldId].value || '';
      }
    }
  }
  return '';
};

/**
 * Mapea documentos de Sumsub a códigos de Peibo
 * @param {Array} metadataResources - Respuesta de /metadata/resources
 * @param {Array} questionnaires - Cuestionarios del applicant
 * @param {string} applicantId - ID del applicant
 * @param {string} inspectionId - ID de la inspección
 * @returns {Array} Array de documentos en formato Peibo
 */
const mapDocumentsToPeibo = (metadataResources, questionnaires, applicantId, inspectionId) => {
  const documentosPeibo = [];
  
  console.log('[PEIBO_FORMATTER] Starting document mapping...');
  console.log('[PEIBO_FORMATTER] metadataResources count:', metadataResources?.length || 0);
  
  if (!metadataResources || !Array.isArray(metadataResources)) {
    console.warn('[PEIBO_FORMATTER] No metadata resources provided');
    return documentosPeibo;
  }

  // Obtener el imageId del comprobante de domicilio desde el cuestionario
  const comprobanteDomicilioImageId = getQuestionValue(questionnaires, 'direccionEInformacio', 'comprobanteDeDomicil');
  console.log('[PEIBO_FORMATTER] Comprobante Domicilio ImageId from questionnaire:', comprobanteDomicilioImageId);

  for (const resource of metadataResources) {
    const idDocType = resource.idDocDef?.idDocType;
    const idDocSubType = resource.idDocDef?.idDocSubType;
    // En metadata/resources, el ID del documento está en 'id', no en 'imageId'
    const imageId = resource.id || resource.imageId;

    console.log(`[PEIBO_FORMATTER] Processing resource - idDocType: ${idDocType}, subType: ${idDocSubType}, imageId: ${imageId}`);

    if (!imageId) {
      console.warn('[PEIBO_FORMATTER] Resource without id/imageId, skipping:', JSON.stringify(resource));
      continue;
    }

    // Mapeo 1: ID_CARD o PASSPORT → 1050 (INE/Pasaporte)
    if (idDocType === 'ID_CARD' || idDocType === 'PASSPORT' || idDocType === 'IDCARD') {
      const fileName = resource.fileMetadata?.fileName || `document_${imageId}.pdf`;
      const fileSize = resource.fileMetadata?.fileSize || 0;
      const fileType = resource.fileMetadata?.fileType || 'pdf';
      
      documentosPeibo.push({
        id_tipo_documento: 1050,
        descripcion: "",
        sumsub_reference: `1050_${imageId}`,
        filename_original: fileName,
        size: fileSize,
        filename: `wf_${imageId}.${fileType}`,
        filetype: fileType,
        application: `application/${fileType}`,
        status: "P"
      });
      console.log(`[PEIBO_FORMATTER] Mapped ${idDocType} → 1050 (imageId: ${imageId})`);
    }

    // Mapeo 2: FILE_ATTACHMENT que coincida con comprobante de domicilio → 1053
    if (idDocType === 'FILE_ATTACHMENT') {
      console.log(`[PEIBO_FORMATTER] FILE_ATTACHMENT found - Comparing imageId: ${imageId} with questionnaire: ${comprobanteDomicilioImageId}`);
      // Verificar si este imageId coincide con el del cuestionario
      if (comprobanteDomicilioImageId && imageId === comprobanteDomicilioImageId) {
        const fileName = resource.fileMetadata?.fileName || `comprobante_${imageId}.pdf`;
        const fileSize = resource.fileMetadata?.fileSize || 0;
        const fileType = resource.fileMetadata?.fileType || 'pdf';
        
        documentosPeibo.push({
          id_tipo_documento: 1053,
          descripcion: "",
          sumsub_reference: `1053_${imageId}`,
          filename_original: fileName,
          size: fileSize,
          filename: `wf_${imageId}.${fileType}`,
          filetype: fileType,
          application: `application/${fileType}`,
          status: "P"
        });
        console.log(`[PEIBO_FORMATTER] ✓ Mapped FILE_ATTACHMENT → 1053 (Comprobante Domicilio, imageId: ${imageId})`);
      } else {
        console.warn(`[PEIBO_FORMATTER] ✗ FILE_ATTACHMENT with imageId ${imageId} does not match questionnaire reference (${comprobanteDomicilioImageId}), skipping`);
      }
    }
  }

  console.log(`[PEIBO_FORMATTER] Document mapping complete. Total documents mapped: ${documentosPeibo.length}`);
  
  if (documentosPeibo.length === 0) {
    console.warn('[PEIBO_FORMATTER] ⚠️  WARNING: No documents were mapped to Peibo format!');
  }

  return documentosPeibo;
};

/**
 * Formatea los datos crudos de Sumsub para enviar a Peibo (Persona Física)
 * @param {object} sumsubData - Datos completos del applicant de Sumsub
 * @param {object} leadData - Datos del lead
 * @param {Array} metadataResources - Metadata de documentos de /metadata/resources
 * @returns {object} Payload formateado para Peibo
 */
const formatSumsubDataToPeibo = (sumsubData, leadData = {}, metadataResources = []) => {
  const info = sumsubData.info || {};
  const fixedInfo = sumsubData.fixedInfo || {};
  const questionnaires = sumsubData.questionnaires || [];
  
  const firstName = info.firstName || fixedInfo.firstName || leadData.first_name || '';
  const lastName = info.lastName || fixedInfo.lastName || leadData.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim();
  const email = sumsubData.email || leadData.email || '';
  const phone = sumsubData.phone || leadData.phone || '';
  const dob = info.dob || fixedInfo.dob || ''; // YYYY-MM-DD
  const gender = (info.gender || fixedInfo.gender || 'M').substring(0, 1).toUpperCase(); // M/F

  // Extraer datos de cuestionarios
  const rfc = getQuestionValue(questionnaires, 'informacionPersonal', 'rfc') || "XAXX010101000";
  const curp = getQuestionValue(questionnaires, 'informacionPersonal', 'curp');
  
  // Dirección desde cuestionario
  const calle = getQuestionValue(questionnaires, 'direccionEInformacio', 'calle');
  const ciudad = getQuestionValue(questionnaires, 'direccionEInformacio', 'ciudad');
  const estado = getQuestionValue(questionnaires, 'direccionEInformacio', 'estado');
  const municipio = getQuestionValue(questionnaires, 'direccionEInformacio', 'municipioODelegacion');
  const colonia = getQuestionValue(questionnaires, 'direccionEInformacio', 'colonia');
  const cp = getQuestionValue(questionnaires, 'direccionEInformacio', 'cp');
  const numeroExterior = getQuestionValue(questionnaires, 'direccionEInformacio', 'numeroExterior');
  const numeroInterior = getQuestionValue(questionnaires, 'direccionEInformacio', 'numeroInterior');

  // Datos económicos y laborales
  const ocupacion = getQuestionValue(questionnaires, 'newSection5', 'newQuestion51') || "N/A";
  const giro = getQuestionValue(questionnaires, 'newSection5', 'sectorIndustria') || "N/A";
  const actividadEconomica = getQuestionValue(questionnaires, 'newSection5', 'sectorIndustria') || "N/A";
  const ingresoMensual = getQuestionValue(questionnaires, 'newSection5', 'ingresoMensualMxn') || "0.00";
  const isPep = getQuestionValue(questionnaires, 'newSection5', 'esPep');

  const esPepValue = (isPep === 'yes' || isPep === true || isPep === 'true' || isPep === 'YES') ? 'S' : 'N';

  // Construcción de Documentos usando metadata/resources
  const documentosPeibo = mapDocumentsToPeibo(
    metadataResources,
    questionnaires,
    sumsubData.id,
    sumsubData.inspectionId
  );

  return {
    Clientes: [
      {
        nombre: fullName,
        rfc: rfc,
        status: "success"
      }
    ],
    GLOBAL_Asociados: [
      {
        nivel_cuenta: "N3",
        id_country: 1,
        id_timezone: 1,
        tipo_persona: "PF_MEX",
        nombre_completo: fullName,
        desactivar_emails_comprobantes: "N",
        quitar_control_IPs: "N",
        delay_30_nuevos_guest: "N",
        delay_30_transf_otros_bancos: "0",
        delay_30_transf_UnalanaPAY: "0",
        uso_estricto_gps: "N",
        importe_max_evento: "10000.00",
        importe_max_dia: "50000.00",
        importe_max_mes: "200000.00",
        tipo_cliente: "Nuevo",
        monto_egreso_nuevo: "0.00",
        monto_egreso_acumulado: "0.00"
      }
    ],
    Nombres: [
      {
        paterno: lastName,
        materno: "", 
        nombre: firstName,
        sexo: gender,
        id_pais_nacionalidad: 1,
        fecha_nacimiento: dob,
        id_pais_nacimiento: 1,
        rfc: rfc,
        curp: curp || "XAXX010101XXXXXX00",
        ocupacion: ocupacion,
        giro: giro,
        ingreso_mensual: ingresoMensual,
        actividad_economica: actividadEconomica,
        tipo_contacto: "Usuario Administrador",
        es_pep: esPepValue,
        cargo_pep: "",
        correo_alterno: email,
        telefono_casa: phone,
        status: "Activo",
        status_validacion_identidad: "Validado",
        status_validacion_biometrica: "Validado"
      }
    ],
    Admin: [
      {
        paterno: lastName,
        materno: "",
        nombre: firstName,
        correo_alterno: email,
        telefono_casa: phone,
        tipo_contacto: "Usuario Administrador",
        status: "Activo"
      }
    ],
    Direcciones: [
      {
        id_pais: 1,
        calle: calle || "Desconocida",
        ciudad: ciudad || municipio || "Desconocida",
        estado: estado || "Desconocido",
        cp: cp || "00000",
        noInterior: numeroInterior || "",
        noExterior: numeroExterior || "",
        municipio: municipio || "Desconocido",
        colonia: colonia || "Desconocida",
        tipo_direccion: "Fiscal",
        habilitado: "S"
      }
    ],
    Documentos: documentosPeibo,
    CSF: [],
    CFDI: []
  };
};

module.exports = {
  formatSumsubDataToPeibo
};
