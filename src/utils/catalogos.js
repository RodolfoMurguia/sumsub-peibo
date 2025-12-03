/**
 * Catálogos y Mapeos de Referencia
 * Para transformación de datos Sumsub a Peibo (KYB)
 */

// Tabla 6.1: Mapeo de Países a ID Peibo
const PAISES = {
  MEX: 1,
  USA: 2,
  CAN: 3,
  ARG: 4,
  BRA: 5,
  CHL: 6,
  COL: 7,
  CRI: 8,
  CUB: 9,
  ECU: 10,
  SLV: 11,
  GTM: 12,
  HND: 13,
  NIC: 14,
  PAN: 15,
  PRY: 16,
  PER: 17,
  URY: 18,
  VEN: 19,
  ESP: 20
};

// Tabla 6.2: Mapeo de Estados de México a ID Peibo
const ESTADOS_MEXICO = {
  AGS: 1,
  BC: 2,
  BCS: 3,
  CAMP: 4,
  COAH: 5,
  COL: 6,
  CHIS: 7,
  CHIH: 8,
  CDMX: 9,
  DGO: 10,
  GTO: 11,
  GRO: 12,
  HGO: 13,
  JAL: 14,
  MEX: 15,
  MICH: 16,
  MOR: 17,
  NAY: 18,
  NL: 19,
  OAX: 20,
  PUE: 21,
  QRO: 22,
  QROO: 23,
  SLP: 24,
  SIN: 25,
  SON: 26,
  TAB: 27,
  TAMPS: 28,
  TLAX: 29,
  VER: 30,
  YUC: 31,
  ZAC: 32
};

// Tabla 5.2.1: Límites Transaccionales según Monthly Transactions
const LIMITES_TRANSACCIONALES = {
  LESS_100K: {
    evento: 50000.00,
    dia: 100000.00,
    mes: 100000.00
  },
  '100K_500K': {
    evento: 250000.00,
    dia: 500000.00,
    mes: 500000.00
  },
  '500K_1M': {
    evento: 500000.00,
    dia: 1000000.00,
    mes: 1000000.00
  },
  '1M_5M': {
    evento: 2500000.00,
    dia: 5000000.00,
    mes: 5000000.00
  },
  '5M_10M': {
    evento: 5000000.00,
    dia: 10000000.00,
    mes: 10000000.00
  },
  MORE_10M: {
    evento: 10000000.00,
    dia: 20000000.00,
    mes: 20000000.00
  }
};

// Tabla 5.8.1: Tipos de Documento Empresa - Códigos Peibo
const DOCUMENTOS_EMPRESA = {
  // Documentos base para todas las PM
  COMPANY_DOC_ARTICLES: 1000,           // Acta Constitutiva
  COMPANY_DOC_TAX_ID: 1001,             // Constancia Situación Fiscal (CSF)
  DIRECTORS_ID: 1002,                    // Identificación del Representante Legal
  COMPANY_DOC_FIEL: 1008,               // FIEL (Certificado Digital SAT)
  POWER_OF_ATTORNEY: 1012,              // Poder Notarial del Rep. Legal
  PROOF_OF_RESIDENCE: 1053,             // Comprobante de Domicilio
  REGISTRATION_DOC: 1054,               // Registro Público de la Propiedad (RPP)
  SELFIE: 1006,                         // Selfie/Video KYC
  
  // Documentos específicos SOFOM (1704-1708)
  TECHNICAL_OPINION: 1704,              // Dictamen Técnico
  COMPLIANCE_MANUAL: 1705,              // Manual de Cumplimiento
  ODC_DESIGNATION: 1706,                // Designación del ODC
  SIPRES_REGISTRATION: 1707,            // Inscripción SIPRES
  CNBV_ACKNOWLEDGMENT: 1708,            // Acuse CNBV
  
  // Documentos específicos Sindicato (1709-1710)
  STATUTE: 1709,                        // Estatuto
  UNION_NOTE: 1710,                     // Toma de Nota
  
  // Documentos específicos Actividad Vulnerable (1711-1713)
  VULNERABLE_ACTIVITY_REGISTRATION: 1711, // Inscripción Actividad Vulnerable
  COMPLIANCE_OFFICER_APPOINTMENT: 1712,   // Nombramiento Oficial Cumplimiento
  VULNERABLE_ACTIVITY: 1713             // Constancia Actividad Vulnerable
};

