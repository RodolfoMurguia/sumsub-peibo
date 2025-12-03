/**
 * Peibo Formatter Company (KYB)
 * Transforma datos de Sumsub KYB al formato de Peibo para Persona Moral
 */

const {
  mapCountryToId,
  mapStateToId,
  booleanToSN,
  calculateTransactionLimits,
  mapTipoIdentificacion,
  mapValidationStatus,
  DOCUMENTOS_EMPRESA,
  SUMSUB_DOC_TO_PEIBO
} = require('./catalogos');

/**
 * Helper seguro para extraer valores de cuestionarios KYB
 * @param {Array} questionnaires - Array de cuestionarios de Sumsub
 * @param {string} sectionId - ID de la sección
 * @param {string} fieldId - ID del campo
 * @returns {string} Valor del campo o string vacío
 */
const getQuestionValueKyb = (questionnaires, sectionId, fieldId) => {
  if (!questionnaires || !Array.isArray(questionnaires)) return '';
  
  for (const q of questionnaires) {
    if (q.sections && q.sections[sectionId]) {
      const section = q.sections[sectionId];
      // Estructura con items
      if (section.items && section.items[fieldId]) {
        return section.items[fieldId].value || '';
      }
      // Estructura directa
      if (section[fieldId]) {
        return section[fieldId].value || section[fieldId] || '';
      }
    }
  }
  return '';
};

/**
 * Identifica el Representante Legal desde el array de beneficiaries
 * Regla RN-001: Buscar UBO con "authorizedSignatory" en types
 * @param {Array} beneficiaries - Array de UBOs
 * @returns {object|null} UBO que es Representante Legal o null
 */
const identifyRepresentanteLegal = (beneficiaries) => {
  console.log('[KYB_FORMATTER] Identifying Representante Legal...');
  
  if (!beneficiaries || !Array.isArray(beneficiaries)) {
    console.warn('[KYB_FORMATTER] No beneficiaries array provided');
    return null;
  }
  
  const repLegal = beneficiaries.find(ubo => 
    ubo.types && Array.isArray(ubo.types) && ubo.types.includes('authorizedSignatory')
  );
  
  if (repLegal) {
    console.log(`[KYB_FORMATTER] Representante Legal found: ${repLegal.firstName} ${repLegal.lastName}, applicantId: ${repLegal.applicantId}`);
  } else {
    console.error('[KYB_FORMATTER] CRITICAL: No Representante Legal found with authorizedSignatory');
  }
  
  return repLegal || null;
};

/**
 * Extrae beneficiarios/accionistas (todos los UBOs excepto el Rep Legal)
 * Regla RN-002: Filtrar UBOs que NO sean authorizedSignatory
 * @param {Array} beneficiaries - Array de UBOs
 * @param {string} representanteLegalApplicantId - applicantId del Rep Legal para excluirlo
 * @returns {Array} Array de beneficiarios
 */
const extractBeneficiarios = (beneficiaries, representanteLegalApplicantId) => {
  console.log('[KYB_FORMATTER] Extracting Beneficiarios/Accionistas...');
  
  if (!beneficiaries || !Array.isArray(beneficiaries)) {
    return [];
  }
  
  const beneficiarios = beneficiaries.filter(ubo => {
    // Excluir el Representante Legal
    if (ubo.applicantId && ubo.applicantId === representanteLegalApplicantId) {
      return false;
    }
    // Excluir si tiene authorizedSignatory en types
    if (ubo.types && Array.isArray(ubo.types) && ubo.types.includes('authorizedSignatory')) {
      return false;
    }
    return true;
  });
  
  console.log(`[KYB_FORMATTER] Found ${beneficiarios.length} beneficiarios`);
  return beneficiarios;
};

/**
 * Validaciones críticas según Reglas de Negocio
 * RN-001, RN-003, RN-004
 * @param {object} data - Datos para validar
 * @throws {Error} Si alguna validación crítica falla
 */
