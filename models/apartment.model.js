const { Schema, model } = require('mongoose');
const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Apartment:
 *       type: object
 *       required:
 *         - buildingId
 *         - number
 *         - type
 *         - floor
 *         - surface
 *         - rooms
 *         - bathrooms
 *         - price
 *       properties:
 *         buildingId:
 *           type: string
 *           description: Référence à l'immeuble
 *         number:
 *           type: string
 *           description: Numéro de l'appartement
 *         type:
 *           type: string
 *           enum: [studio, f1, f2, f3, f4, f5, duplex, penthouse]
 *           description: Type d'appartement
 *         floor:
 *           type: number
 *           description: Étage de l'appartement
 *         surface:
 *           type: number
 *           description: Surface en mètres carrés
 *         rooms:
 *           type: number
 *           description: Nombre de pièces
 *         bathrooms:
 *           type: number
 *           description: Nombre de salles de bain
 *         price:
 *           type: object
 *           properties:
 *             amount:
 *               type: number
 *               description: Prix mensuel du loyer
 *             currency:
 *               type: string
 *               default: CDF
 *               description: Devise du prix
 *             paymentFrequency:
 *               type: string
 *               enum: [day, mensuel, trimestriel, semestriel, annuel]
 *               default: mensuel
 *               description: Fréquence de paiement
 *         description:
 *           type: string
 *           description: Description de l'appartement
 *         features:
 *           type: object
 *           properties:
 *             water:
 *               type: boolean
 *               default: false
 *               description: Eau courante
 *             electricity:
 *               type: boolean
 *               default: false
 *               description: Électricité
 *             gas:
 *               type: boolean
 *               default: false
 *               description: Gaz
 *             furnished:
 *               type: boolean
 *               default: false
 *               description: Appartement meublé
 *             airConditioning:
 *               type: boolean
 *               default: false
 *               description: Climatisation
 *             balcony:
 *               type: boolean
 *               default: false
 *               description: Balcon
 *             internet:
 *               type: boolean
 *               default: false
 *               description: Internet
 *             parking:
 *               type: boolean
 *               default: false
 *               description: Parking
 *             securitySystem:
 *               type: boolean
 *               default: false
 *               description: Système de sécurité
 *             elevator:
 *               type: boolean
 *               default: false
 *               description: Ascenseur
 *             garden:
 *               type: boolean
 *               default: false
 *               description: Jardin
 *             terrace:
 *               type: boolean
 *               default: false
 *               description: Terrasse
 *             fitted_kitchen:
 *               type: boolean
 *               default: false
 *               description: Cuisine équipée
 *             pool:
 *               type: boolean
 *               default: false
 *               description: Piscine
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           description: URLs des images de l'appartement
 *         status:
 *           type: string
 *           enum: [disponible, loué, en_rénovation, réservé]
 *           default: disponible
 *           description: État actuel de l'appartement
 *         currentTenant:
 *           type: string
 *           description: Référence au locataire actuel
 *         leaseHistory:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               tenant:
 *                 type: string
 *                 description: Référence au locataire
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Date de début de location
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: Date de fin de location
 *       example:
 *         buildingId: "507f1f77bcf86cd799439011"
 *         number: "A101"
 *         type: "f3"
 *         floor: 1
 *         surface: 75
 *         rooms: 3
 *         bathrooms: 2
 *         price:
 *           amount: 1200
 *           currency: CDF
 *           paymentFrequency: mensuel
 *         description: "Bel appartement F3 avec vue sur le jardin"
 *         features:
 *           water: true
 *           electricity: true
 *           gas: false
 *           furnished: true
 *           airConditioning: true
 *           balcony: true
 *           internet: true
 *           parking: true
 *           securitySystem: true
 *           elevator: false
 *           garden: true
 *           terrace: false
 *           fitted_kitchen: true
 *           pool: false
 *         images:
 *           - "https://example.com/image1.jpg"
 *           - "https://example.com/image2.jpg"
 *         status: "disponible"
 */

const apartmentSchema = new Schema({
  buildingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Building', required: true },
  number: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['studio', 'f1', 'f2', 'f3', 'f4', 'f5', 'duplex', 'penthouse'],
    required: true 
  },
  floor: { type: Number, required: true },
  surface: { type: Number, required: true }, 
  rooms: { type: Number, required: true },
  bathrooms: { type: Number, required: true },
  price: { 
    type: Object, 
    required: true,
    properties: {
      amount: { type: Number, required: true },
      currency: { type: String, default: 'CDF' },
      paymentFrequency: { 
        type: String, 
        enum: ['day', 'mensuel', 'trimestriel', 'semestriel', 'annuel'],
        default: 'mensuel'
      }
    }
  },
  description: { type: String },
  features: {
    type: Object,
    properties: {
      water: { type: Boolean, default: false },
      electricity: { type: Boolean, default: false },
      gas: { type: Boolean, default: false },
      furnished: { type: Boolean, default: false },
      airConditioning: { type: Boolean, default: false },
      balcony: { type: Boolean, default: false },
      internet: { type: Boolean, default: false },
      parking: { type: Boolean, default: false },
      securitySystem: { type: Boolean, default: false },
      elevator: { type: Boolean, default: false },
      garden: { type: Boolean, default: false },
      terrace: { type: Boolean, default: false },
      fitted_kitchen: { type: Boolean, default: false },
      pool: { type: Boolean, default: false }
    }
  },
  images: [{ type: String }],
  status: {
    type: String,
    enum: ['disponible', 'loué', 'en_rénovation', 'réservé'],
    default: 'disponible'
  },
  currentTenant: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  leaseHistory: [{
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    startDate: { type: Date },
    endDate: { type: Date }
  }]
}, {
  timestamps: true,
  versionKey: false
});

// Index pour la recherche
apartmentSchema.index({ 
  'type': 1, 
  'surface': 1, 
  'price.amount': 1,
  'status': 1 
});

module.exports = model('Apartment', apartmentSchema);
