const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * @swagger
 * components:
 *   schemas:
 *     RentBook:
 *       type: object
 *       required:
 *         - apartmentId
 *         - tenantId
 *         - ownerId
 *       properties:
 *         apartmentId:
 *           type: string
 *           description: ID de l'appartement concerné
 *         tenantId:
 *           type: string
 *           description: ID du locataire
 *         ownerId:
 *           type: string
 *           description: ID du propriétaire
 *         leaseStartDate:
 *           type: string
 *           format: date
 *           description: Date de début du bail
 *         leaseEndDate:
 *           type: string
 *           format: date
 *           description: Date de fin du bail
 *         monthlyRent:
 *           type: number
 *           description: Montant du loyer mensuel
 *         securityDeposit:
 *           type: number
 *           description: Montant de la caution
 *         paymentHistory:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Date du paiement
 *               amount:
 *                 type: number
 *                 description: Montant payé
 *               paymentMethod:
 *                 type: string
 *                 enum: [espèces, virement, chèque, mobile_money]
 *                 description: Méthode de paiement
 *               status:
 *                 type: string
 *                 enum: [payé, partiel, retard, impayé]
 *                 description: Statut du paiement
 *               reference:
 *                 type: string
 *                 description: Référence du paiement
 *               comment:
 *                 type: string
 *                 description: Commentaire sur le paiement
 *         status:
 *           type: string
 *           enum: [actif, terminé, résilié]
 *           default: actif
 *           description: Statut du contrat de location
 *       example:
 *         apartmentId: "60d21b4667d0d8992e610c85"
 *         tenantId: "60d21b4667d0d8992e610c86"
 *         ownerId: "60d21b4667d0d8992e610c87"
 *         leaseStartDate: "2023-01-01"
 *         leaseEndDate: "2024-01-01"
 *         monthlyRent: 500
 *         securityDeposit: 1000
 *         status: "actif"
 */

const rentBookSchema = new Schema({
    apartmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Apartment',
        required: [true, "L'ID de l'appartement est requis"]
    },
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "L'ID du locataire est requis"]
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "L'ID du propriétaire est requis"]
    },
    leaseStartDate: {
        type: Date,
        required: [true, "La date de début du bail est requise"]
    },
    leaseEndDate: {
        type: Date,
        required: false
    },
    monthlyRent: {
        type: Number,
        required: [true, "Le montant du loyer mensuel est requis"],
        min: [0, "Le loyer ne peut pas être négatif"]
    },
    securityDeposit: {
        type: Number,
        default: 0
    },
    paymentHistory: [{
        date: {
            type: Date,
            default: Date.now
        },
        amount: {
            type: Number,
            required: [true, "Le montant du paiement est requis"]
        },
        paymentMethod: {
            type: String,
            enum: ['espèces', 'virement', 'chèque', 'mobile_money'],
            default: 'espèces'
        },
        status: {
            type: String,
            enum: ['payé', 'partiel', 'retard', 'impayé','pending'],
            default: 'pending'
        },
        reference: {
            type: String,
        },
        comment: String
    }],
    status: {
        type: String,
        enum: ['actif', 'terminé', 'résilié'],
        default: 'actif'
    }
}, {
    timestamps: true,
    versionKey: false
});

// Index pour la recherche rapide
rentBookSchema.index({ apartmentId: 1 });
rentBookSchema.index({ tenantId: 1 });
rentBookSchema.index({ ownerId: 1 });
rentBookSchema.index({ status: 1 });

module.exports = mongoose.model('RentBook', rentBookSchema);
