const { Schema, model } = require('mongoose');
const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Building:
 *       type: object
 *       required:
 *         - name
 *         - address
 *         - owner
 *       properties:
 *         name:
 *           type: string
 *           description: Nom de l'immeuble
 *         address:
 *           type: object
 *           properties:
 *             street:
 *               type: string
 *             city:
 *               type: string
 *             postalCode:
 *               type: string
 *             country:
 *               type: string
 *               default: Congo
 *         owner:
 *           type: string
 *           format: uuid
 *           description: ID du propriétaire
 *         description:
 *           type: string
 *           description: Description détaillée de l'immeuble
 *         features:
 *           type: array
 *           items:
 *             type: string
 *             enum: [ascenseur, parking, gardien, piscine, gym, jardin]
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           description: URLs des images de l'immeuble
 *         totalApartments:
 *           type: number
 *           description: Nombre total d'appartements
 *         availableApartments:
 *           type: number
 *           description: Nombre d'appartements disponibles
 *         status:
 *           type: string
 *           enum: [en_construction, disponible, complet]
 *           default: disponible
 *         constructionYear:
 *           type: number
 *           description: Année de construction
 *         documents:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [titre_foncier, permis_construction, autre]
 *               url:
 *                 type: string
 *               name:
 *                 type: string
 *       example:
 *         name: "Résidence Les Palmiers"
 *         address:
 *           street: "123 Avenue de la Paix"
 *           city: "Kinshasa"
 *           postalCode: "243"
 *           country: "Congo"
 *         description: "Magnifique résidence avec vue sur le fleuve"
 *         features: ["ascenseur", "parking", "gardien"]
 *         totalApartments: 20
 *         availableApartments: 5
 *         status: "disponible"
 *         constructionYear: 2023
 */

const buildingSchema = new Schema({
  name: { type: String, required: true },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true, default: 'Congo' }
  },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String },
  features: [{
    type: String,
    enum: ['ascenseur', 'parking', 'gardien', 'piscine', 'gym', 'jardin']
  }],
  images: [{ type: String }],
  totalApartments: { type: Number, default: 0 },
  availableApartments: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['en_construction', 'disponible', 'complet'],
    default: 'disponible'
  },
  constructionYear: { type: Number },
  documents: [{
    type: { type: String, enum: ['titre_foncier', 'permis_construction', 'autre'] },
    url: { type: String },
    name: { type: String }
  }]
}, {
  timestamps: true,
  versionKey: false
});

module.exports = model('Building', buildingSchema);
