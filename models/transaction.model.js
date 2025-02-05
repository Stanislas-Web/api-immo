const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * @swagger
 * components:
 *   schemas:
 *     Transaction:
 *       type: object
 *       required:
 *         - apartmentId
 *         - tenant
 *         - landlord
 *         - type
 *         - amount
 *         - paymentMethod
 *       properties:
 *         apartmentId:
 *           type: string
 *           format: uuid
 *           description: Référence à l'appartement concerné
 *         tenant:
 *           type: string
 *           format: uuid
 *           description: Référence au locataire qui effectue le paiement
 *         landlord:
 *           type: string
 *           format: uuid
 *           description: Référence au propriétaire de l'appartement
 *         type:
 *           type: string
 *           enum: [loyer, caution, frais_service, autre]
 *           description: Type de transaction
 *         amount:
 *           type: object
 *           required:
 *             - value
 *             - currency
 *           properties:
 *             value:
 *               type: number
 *               description: Montant de la transaction
 *             currency:
 *               type: string
 *               default: CDF
 *               description: Devise de la transaction
 *         paymentMethod:
 *           type: object
 *           required:
 *             - type
 *           properties:
 *             type:
 *               type: string
 *               enum: [mobile_money, carte_bancaire, especes, virement]
 *               description: Méthode de paiement utilisée
 *             provider:
 *               type: string
 *               description: Fournisseur de la méthode de paiement
 *             reference:
 *               type: string
 *               description: Numéro de référence de la transaction
 *         status:
 *           type: string
 *           enum: [en_attente, complete, echoue, rembourse]
 *           default: en_attente
 *           description: Statut actuel de la transaction
 *         dueDate:
 *           type: string
 *           format: date
 *           description: Date d'échéance de la transaction
 *         paymentDate:
 *           type: string
 *           format: date
 *           description: Date de paiement de la transaction
 *         period:
 *           type: object
 *           properties:
 *             from:
 *               type: string
 *               format: date
 *               description: Date de début de la période couverte
 *             to:
 *               type: string
 *               format: date
 *               description: Date de fin de la période couverte
 *         metadata:
 *           type: object
 *           properties:
 *             receiptNumber:
 *               type: string
 *               description: Numéro de reçu de la transaction
 *             notes:
 *               type: string
 *               description: Notes sur la transaction
 *         notifications:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [rappel, confirmation, echec]
 *                 description: Type de notification
 *               sentAt:
 *                 type: string
 *                 format: date-time
 *                 description: Date et heure d'envoi de la notification
 *               channel:
 *                 type: string
 *                 enum: [email, sms, whatsapp]
 *                 description: Canal de notification utilisé
 *               status:
 *                 type: string
 *                 enum: [envoyé, delivré, lu]
 *                 description: Statut de la notification
 *       example:
 *         apartmentId: "507f1f77bcf86cd799439011"
 *         tenant: "507f1f77bcf86cd799439012"
 *         landlord: "507f1f77bcf86cd799439013"
 *         type: "loyer"
 *         amount:
 *           value: 500
 *           currency: CDF
 *         paymentMethod:
 *           type: mobile_money
 *           provider: "Orange Money"
 *           reference: "OM123456789"
 *         status: "en_attente"
 *         dueDate: "2025-02-05"
 *         period:
 *           from: "2025-02-01"
 *           to: "2025-02-28"
 *         metadata:
 *           receiptNumber: "REC-2025020401"
 *           notes: "Paiement du loyer pour février 2025"
 */

const transactionSchema = new Schema({
  apartmentId: {
    type: Schema.Types.ObjectId,
    ref: 'Apartment',
    required: true
  },
  tenant: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  landlord: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['loyer', 'caution', 'frais_service', 'autre'],
    required: true
  },
  amount: {
    value: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'CDF'
    }
  },
  paymentMethod: {
    type: {
      type: String,
      enum: ['mobile_money', 'carte_bancaire', 'especes', 'virement'],
      required: true
    },
    provider: String,
    reference: String
  },
  status: {
    type: String,
    enum: ['en_attente', 'complete', 'echoue', 'rembourse'],
    default: 'en_attente'
  },
  dueDate: Date,
  paymentDate: Date,
  period: {
    from: Date,
    to: Date
  },
  metadata: {
    receiptNumber: String,
    notes: String
  },
  notifications: [{
    type: {
      type: String,
      enum: ['rappel', 'confirmation', 'echec']
    },
    sentAt: Date,
    channel: {
      type: String,
      enum: ['email', 'sms', 'whatsapp']
    },
    status: {
      type: String,
      enum: ['envoyé', 'delivré', 'lu']
    }
  }]
}, {
  timestamps: true,
  versionKey: false
});

// Index pour la recherche rapide
transactionSchema.index({ apartmentId: 1, tenant: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ dueDate: 1 });
transactionSchema.index({ 'metadata.receiptNumber': 1 }, { unique: true });
transactionSchema.index({ createdAt: -1 });

// Index pour les requêtes courantes
transactionSchema.index({ 
  apartmentId: 1, 
  tenant: 1, 
  status: 1, 
  'period.from': 1, 
  'period.to': 1 
});

module.exports = mongoose.model('Transaction', transactionSchema);
