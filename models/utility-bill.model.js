const { Schema, model } = require('mongoose');
const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     UtilityBill:
 *       type: object
 *       required:
 *         - buildingId
 *         - type
 *         - amount
 *         - billingDate
 *       properties:
 *         buildingId:
 *           type: string
 *           description: Référence à l'immeuble
 *         type:
 *           type: string
 *           enum: [eau, electricite]
 *           description: Type de facture (eau ou électricité)
 *         amount:
 *           type: object
 *           properties:
 *             value:
 *               type: number
 *               description: Montant total de la facture
 *             currency:
 *               type: string
 *               default: CDF
 *               description: Devise du montant
 *         billingDate:
 *           type: string
 *           format: date
 *           description: Date de facturation
 *         dueDate:
 *           type: string
 *           format: date
 *           description: Date d'échéance
 *         isPaid:
 *           type: boolean
 *           default: false
 *           description: Statut de paiement
 *         paidDate:
 *           type: string
 *           format: date
 *           description: Date de paiement
 *         distributionDetails:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               apartmentId:
 *                 type: string
 *                 description: Référence à l'appartement
 *               amount:
 *                 type: number
 *                 description: Montant à payer par cet appartement
 *               isPaid:
 *                 type: boolean
 *                 default: false
 *                 description: Statut de paiement pour cet appartement
 *       example:
 *         buildingId: "507f1f77bcf86cd799439011"
 *         type: "eau"
 *         amount:
 *           value: 1200
 *           currency: CDF
 *         billingDate: "2025-03-01"
 *         dueDate: "2025-03-15"
 *         isPaid: false
 */

const utilityBillSchema = new Schema({
  buildingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Building', required: true },
  type: { 
    type: String, 
    enum: ['eau', 'electricite'],
    required: true 
  },
  amount: { 
    value: { type: Number, required: true },
    currency: { type: String, default: 'CDF' }
  },
  billingDate: { type: Date, required: true },
  dueDate: { type: Date },
  isPaid: { type: Boolean, default: false },
  paidDate: { type: Date },
  distributionDetails: [{
    apartmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Apartment' },
    amount: { type: Number },
    isPaid: { type: Boolean, default: false }
  }]
}, {
  timestamps: true,
  versionKey: false
});

module.exports = model('UtilityBill', utilityBillSchema);