const validateCritical = (data) => {
  console.log('[KYB_FORMATTER] Running critical validations...');
  
  // RN-001: Representante Legal existe y tiene KYC
  if (!data.representanteLegal || !data.representanteLegal.id) {
    throw new Error('CRITICAL: Representative Legal KYC not found or missing applicantId');
  }
  
  // RN-003: Suma de porcentajes ≤ 100%
  if (data.beneficiarios && Array.isArray(data.beneficiarios)) {
    const totalPercentage = data.beneficiarios.reduce((sum, ubo) => {
      const shareValue = ubo.share?.value || 0;
      return sum + shareValue;
    }, 0);
    
    console.log(`[KYB_FORMATTER] Total share percentage: ${totalPercentage}%`);
    
    if (totalPercentage > 100) {
      throw new Error(`CRITICAL: Share percentage exceeds 100% (${totalPercentage}%)`);
    }
  }
  
  // RN-003: Mínimo 1 beneficiario requerido
  if (!data.beneficiarios || data.beneficiarios.length === 0) {
    console.warn('[KYB_FORMATTER] WARNING: No beneficiaries found (at least 1 required)');
    // No throw error aquí porque puede haber casos donde solo está el Rep Legal
  }
  
  console.log('[KYB_FORMATTER] ✓ All critical validations passed');
};

/**
 * Mapea un contacto individual (Rep Legal o Beneficiario) desde su KYC
 * Tablas 5.4 y 5.5.1
 * @param {object} kycData - Datos del KYC individual
 * @param {object} uboData - Datos del UBO desde el array de beneficiaries
 * @param {string} tipoContacto - "Representante Legal" o "Beneficiario"
 * @returns {object} Objeto Nombre para Peibo
 */
const mapContactoFromKyc = (kycData, uboData, tipoContacto) => {
  const info = kycData.info || {};
  const questionnaires = kycData.questionnaires || [];
  const idDocs = kycData.idDocs || [];
  const review = kycData.review || {};
  
  // Extraer datos del cuestionario
  const rfc = getQuestionValueKyb(questionnaires, 'tax_section', 'rfc');
  const curp = getQuestionValueKyb(questionnaires, 'tax_section', 'curp');
  const ocupacion = getQuestionValueKyb(questionnaires, 'economic_activity_section', 'occupation');
  const giro = getQuestionValueKyb(questionnaires, 'economic_activity_section', 'economic_activity');
  const ingresoMensual = getQuestionValueKyb(questionnaires, 'income_section', 'monthly_income');
  const actividadEconomica = getQuestionValueKyb(questionnaires, 'economic_activity_section', 'economic_activity');
  const isPep = getQuestionValueKyb(questionnaires, 'pep_section', 'is_pep');
  const cargoPep = getQuestionValueKyb(questionnaires, 'pep_section', 'pep_position');
  
  // Validación de estados
  const reviewAnswer = review.reviewResult?.reviewAnswer || 'YELLOW';
  const validationStatus = mapValidationStatus(reviewAnswer);
  
  // Tipo de identificación
  const tipoId = idDocs.length > 0 ? mapTipoIdentificacion(idDocs[0].idDocType) : 'INE';
  const numeroId = idDocs.length > 0 ? (idDocs[0].number || '') : '';
  
  const contacto = {
    paterno: info.lastName || info.lastNameEs || '',
    materno: info.middleName || info.middleNameEs || '',
    nombre: info.firstName || info.firstNameEs || '',
    sexo: info.gender === 'M' ? 'M' : (info.gender === 'F' ? 'F' : ''),
    id_pais_nacionalidad: mapCountryToId(info.nationality),
    fecha_nacimiento: info.dob || '',
    id_pais_nacimiento: mapCountryToId(info.placeOfBirth || info.nationality),
    rfc: rfc,
    curp: curp,
    ocupacion: ocupacion,
    giro: giro,
    ingreso_mensual: ingresoMensual,
    actividad_economica: actividadEconomica,
    tipo_contacto: tipoContacto,
    es_pep: booleanToSN(isPep),
    cargo_pep: isPep === 'true' || isPep === true ? cargoPep : '',
    correo_alterno: info.email || '',
    telefono_casa: info.phone || '',
    tipo_identificacion: tipoId,
    identificacion: numeroId,
    status: 'Activo',
    status_validacion_identidad: validationStatus.identidad,
    status_validacion_biometrica: validationStatus.biometrica
  };
  
  // Si es beneficiario, agregar porcentaje accionario
  if (tipoContacto === 'Beneficiario' && uboData) {
    contacto.porcentaje_accionario = uboData.share?.value || 0;
  }
  
  return contacto;
};

