const { Schema, model } = require('mongoose');
const mongoose = require('mongoose');

const listingSchema = new Schema({
  apartmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Apartment', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  publisher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  price: {
    amount: { type: Number, required: true },
    currency: { type: String, default: 'CDF' },
    negotiable: { type: Boolean, default: false }
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'closed'],
    default: 'active'
  },
  features: [{
    type: String
  }],
  images: [{
    url: { type: String },
    isPrimary: { type: Boolean, default: false }
  }],
  views: { type: Number, default: 0 },
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  availability: {
    immediateMove: { type: Boolean, default: true },
    availableFrom: { type: Date }
  },
  requirements: {
    minimumStay: { type: Number }, // en mois
    deposit: { type: Number },
    documents: [{ type: String }]
  },
  contactPreferences: {
    phone: { type: Boolean, default: true },
    whatsapp: { type: Boolean, default: true },
    email: { type: Boolean, default: true }
  }
}, {
  timestamps: true,
  versionKey: false
});

// Index pour la recherche
listingSchema.index({
  title: 'text',
  description: 'text',
  'price.amount': 1,
  status: 1
});

module.exports = model('Listing', listingSchema);
