/**
 * Lead Model
 * Modelo de datos para Leads usando Mongoose
 */

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const eventHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  details: {
    type: String,
    required: false,
  },
}, { _id: false });

const leadSchema = new mongoose.Schema({
  first_name: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
  },
  last_name: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
  },
  phone: {
    type: String,
    required: [true, 'Phone is required'],
    trim: true,
  },
  lead_type: {
    type: String,
    enum: ['individual', 'company'],
    default: 'individual',
  },
  company_name: {
    type: String,
    required: false,
    trim: true,
  },
  applicant_id: {
    type: String,
    required: false,
    trim: true,
  },
  external_user_id: {
    type: String,
    default: () => uuidv4(),
    unique: true,
    required: true,
    index: true,
  },
  status: {
    type: String,
    default: 'CREATED',
    required: true,
  },
  // Nuevos campos para resultado de KYC
  kyc_result: {
    type: String,
    enum: ['GREEN', 'RED', null],
    default: null,
  },
  rejection_details: {
    type: mongoose.Schema.Types.Mixed, // Puede ser string u objeto
    default: null,
  },
  event_history: {
    type: [eventHistorySchema],
    default: [],
  },
  created_at: {
    type: Date,
    default: Date.now,
    required: true,
  },
  updated_at: {
    type: Date,
    default: Date.now,
    required: true,
  },
}, {
  timestamps: false, 
  collection: 'leads',
});

// Índice compuesto para validación de duplicados
leadSchema.index({ email: 1, phone: 1 }, { unique: false });

// Middleware pre-save
leadSchema.pre('save', function(next) {
  this.updated_at = new Date();
  if (this.isNew) {
    this.created_at = new Date();
    
    if (this.event_history.length === 0) {
      this.event_history.push({
        status: this.status,
        timestamp: new Date(),
        details: 'Lead created locally',
      });
    }
  } else if (this.isModified('status')) {
    this.event_history.push({
      status: this.status,
      timestamp: new Date(),
      details: `Status changed to ${this.status}`,
    });
  }
  next();
});

// Método para verificar duplicados
leadSchema.statics.findDuplicate = async function(email, phone) {
  return await this.findOne({
    email: email.toLowerCase().trim(),
    phone: phone.trim(),
  });
};

const Lead = mongoose.model('Lead', leadSchema);

module.exports = Lead;
