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
  console.log('[KYB_FORMATTER] Beneficiaries count:', beneficiaries?.length || 0);
  
  if (!beneficiaries || !Array.isArray(beneficiaries)) {
    console.warn('[KYB_FORMATTER] No beneficiaries array provided');
    return null;
  }
  
  // Log all beneficiaries for debugging
  beneficiaries.forEach((ubo, i) => {
    const info = ubo.beneficiaryInfo || {};
    console.log(`[KYB_FORMATTER] Beneficiary ${i + 1}: ${info.firstName || ubo.firstName} ${info.lastName || ubo.lastName}, types: ${JSON.stringify(ubo.types)}, applicantId: ${ubo.applicantId}`);
  });
  
  const repLegal = beneficiaries.find(ubo => 
    ubo.types && Array.isArray(ubo.types) && ubo.types.includes('authorizedSignatory')
  );
  
  if (repLegal) {
    const info = repLegal.beneficiaryInfo || {};
    console.log(`[KYB_FORMATTER] ✓ Representante Legal found: ${info.firstName || repLegal.firstName} ${info.lastName || repLegal.lastName}, applicantId: ${repLegal.applicantId}`);
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
      const shareValue = ubo.shareSize || ubo.beneficiaryInfo?.shareSize || 0;
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
  }
  
  console.log('[KYB_FORMATTER] ✓ All critical validations passed');
};

/**
 * Mapea un contacto individual (Rep Legal o Beneficiario) desde su KYC
 * @param {object} kycData - Datos del KYC individual
 * @param {object} uboData - Datos del UBO desde el array de beneficiaries
 * @param {string} tipoContacto - "Representante Legal" o "Beneficiario"
 * @returns {object} Objeto Nombre para Peibo
 */
const mapContactoFromKyc = (kycData, uboData, tipoContacto) => {
  const info = kycData.info || {};
  const fixedInfo = kycData.fixedInfo || {};
  const questionnaires = kycData.questionnaires || [];
  const idDocs = kycData.idDocs || [];
  const review = kycData.review || {};
  
  // Extraer datos del cuestionario KYC individual (secciones de persona física)
  const rfc = getQuestionValueKyb(questionnaires, 'informacionPersonal', 'rfc');
  const curp = getQuestionValueKyb(questionnaires, 'informacionPersonal', 'curp');
  const ocupacion = getQuestionValueKyb(questionnaires, 'newSection5', 'newQuestion51');
  const giro = getQuestionValueKyb(questionnaires, 'newSection5', 'sectorIndustria');
  const ingresoMensual = getQuestionValueKyb(questionnaires, 'newSection5', 'ingresoMensualMxn');
  const actividadEconomica = getQuestionValueKyb(questionnaires, 'newSection5', 'sectorIndustria');
  const isPep = getQuestionValueKyb(questionnaires, 'newSection5', 'esPep');
  const cargoPep = getQuestionValueKyb(questionnaires, 'newSection5', 'cargoPep');
  
  // Validación de estados
  const reviewAnswer = review.reviewResult?.reviewAnswer || 'YELLOW';
  const validationStatus = mapValidationStatus(reviewAnswer);
  
  // Tipo de identificación
  const tipoId = idDocs.length > 0 ? mapTipoIdentificacion(idDocs[0].idDocType) : 'INE';
  const numeroId = idDocs.length > 0 ? (idDocs[0].number || '') : '';
  
  // Extraer shareSize de UBO
  const shareSize = uboData?.shareSize || uboData?.beneficiaryInfo?.shareSize || 0;
  
  const contacto = {
    paterno: info.lastName || fixedInfo.lastName || '',
    materno: info.middleName || fixedInfo.middleName || '',
    nombre: info.firstName || fixedInfo.firstName || '',
    sexo: info.gender === 'M' ? 'M' : (info.gender === 'F' ? 'F' : ''),
    id_pais_nacionalidad: mapCountryToId(info.nationality || fixedInfo.nationality),
    fecha_nacimiento: info.dob || fixedInfo.dob || '',
    id_pais_nacimiento: mapCountryToId(info.placeOfBirth || info.nationality),
    rfc: rfc,
    curp: curp,
    ocupacion: ocupacion,
    giro: giro,
    ingreso_mensual: ingresoMensual,
    actividad_economica: actividadEconomica,
    tipo_contacto: tipoContacto,
    es_pep: booleanToSN(isPep),
    cargo_pep: isPep === 'true' || isPep === 'S' || isPep === true ? cargoPep : '',
    correo_alterno: info.email || kycData.email || '',
    telefono_casa: info.phone || kycData.phone || '',
    tipo_identificacion: tipoId,
    identificacion: numeroId,
    status: 'Activo',
    status_validacion_identidad: validationStatus.identidad,
    status_validacion_biometrica: validationStatus.biometrica
  };
  
  // Si es beneficiario (UBO), agregar porcentaje accionario
  if (tipoContacto === 'Beneficiario' && shareSize > 0) {
    contacto.porcentaje_accionario = shareSize;
  }
  
  return contacto;
};

