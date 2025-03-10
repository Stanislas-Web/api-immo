const { Schema, model } = require('mongoose');
const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Maintenance:
 *       type: object
 *       required:
 *         - apartmentId
 *         - title
 *         - description
 *         - date
 *       properties:
 *         apartmentId:
 *           type: string
 *           description: Référence à l'appartement
 *         title:
 *           type: string
 *           description: Titre de la maintenance
 *         description:
 *           type: string
 *           description: Description détaillée de la maintenance
 *         date:
 *           type: string
 *           format: date
 *           description: Date de la maintenance
 *         cost:
 *           type: object
 *           properties:
 *             amount:
 *               type: number
 *               description: Coût de la maintenance
 *             currency:
 *               type: string
 *               default: CDF
 *               description: Devise du coût
 *         status:
 *           type: string
 *           enum: [planifié, en_cours, terminé, annulé]
 *           default: planifié
 *           description: État de la maintenance
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           description: URLs des images de la maintenance
 *         notes:
 *           type: string
 *           description: Notes supplémentaires
 *       example:
 *         apartmentId: "507f1f77bcf86cd799439011"
 *         title: "Réparation plomberie"
 *         description: "Réparation fuite dans la salle de bain"
 *         date: "2025-03-15"
 *         cost:
 *           amount: 150
 *           currency: CDF
 *         status: "planifié"
 *         images: []
 *         notes: "Intervention urgente requise"
 */

const maintenanceSchema = new Schema({
  apartmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Apartment', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  cost: {
    amount: { type: Number },
    currency: { type: String, default: 'CDF' }
  },
  status: {
    type: String,
    enum: ['planifié', 'en_cours', 'terminé', 'annulé'],
    default: 'planifié'
  },
  images: [String],
  notes: String
}, {
  timestamps: true
});

module.exports = model('Maintenance', maintenanceSchema);
