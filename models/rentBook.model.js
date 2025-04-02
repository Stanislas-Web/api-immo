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

// Middleware pre-save pour initialiser les champs d'historique
rentBookSchema.pre('save', function(next) {
    // S'assurer que paymentHistory est initialisé comme un tableau vide s'il est null ou undefined
    if (!this.paymentHistory) {
        this.paymentHistory = [];
        console.log(`Middleware pre-save: paymentHistory initialisé pour RentBook ${this._id}`);
    }
    next();
});

// Middleware post-find pour s'assurer que tous les documents ont un paymentHistory
rentBookSchema.post(['find', 'findOne', 'findById'], function(docs, next) {
    // Si c'est un tableau de documents (find)
    if (Array.isArray(docs)) {
        docs.forEach(doc => {
            if (doc && !doc.paymentHistory) {
                doc.paymentHistory = [];
                console.log(`Middleware post-find: paymentHistory initialisé pour RentBook ${doc._id}`);
            }
        });
    } 
    // Si c'est un seul document (findOne, findById)
    else if (docs && !docs.paymentHistory) {
        docs.paymentHistory = [];
        console.log(`Middleware post-findOne: paymentHistory initialisé pour RentBook ${docs._id}`);
    }
    next();
});

// Middleware pre-findOneAndUpdate pour garantir que paymentHistory est initialisé
rentBookSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function(next) {
    const update = this.getUpdate();
    
    // Si l'update tente de définir paymentHistory à null, le remplacer par un tableau vide
    if (update && update.$set && update.$set.paymentHistory === null) {
        update.$set.paymentHistory = [];
        console.log('Middleware pre-update: remplacement de null par un tableau vide pour paymentHistory');
    }
    
    next();
});

module.exports = mongoose.model('RentBook', rentBookSchema);