/**
 * Mapea un beneficiario sin KYC (solo datos básicos del UBO)
 * @param {object} uboData - Datos básicos del UBO (estructura de beneficiaries de Sumsub)
 * @returns {object} Objeto Nombre básico para Peibo
 */
const mapContactoBasico = (uboData) => {
  // Extraer datos de beneficiaryInfo si existe
  const beneficiaryInfo = uboData.beneficiaryInfo || {};
  
  // Determinar tipo de contacto según types
  const isAuthorizedSignatory = uboData.types?.includes('authorizedSignatory');
  const isUbo = uboData.types?.includes('ubo');
  const tipoContacto = isAuthorizedSignatory ? 'Representante Legal' : 'Beneficiario';
  
  // Extraer porcentaje de shareSize
  const shareSize = uboData.shareSize || beneficiaryInfo.shareSize || 0;
  
  return {
    paterno: beneficiaryInfo.lastName || uboData.lastName || '',
    materno: beneficiaryInfo.middleName || '',
    nombre: beneficiaryInfo.firstName || uboData.firstName || '',
    sexo: '',
    id_pais_nacionalidad: null,
    fecha_nacimiento: beneficiaryInfo.dob || uboData.dob || '',
    id_pais_nacimiento: null,
    rfc: '',
    curp: '',
    correo_alterno: beneficiaryInfo.email || uboData.email || '',
    telefono_casa: beneficiaryInfo.phone || uboData.phone || '',
    tipo_contacto: tipoContacto,
    porcentaje_accionario: isUbo ? shareSize : undefined,
    es_pep: booleanToSN(uboData.isPep || beneficiaryInfo.isPep),
    cargo_pep: '',
    status: 'Activo'
  };
};

/**
 * Mapea documentos corporativos desde metadataResources
 * @param {Array} metadataResources - Recursos de documentos
 * @param {string} entityType - Tipo de entidad
 * @param {boolean} isVulnerableActivity - Si tiene actividad vulnerable
 * @param {string} applicantId - ID del applicant
 * @param {string} inspectionId - ID de la inspección
 * @returns {Array} Array de documentos para Peibo
 */