// Mapeo de tipos de documento Sumsub a códigos Peibo
const SUMSUB_DOC_TO_PEIBO = {
  'COMPANY_DOC': {
    'articles': 1000,
    'tax_id': 1001,
    'csf': 1001,
    'fiel': 1008,
    'registration': 1054,
    'default': 1000
  },
  'DIRECTORS': {
    'id': 1002,
    'default': 1002
  },
  'POWER_OF_ATTORNEY': 1012,
  'PROOF_OF_RESIDENCE': 1053,
  'REGISTRATION_DOC': 1054,
  'SELFIE': 1006,
  'TECHNICAL_OPINION': 1704,
  'COMPLIANCE_MANUAL': 1705,
  'ODC_DESIGNATION': 1706,
  'SIPRES_REGISTRATION': 1707,
  'CNBV_ACKNOWLEDGMENT': 1708,
  'STATUTE': 1709,
  'UNION_NOTE': 1710,
  'VULNERABLE_ACTIVITY_REGISTRATION': 1711,
  'COMPLIANCE_OFFICER_APPOINTMENT': 1712,
  'VULNERABLE_ACTIVITY': 1713
};

// Tabla 5.4.1: Mapeo Tipo de Identificación Sumsub a Peibo
const TIPO_IDENTIFICACION = {
  ID_CARD: 'INE',
  IDCARD: 'INE',
  PASSPORT: 'Pasaporte',
  DRIVERS: 'Licencia',
  DRIVER_LICENSE: 'Licencia',
  OTHER: 'Otro'
};

// Tabla 5.4.2: Mapeo Estado de Validación
const VALIDATION_STATUS = {
  GREEN: {
    identidad: 'Validado',
    biometrica: 'Validado'
  },
  RED: {
    identidad: 'No Validado',
    biometrica: 'No Validado'
  },
  YELLOW: {
    identidad: 'Pendiente',
    biometrica: 'Pendiente'
  }
};

/**
 * Convierte código de país ISO a ID Peibo
 * @param {string} countryCode - Código ISO del país (ej: "MEX", "USA")
 * @returns {number} ID del país en Peibo
 */
const mapCountryToId = (countryCode) => {
  if (!countryCode) return 1; // Default: México
  const code = countryCode.toUpperCase();
  return PAISES[code] || 1;
};

/**
 * Convierte código de estado a número ID Peibo
 * @param {string} stateCode - Código del estado (ej: "CDMX", "NL")
 * @returns {number} ID del estado (1-32)
 */
const mapStateToId = (stateCode) => {
  if (!stateCode) return 9; // Default: CDMX
  const code = stateCode.toUpperCase();
  return ESTADOS_MEXICO[code] || 9;
};

/**
 * Convierte valor booleano a "S"/"N"
 * @param {boolean|string} value - Valor booleano o string
 * @returns {string} "S" o "N"
 */
const booleanToSN = (value) => {
  if (typeof value === 'boolean') {
    return value ? 'S' : 'N';
  }
  if (typeof value === 'string') {
    const v = value.toLowerCase();
    return (v === 'true' || v === 's' || v === 'yes' || v === '1') ? 'S' : 'N';
  }
  return 'N';
};

/**
 * Calcula límites transaccionales según el rango de monthly_transactions
 * @param {string} monthlyTransactions - Rango de transacciones mensuales
 * @returns {object} Objeto con evento, dia, mes
 */
const calculateTransactionLimits = (monthlyTransactions) => {
  if (!monthlyTransactions) {
    return LIMITES_TRANSACCIONALES.LESS_100K;
  }
  
  const range = monthlyTransactions.toUpperCase();
  return LIMITES_TRANSACCIONALES[range] || LIMITES_TRANSACCIONALES.LESS_100K;
};

/**
 * Mapea tipo de identificación de Sumsub a formato Peibo
 * @param {string} idDocType - Tipo de documento en Sumsub
 * @returns {string} Tipo de identificación en Peibo
 */
const mapTipoIdentificacion = (idDocType) => {
  if (!idDocType) return 'INE';
  const type = idDocType.toUpperCase();
  return TIPO_IDENTIFICACION[type] || 'Otro';
};

/**
 * Mapea estado de validación según reviewAnswer
 * @param {string} reviewAnswer - Respuesta de review (GREEN, RED, YELLOW)
 * @returns {object} Objeto con status_validacion_identidad y status_validacion_biometrica
 */
const mapValidationStatus = (reviewAnswer) => {
  if (!reviewAnswer) {
    return { identidad: 'Pendiente', biometrica: 'Pendiente' };
  }
  const answer = reviewAnswer.toUpperCase();
  return VALIDATION_STATUS[answer] || { identidad: 'Pendiente', biometrica: 'Pendiente' };
};

module.exports = {
  // Catálogos
  PAISES,
  ESTADOS_MEXICO,
  LIMITES_TRANSACCIONALES,
  DOCUMENTOS_EMPRESA,
  SUMSUB_DOC_TO_PEIBO,
  TIPO_IDENTIFICACION,
  VALIDATION_STATUS,
  
  // Funciones de mapeo
  mapCountryToId,
  mapStateToId,
  booleanToSN,
  calculateTransactionLimits,
  mapTipoIdentificacion,
  mapValidationStatus
};


