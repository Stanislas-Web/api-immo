const { Schema, model } = require('mongoose');
const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Tax:
 *       type: object
 *       required:
 *         - apartmentId
 *         - amount
 *         - status
 *       properties:
 *         apartmentId:
 *           type: string
 *           description: Référence à l'appartement
 *         amount:
 *           type: object
 *           required: true
 *           properties:
 *             value:
 *               type: number
 *               description: Montant de la taxe
 *             currency:
 *               type: string
 *               default: CDF
 *               description: Devise de la taxe
 *         dueDate:
 *           type: date
 *           description: Date d'échéance de la taxe
 *         status:
 *           type: string
 *           enum: [pending, paid, overdue]
 *           default: pending
 *           description: Statut du paiement de la taxe
 *         paymentDate:
 *           type: date
 *           description: Date de paiement de la taxe
 *         description:
 *           type: string
 *           description: Description ou motif de la taxe
 */

const taxSchema = new Schema({
    apartmentId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Apartment', 
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
    dueDate: { 
        type: Date 
    },
    status: { 
        type: String,
        enum: ['pending', 'paid', 'overdue'],
        default: 'pending'
    },
    paymentDate: { 
        type: Date 
    },
    description: { 
        type: String 
    }
}, {
    timestamps: true
});

// Index pour améliorer les performances des requêtes
taxSchema.index({ apartmentId: 1, status: 1 });
taxSchema.index({ dueDate: 1 });

module.exports = model('Tax', taxSchema);
