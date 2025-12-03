/**
 * Peibo Onboarding Model
 * Modelo para almacenar los payloads enviados a Peibo
 */

const mongoose = require('mongoose');

const peiboOnboardingSchema = new mongoose.Schema({
  external_user_id: {
    type: String,
    required: true,
    index: true
  },
  applicant_id: {
    type: String,
    required: true,
    index: true
  },
  lead_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: true
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  sent_at: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['PENDING', 'SENT', 'FAILED'],
    default: 'PENDING'
  },
  peibo_response: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  error_details: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  collection: 'peibo_onboardings'
});

// Índice compuesto para búsquedas eficientes
peiboOnboardingSchema.index({ external_user_id: 1, applicant_id: 1 });
peiboOnboardingSchema.index({ createdAt: -1 });

const PeiboOnboarding = mongoose.model('PeiboOnboarding', peiboOnboardingSchema);

module.exports = PeiboOnboarding;




