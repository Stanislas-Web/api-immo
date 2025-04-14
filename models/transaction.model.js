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
 *               enum: [mobile_money, bank_transfer, cash, other]
 *               description: Méthode de paiement
 *             provider:
 *               type: string
 *               enum: [flexpay, other]
 *               description: Fournisseur de service de paiement
 *             reference:
 *               type: string
 *               description: Référence de la transaction
 *             status:
 *               type: string
 *               enum: [pending, completed, failed]
 *               default: 'pending'
 *               description: Statut de la transaction
 *             phone:
 *               type: string
 *               description: Numéro de téléphone pour le paiement mobile
 *             providerResponse:
 *               type: Object
 *               description: Réponse brute du fournisseur de paiement
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
 *           provider: "flexpay"
 *           reference: "OM123456789"
 *           status: "pending"
 *           phone: "+243123456789"
 *           providerResponse: {}
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
    enum: ['loyer', 'caution', 'frais_service', 'autre', 'facture'],
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
      enum: ['mobile_money', 'bank_transfer', 'cash', 'other'],
      required: true
    },
    provider: {
      type: String,
      enum: ['flexpay', 'other']
    },
    reference: { 
      type: String,
      maxlength: [50, "La référence de transaction ne peut pas dépasser 50 caractères"]
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    },
    phone: String,
    providerResponse: Object
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
// Index unique sur receiptNumber mais seulement pour les valeurs non-null
transactionSchema.index({ 'metadata.receiptNumber': 1 }, { unique: true, sparse: true });
transactionSchema.index({ createdAt: -1 });

// Index pour les requêtes courantes
transactionSchema.index({ 
  apartmentId: 1, 
  tenant: 1, 
  status: 1, 
  'period.from': 1, 
  'period.to': 1 
});

// Hook qui s'exécute après la sauvegarde d'une transaction
transactionSchema.post('save', async function(transaction) {
  try {
    // Ne mettre à jour l'historique que si la transaction devient "complete"
    if (transaction.status === 'complete' && transaction.type === 'loyer') {
      console.log(`Hook post-save: Transaction ${transaction._id} est maintenant complete, mise à jour du RentBook...`);
      
      // Importer les modèles nécessaires
      const RentBook = mongoose.model('RentBook');
      
      // Rechercher le RentBook correspondant à cette transaction
      let rentBook = await RentBook.findOne({
        apartmentId: transaction.apartmentId,
        tenantId: transaction.tenant,
        status: 'actif'
      });
      
      // Si pas trouvé, essayer avec seulement l'ID de l'appartement
      if (!rentBook) {
        rentBook = await RentBook.findOne({
          apartmentId: transaction.apartmentId,
          status: 'actif'
        });
      }
      
      // Si un RentBook est trouvé, mettre à jour son historique de paiements
      if (rentBook) {
        // Déterminer le statut du paiement
        let status = 'payé';
        const txStatus = transaction.paymentMethod?.providerResponse?.transaction?.status;
        
        if (txStatus === '1') {
          status = 'impayé';
        } else if (transaction.amount && transaction.amount.value < rentBook.monthlyRent) {
          status = 'partiel';
        }
        
        // Créer l'objet du nouveau paiement
        const receiptNumber = transaction.metadata?.receiptNumber || `TRANS-${transaction._id.toString().substr(-6)}`;
        const newPayment = {
          date: new Date(),
          amount: transaction.amount?.value || 0,
          paymentMethod: transaction.paymentMethod?.type || 'mobile_money',
          status: status,
          reference: receiptNumber,
          comment: `Paiement via ${transaction.paymentMethod?.type || 'mobile_money'} - Ajouté automatiquement #${receiptNumber}`
        };
        
        // S'assurer que paymentHistory existe
        if (!rentBook.paymentHistory) {
          rentBook.paymentHistory = [];
        }
        
        // Vérifier si un paiement avec cette référence existe déjà
        const paymentExists = rentBook.paymentHistory.some(
          payment => payment.reference === receiptNumber
        );
        
        // Ajouter le paiement uniquement s'il n'existe pas déjà
        if (!paymentExists) {
          rentBook.paymentHistory.push(newPayment);
          rentBook.markModified('paymentHistory');
          await rentBook.save();
          console.log(`Hook post-save: Paiement ajouté avec succès au RentBook ${rentBook._id}`);
        } else {
          console.log(`Hook post-save: Le paiement existe déjà dans l'historique du RentBook ${rentBook._id}`);
        }
      } else {
        console.log(`Hook post-save: Aucun RentBook trouvé pour la transaction ${transaction._id}`);
      }
    }
  } catch (error) {
    console.error('Erreur dans le hook post-save de Transaction:', error);
    // Ne pas faire échouer l'opération principale
  }
});

module.exports = mongoose.model('Transaction', transactionSchema);