/**
 * Mapea un beneficiario sin KYC (solo datos básicos del UBO)
 * Tabla 5.5.2
 * @param {object} uboData - Datos básicos del UBO
 * @returns {object} Objeto Nombre básico para Peibo
 */
const mapContactoBasico = (uboData) => {
  return {
    paterno: uboData.lastName || '',
    materno: '',
    nombre: uboData.firstName || '',
    sexo: '',
    id_pais_nacionalidad: null,
    fecha_nacimiento: '',
    id_pais_nacimiento: null,
    rfc: '',
    curp: '',
    tipo_contacto: 'Beneficiario',
    porcentaje_accionario: uboData.share?.value || 0,
    es_pep: booleanToSN(uboData.isPep),
    cargo_pep: '',
    status: 'Activo'
  };
};

/**
 * Mapea documentos corporativos desde metadataResources
 * Tabla 5.8.1 y 7.2 (documentos condicionales)
 * @param {Array} metadataResources - Recursos de documentos
 * @param {string} entityType - Tipo de entidad
 * @param {boolean} isVulnerableActivity - Si tiene actividad vulnerable
 * @param {string} applicantId - ID del applicant
 * @param {string} inspectionId - ID de la inspección
 * @returns {Array} Array de documentos para Peibo
 */
const mapDocumentosEmpresa = (metadataResources, entityType, isVulnerableActivity, applicantId, inspectionId) => {
  console.log('[KYB_FORMATTER] Mapping company documents...');
  const documentosPeibo = [];
  
  if (!metadataResources || !Array.isArray(metadataResources)) {
    console.warn('[KYB_FORMATTER] No metadata resources provided');
    return documentosPeibo;
  }
  
  for (const resource of metadataResources) {
    const idDocType = resource.idDocDef?.idDocType;
    const idDocSubType = resource.idDocDef?.idDocSubType;
    const imageId = resource.id || resource.imageId;
    
    if (!imageId) {
      console.warn('[KYB_FORMATTER] Resource without ID, skipping:', JSON.stringify(resource));
      continue;
    }
    
    let codigoPeibo = null;
    let descripcion = '';
    
    // Mapeo basado en tipo de documento
    if (idDocType === 'COMPANY_DOC') {
      // Documentos de empresa
      if (idDocSubType && idDocSubType.toLowerCase().includes('article')) {
        codigoPeibo = DOCUMENTOS_EMPRESA.COMPANY_DOC_ARTICLES; // 1000
        descripcion = 'Acta Constitutiva';
      } else if (idDocSubType && (idDocSubType.toLowerCase().includes('tax') || idDocSubType.toLowerCase().includes('csf'))) {
        codigoPeibo = DOCUMENTOS_EMPRESA.COMPANY_DOC_TAX_ID; // 1001
        descripcion = 'Constancia Situación Fiscal';
      } else if (idDocSubType && idDocSubType.toLowerCase().includes('fiel')) {
        codigoPeibo = DOCUMENTOS_EMPRESA.COMPANY_DOC_FIEL; // 1008
        descripcion = 'FIEL';
      } else {
        codigoPeibo = DOCUMENTOS_EMPRESA.COMPANY_DOC_ARTICLES; // Default
        descripcion = 'Documento Empresa';
      }
    } else if (idDocType === 'DIRECTORS' || idDocType === 'DIRECTOR') {
      codigoPeibo = DOCUMENTOS_EMPRESA.DIRECTORS_ID; // 1002
      descripcion = 'Identificación Representante Legal';
    } else if (idDocType === 'POWER_OF_ATTORNEY') {
      codigoPeibo = DOCUMENTOS_EMPRESA.POWER_OF_ATTORNEY; // 1012
      descripcion = 'Poder Notarial';
    } else if (idDocType === 'PROOF_OF_RESIDENCE' || idDocType === 'UTILITY_BILL') {
      codigoPeibo = DOCUMENTOS_EMPRESA.PROOF_OF_RESIDENCE; // 1053
      descripcion = 'Comprobante de Domicilio';
    } else if (idDocType === 'REGISTRATION_DOC') {
      codigoPeibo = DOCUMENTOS_EMPRESA.REGISTRATION_DOC; // 1054
      descripcion = 'Registro Público de la Propiedad';
    } else if (idDocType === 'SELFIE') {
      codigoPeibo = DOCUMENTOS_EMPRESA.SELFIE; // 1006
      descripcion = 'Selfie/Video KYC';
    }
    
    // Documentos condicionales según tipo de entidad (Tabla 7.2)
    if (entityType && entityType.toUpperCase().includes('SOFOM')) {
      // Documentos específicos SOFOM
      if (idDocType === 'TECHNICAL_OPINION') {
        codigoPeibo = DOCUMENTOS_EMPRESA.TECHNICAL_OPINION; // 1704
        descripcion = 'Dictamen Técnico';
      } else if (idDocType === 'COMPLIANCE_MANUAL') {
        codigoPeibo = DOCUMENTOS_EMPRESA.COMPLIANCE_MANUAL; // 1705
        descripcion = 'Manual de Cumplimiento';
      }
    }
    
    if (isVulnerableActivity) {
      // Documentos específicos Actividad Vulnerable
      if (idDocType === 'VULNERABLE_ACTIVITY_REGISTRATION') {
        codigoPeibo = DOCUMENTOS_EMPRESA.VULNERABLE_ACTIVITY_REGISTRATION; // 1711
        descripcion = 'Inscripción Actividad Vulnerable';
      }
    }
    
    if (codigoPeibo) {
      const fileName = resource.fileMetadata?.fileName || `document_${imageId}.pdf`;
      const fileSize = resource.fileMetadata?.fileSize || 0;
      const fileType = resource.fileMetadata?.fileType || 'pdf';
      const mimeType = resource.fileMetadata?.contentType || `application/${fileType}`;
      
      documentosPeibo.push({
        id_tipo_documento: codigoPeibo,
        descripcion: descripcion,
        sumsub_reference: `${codigoPeibo}_${imageId}`,
        sumsub_doc_id: imageId,
        sumsub_applicant_id: applicantId,
        sumsub_inspection_id: inspectionId || '',
        filename_original: fileName,
        size: fileSize,
        filename: `wf_${imageId}.${fileType}`,
        filetype: fileType,
        application: mimeType,
        status: 'P' // Pendiente
      });
      
      console.log(`[KYB_FORMATTER] Mapped document: ${idDocType} → ${codigoPeibo} (${descripcion})`);
    }
  }
  
  console.log(`[KYB_FORMATTER] Total documents mapped: ${documentosPeibo.length}`);
  return documentosPeibo;
};