const mapDocumentosEmpresa = (metadataResources, entityType, isVulnerableActivity, applicantId, inspectionId) => {
  console.log('[KYB_FORMATTER] Mapping company documents...');
  console.log('[KYB_FORMATTER] metadataResources type:', typeof metadataResources, 'isArray:', Array.isArray(metadataResources));
  console.log('[KYB_FORMATTER] metadataResources length:', metadataResources?.length || 0);
  
  const documentosPeibo = [];
  
  if (!metadataResources || !Array.isArray(metadataResources)) {
    console.warn('[KYB_FORMATTER] No metadata resources provided or not an array');
    return documentosPeibo;
  }
  
  for (const resource of metadataResources) {
    const idDocType = resource.idDocDef?.idDocType || resource.idDocType || resource.type;
    const idDocSubType = resource.idDocDef?.idDocSubType || resource.idDocSubType;
    const imageId = resource.id || resource.imageId;
    
    console.log(`[KYB_FORMATTER] Processing: idDocType=${idDocType}, imageId=${imageId}`);
    
    if (!imageId) {
      console.warn('[KYB_FORMATTER] Resource without ID, skipping');
      continue;
    }
    
    let codigoPeibo = null;
    let descripcion = '';
    
    // Mapeo basado en tipo de documento
    if (idDocType === 'COMPANY_DOC') {
      if (idDocSubType?.toLowerCase().includes('article') || idDocSubType?.toLowerCase().includes('incorporation')) {
        codigoPeibo = DOCUMENTOS_EMPRESA.COMPANY_DOC_ARTICLES;
        descripcion = 'Acta Constitutiva';
      } else if (idDocSubType?.toLowerCase().includes('tax') || idDocSubType?.toLowerCase().includes('csf')) {
        codigoPeibo = DOCUMENTOS_EMPRESA.COMPANY_DOC_TAX_ID;
        descripcion = 'Constancia Situación Fiscal';
      } else {
        codigoPeibo = DOCUMENTOS_EMPRESA.COMPANY_DOC_ARTICLES;
        descripcion = 'Documento Empresa';
      }
    } else if (idDocType === 'DIRECTORS' || idDocType === 'DIRECTOR') {
      codigoPeibo = DOCUMENTOS_EMPRESA.DIRECTORS_ID;
      descripcion = 'Identificación Representante Legal';
    } else if (idDocType === 'POWER_OF_ATTORNEY') {
      codigoPeibo = DOCUMENTOS_EMPRESA.POWER_OF_ATTORNEY;
      descripcion = 'Poder Notarial';
    } else if (idDocType === 'PROOF_OF_RESIDENCE' || idDocType === 'UTILITY_BILL') {
      codigoPeibo = DOCUMENTOS_EMPRESA.PROOF_OF_RESIDENCE;
      descripcion = 'Comprobante de Domicilio';
    } else if (idDocType === 'SELFIE') {
      codigoPeibo = DOCUMENTOS_EMPRESA.SELFIE;
      descripcion = 'Selfie/Video KYC';
    }
    
    if (codigoPeibo) {
      const fileName = resource.fileMetadata?.fileName || `document_${imageId}.pdf`;
      const fileSize = resource.fileMetadata?.fileSize || 0;
      const fileType = resource.fileMetadata?.fileType || 'pdf';
      
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
        application: `application/${fileType}`,
        status: 'P'
      });
      
      console.log(`[KYB_FORMATTER] ✓ Mapped: ${idDocType} → ${codigoPeibo}`);
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
  const companyInfo = kybData.fixedInfo?.companyInfo || kybData.info?.companyInfo || {};
  const questionnaires = kybData.questionnaires || [];
  const beneficiaries = kybData.fixedInfo?.companyInfo?.beneficiaries || [];
  
  console.log('[KYB_FORMATTER] Questionnaires count:', questionnaires.length);
  console.log('[KYB_FORMATTER] Beneficiaries count:', beneficiaries.length);
  
  // Identificar Representante Legal
  const repLegalUbo = identifyRepresentanteLegal(beneficiaries);
  
  // Validaciones críticas
  validateCritical({
    representanteLegal: repLegalKyc,
    beneficiarios: beneficiaries
  });
  
  // ============================================================
  // Extraer datos del cuestionario KYB (nombres REALES de secciones Sumsub)
  // ============================================================
  
  // Sección: basicInformation
  const legalName = getQuestionValueKyb(questionnaires, 'basicInformation', 'legal_name');
  const companyRfc = getQuestionValueKyb(questionnaires, 'basicInformation', 'rfc');
  const taxRegime = getQuestionValueKyb(questionnaires, 'basicInformation', 'tax_regime');
  const incorporationDate = getQuestionValueKyb(questionnaires, 'basicInformation', 'incorporation_date');
  const incorporationCountry = getQuestionValueKyb(questionnaires, 'basicInformation', 'incorporation_country');
  
  console.log('[KYB_FORMATTER] basicInformation:', { legalName, companyRfc, taxRegime });
  
  // Sección: economicalActivity
  const businessSector = getQuestionValueKyb(questionnaires, 'economicalActivity', 'business_sector');
  const economicActivity = getQuestionValueKyb(questionnaires, 'economicalActivity', 'economic_activity');
  const companyPurpose = getQuestionValueKyb(questionnaires, 'economicalActivity', 'company_purpose');
  
  console.log('[KYB_FORMATTER] economicalActivity:', { businessSector, economicActivity });
  
  // Sección: financialInformation
  const annualRevenue = getQuestionValueKyb(questionnaires, 'financialInformation', 'annual_revenue');
  const monthlyTransactions = getQuestionValueKyb(questionnaires, 'financialInformation', 'monthly_transactions');
  const shareCapital = getQuestionValueKyb(questionnaires, 'financialInformation', 'share_capital');
  const employeeCount = getQuestionValueKyb(questionnaires, 'financialInformation', 'employee_count');
  
  console.log('[KYB_FORMATTER] financialInformation:', { annualRevenue, monthlyTransactions });
  
  // Sección: regulationCompliance
  const entityType = getQuestionValueKyb(questionnaires, 'regulationCompliance', 'entity_type');
  const isVulnerableActivity = getQuestionValueKyb(questionnaires, 'regulationCompliance', 'is_vulnerable_activity');
  const vulnerableActivityType = getQuestionValueKyb(questionnaires, 'regulationCompliance', 'vulnerable_activity_type');
  const hasForeignOperations = getQuestionValueKyb(questionnaires, 'regulationCompliance', 'has_foreign_operations');
  const foreignCountries = getQuestionValueKyb(questionnaires, 'regulationCompliance', 'foreign_countries');
  const isUsPerson = getQuestionValueKyb(questionnaires, 'regulationCompliance', 'is_us_person');
  const listedCompany = getQuestionValueKyb(questionnaires, 'regulationCompliance', 'listed_company');
  const stockExchange = getQuestionValueKyb(questionnaires, 'regulationCompliance', 'stock_exchange');
  
  console.log('[KYB_FORMATTER] regulationCompliance:', { entityType, isVulnerableActivity });
  
  // Sección: userManagement (Usuario Administrador)
  const adminFirstName = getQuestionValueKyb(questionnaires, 'userManagement', 'admin_first_name');
  const adminPaternalSurname = getQuestionValueKyb(questionnaires, 'userManagement', 'admin_paternal_surname');
  const adminMaternalSurname = getQuestionValueKyb(questionnaires, 'userManagement', 'admin_maternal_surname');
  const adminEmail = getQuestionValueKyb(questionnaires, 'userManagement', 'admin_email');
  const adminPhone = getQuestionValueKyb(questionnaires, 'userManagement', 'admin_phone');
  const adminRole = getQuestionValueKyb(questionnaires, 'userManagement', 'admin_role');
  
  console.log('[KYB_FORMATTER] userManagement:', { adminFirstName, adminEmail, adminRole });
  
  // Sección: companyTaxAddress (Dirección Fiscal)
  const street = getQuestionValueKyb(questionnaires, 'companyTaxAddress', 'street');
  const city = getQuestionValueKyb(questionnaires, 'companyTaxAddress', 'city');
  const state = getQuestionValueKyb(questionnaires, 'companyTaxAddress', 'state');
  const postalCode = getQuestionValueKyb(questionnaires, 'companyTaxAddress', 'postal_code');
  const interiorNumber = getQuestionValueKyb(questionnaires, 'companyTaxAddress', 'interior_number');
  const exteriorNumber = getQuestionValueKyb(questionnaires, 'companyTaxAddress', 'exterior_number');
  const municipality = getQuestionValueKyb(questionnaires, 'companyTaxAddress', 'municipality');
  const neighborhood = getQuestionValueKyb(questionnaires, 'companyTaxAddress', 'neighborhood');
  const addressCountry = getQuestionValueKyb(questionnaires, 'companyTaxAddress', 'country');
  
  console.log('[KYB_FORMATTER] companyTaxAddress:', { street, city, state, postalCode });
  
  // Calcular límites transaccionales
  const limits = calculateTransactionLimits(monthlyTransactions);
  
  // Construir array de Nombres (Rep Legal + Beneficiarios + Admin)
  const nombresArray = [];
  
  // 1. Representante Legal
  if (repLegalKyc) {
    console.log('[KYB_FORMATTER] Mapping Representante Legal...');
    const repLegalContacto = mapContactoFromKyc(repLegalKyc, repLegalUbo, 'Representante Legal');
    nombresArray.push(repLegalContacto);
    console.log('[KYB_FORMATTER] ✓ Added Representante Legal:', repLegalContacto.nombre);
  }
  
  // 2. Beneficiarios/Accionistas (UBOs)
  if (beneficiariosKyc && Array.isArray(beneficiariosKyc)) {
    console.log(`[KYB_FORMATTER] Processing ${beneficiariosKyc.length} beneficiarios...`);
    beneficiariosKyc.forEach(({ ubo, kyc }, index) => {
      if (kyc) {
        const beneficiario = mapContactoFromKyc(kyc, ubo, 'Beneficiario');
        nombresArray.push(beneficiario);
        console.log(`[KYB_FORMATTER] ✓ Added beneficiario with KYC: ${beneficiario.nombre}`);
      } else if (ubo) {
        const beneficiarioBasico = mapContactoBasico(ubo);
        nombresArray.push(beneficiarioBasico);
        console.log(`[KYB_FORMATTER] ✓ Added beneficiario without KYC: ${beneficiarioBasico.nombre}`);
      }
    });
  }
  
  // 3. Usuario Administrador
  if (adminFirstName || adminEmail) {
    const adminContacto = {
      paterno: adminPaternalSurname || '',
      materno: adminMaternalSurname || '',
      nombre: adminFirstName || '',
      correo_alterno: adminEmail || '',
      telefono_casa: adminPhone || '',
      tipo_contacto: 'Usuario Administrador',
      status: 'Activo'
    };
    nombresArray.push(adminContacto);
    console.log('[KYB_FORMATTER] ✓ Added Usuario Administrador:', adminContacto.nombre);
  }
  
  console.log(`[KYB_FORMATTER] Total nombres: ${nombresArray.length}`);
  
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
      nombre: legalName || companyInfo.companyName || leadData.company_name || '',
      rfc: companyRfc || companyInfo.taxId || '',
      status: 'success'
    },
    GLOBAL_Asociados: {
      nivel_cuenta: 'N3',
      id_country: mapCountryToId(addressCountry || incorporationCountry || 'MEX'),
      id_timezone: 1,
      tipo_persona: 'PM_MEX',
      nombre_completo: legalName || companyInfo.companyName || leadData.company_name || '',
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
      fecha_constitucion: incorporationDate || companyInfo.incorporationDate || '',
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
    Direcciones: [{
      id_pais: mapCountryToId(addressCountry || 'MEX'),
      calle: street || 'Desconocida',
      ciudad: city || municipality || 'Desconocida',
      estado: mapStateToId(state),
      cp: postalCode || '00000',
      noInterior: interiorNumber || '',
      noExterior: exteriorNumber || 'S/N',
      municipio: municipality || city || 'Desconocido',
      colonia: neighborhood || '',
      tipo_direccion: 'Fiscal',
      habilitado: 'S'
    }],
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