/**
 * Función principal: Formatea datos KYB de Sumsub al formato Peibo Persona Moral
 * @param {object} kybData - Datos completos del KYB desde Sumsub
 * @param {object} leadData - Datos del lead desde MongoDB
 * @param {Array} metadataResources - Metadata de documentos
 * @param {object} kycData - Objeto con repLegalKyc y beneficiariosKyc
 * @returns {object} JSON completo para Peibo
 */
const formatKybDataToPeibo = (kybData, leadData, metadataResources, kycData) => {
  console.log('[KYB_FORMATTER] Starting KYB to Peibo transformation...');
  
  const { repLegalKyc, beneficiariosKyc } = kycData;
  const companyInfo = kybData.info?.companyInfo || {};
  const questionnaires = kybData.questionnaires || [];
  const addresses = kybData.info?.addresses || [];
  const beneficiaries = kybData.fixedInfo?.companyInfo?.beneficiaries || [];
  
  // Identificar Representante Legal
  const repLegalUbo = identifyRepresentanteLegal(beneficiaries);
  
  // Validaciones críticas
  validateCritical({
    representanteLegal: repLegalKyc,
    beneficiarios: beneficiaries
  });
  
  // Extraer datos del cuestionario KYB
  const taxRegime = getQuestionValueKyb(questionnaires, 'company_basic_info', 'tax_regime');
  const incorporationCountry = getQuestionValueKyb(questionnaires, 'company_basic_info', 'incorporation_country');
  const businessSector = getQuestionValueKyb(questionnaires, 'business_activity', 'business_sector');
  const economicActivity = getQuestionValueKyb(questionnaires, 'business_activity', 'economic_activity');
  const companyPurpose = getQuestionValueKyb(questionnaires, 'business_activity', 'company_purpose');
  const annualRevenue = getQuestionValueKyb(questionnaires, 'financial_info', 'annual_revenue');
  const monthlyTransactions = getQuestionValueKyb(questionnaires, 'financial_info', 'monthly_transactions');
  const shareCapital = getQuestionValueKyb(questionnaires, 'financial_info', 'share_capital');
  const employeeCount = getQuestionValueKyb(questionnaires, 'financial_info', 'employee_count');
  const entityType = getQuestionValueKyb(questionnaires, 'compliance', 'entity_type');
  const isVulnerableActivity = getQuestionValueKyb(questionnaires, 'compliance', 'is_vulnerable_activity');
  const vulnerableActivityType = getQuestionValueKyb(questionnaires, 'compliance', 'vulnerable_activity_type');
  const hasForeignOperations = getQuestionValueKyb(questionnaires, 'compliance', 'has_foreign_operations');
  const foreignCountries = getQuestionValueKyb(questionnaires, 'compliance', 'foreign_countries');
  const isUsPerson = getQuestionValueKyb(questionnaires, 'compliance', 'is_us_person');
  const listedCompany = getQuestionValueKyb(questionnaires, 'compliance', 'listed_company');
  const stockExchange = getQuestionValueKyb(questionnaires, 'compliance', 'stock_exchange');
  
  // Usuario Administrador
  const adminFirstName = getQuestionValueKyb(questionnaires, 'admin', 'admin_first_name');
  const adminPaternalSurname = getQuestionValueKyb(questionnaires, 'admin', 'admin_paternal_surname');
  const adminMaternalSurname = getQuestionValueKyb(questionnaires, 'admin', 'admin_maternal_surname');
  const adminEmail = getQuestionValueKyb(questionnaires, 'admin', 'admin_email');
  const adminPhone = getQuestionValueKyb(questionnaires, 'admin', 'admin_phone');
  
  // Dirección fiscal
  const address = addresses.length > 0 ? addresses[0] : {};
  const street = address.street || getQuestionValueKyb(questionnaires, 'company_address', 'street');
  const city = address.town || getQuestionValueKyb(questionnaires, 'company_address', 'city');
  const state = address.state || getQuestionValueKyb(questionnaires, 'company_address', 'state');
  const postalCode = address.postCode || getQuestionValueKyb(questionnaires, 'company_address', 'postal_code');
  const interiorNumber = getQuestionValueKyb(questionnaires, 'company_address', 'interior_number');
  const exteriorNumber = getQuestionValueKyb(questionnaires, 'company_address', 'exterior_number');
  const municipality = getQuestionValueKyb(questionnaires, 'company_address', 'municipality');
  const neighborhood = getQuestionValueKyb(questionnaires, 'company_address', 'neighborhood');
  
  // Calcular límites transaccionales (Tabla 5.2.1)
  const limits = calculateTransactionLimits(monthlyTransactions);
  
  // Construir array de Nombres (Rep Legal + Beneficiarios)
  const nombresArray = [];
  
  // 1. Representante Legal (siempre primero)
  if (repLegalKyc) {
    const repLegalContacto = mapContactoFromKyc(repLegalKyc, repLegalUbo, 'Representante Legal');
    nombresArray.push(repLegalContacto);
  }
  
  // 2. Beneficiarios/Accionistas
  if (beneficiariosKyc && Array.isArray(beneficiariosKyc)) {
    beneficiariosKyc.forEach(({ ubo, kyc }) => {
      if (kyc) {
        // Beneficiario con KYC completo
        const beneficiario = mapContactoFromKyc(kyc, ubo, 'Beneficiario');
        nombresArray.push(beneficiario);
      } else {
        // Beneficiario sin KYC (solo datos básicos)
        const beneficiarioBasico = mapContactoBasico(ubo);
        nombresArray.push(beneficiarioBasico);
      }
    });
  }
  
  // 3. Usuario Administrador
  if (adminFirstName || adminEmail) {
    nombresArray.push({
      paterno: adminPaternalSurname,
      materno: adminMaternalSurname,
      nombre: adminFirstName,
      correo_alterno: adminEmail,
      telefono_casa: adminPhone,
      tipo_contacto: 'Usuario Administrador',
      status: 'Activo'
    });
  }
  
  // Mapear documentos corporativos
  const documentos = mapDocumentosEmpresa(
    metadataResources,
    entityType,
    booleanToSN(isVulnerableActivity) === 'S',
    kybData.id,
    kybData.inspectionId
  );
  
  // Construir JSON final para Peibo
  const peiboPayload = {
    Clientes: {
      nombre: companyInfo.companyName || leadData.company_name || '',
      rfc: companyInfo.taxId || '',
      status: 'success'
    },
    GLOBAL_Asociados: {
      nivel_cuenta: 'N3',
      id_country: mapCountryToId(companyInfo.country || 'MEX'),
      id_timezone: 1,
      tipo_persona: 'PM_MEX',
      nombre_completo: companyInfo.companyName || leadData.company_name || '',
      desactivar_emails_comprobantes: 'N',
      quitar_control_IPs: 'N',
      delay_30_nuevos_guest: 'N',
      delay_30_transf_otros_bancos: '0',
      delay_30_transf_UnalanaPAY: '0',
      uso_estricto_gps: 'N',
      importe_max_evento: limits.evento.toFixed(2),
      importe_max_dia: limits.dia.toFixed(2),
      importe_max_mes: limits.mes.toFixed(2),
      tipo_cliente: 'Nuevo',
      monto_egreso_nuevo: '0.00',
      monto_egreso_acumulado: '0.00'
    },
    Cedula: {
      regimen_fiscal: taxRegime,
      fecha_constitucion: companyInfo.incorporationDate || '',
      pais_constitucion: incorporationCountry || 'MEX',
      giro: businessSector,
      actividad_economica: economicActivity,
      objeto_social: companyPurpose,
      ingresos_anuales: annualRevenue,
      transacciones_mensuales: monthlyTransactions,
      capital_social: shareCapital,
      numero_empleados: employeeCount,
      tipo_entidad: entityType,
      actividad_vulnerable: booleanToSN(isVulnerableActivity),
      tipo_actividad_vulnerable: booleanToSN(isVulnerableActivity) === 'S' ? vulnerableActivityType : '',
      operaciones_internacionales: booleanToSN(hasForeignOperations),
      paises_operacion: booleanToSN(hasForeignOperations) === 'S' ? foreignCountries : '',
      us_person: booleanToSN(isUsPerson),
      cotiza_bolsa: booleanToSN(listedCompany),
      bolsa_valores: booleanToSN(listedCompany) === 'S' ? stockExchange : ''
    },
    Nombres: nombresArray,
    Direcciones: [
      {
        id_pais: mapCountryToId(address.country || 'MEX'),
        calle: street || 'Desconocida',
        ciudad: city || municipality || 'Desconocida',
        estado: mapStateToId(state),
        cp: postalCode || '00000',
        noInterior: interiorNumber,
        noExterior: exteriorNumber || 'S/N',
        municipio: municipality || city || 'Desconocido',
        colonia: neighborhood || '',
        tipo_direccion: 'Fiscal',
        habilitado: 'S'
      }
    ],
    Documentos: documentos,
    CSF: [],
    CFDI: []
  };
  
  console.log('[KYB_FORMATTER] ✓ KYB transformation completed successfully');
  return peiboPayload;
};

module.exports = {
  formatKybDataToPeibo,
  identifyRepresentanteLegal,
  extractBeneficiarios,
  validateCritical,
  getQuestionValueKyb,
  mapDocumentosEmpresa,
  mapContactoFromKyc,
  mapContactoBasico
};


