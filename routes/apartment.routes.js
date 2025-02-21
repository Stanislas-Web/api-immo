const express = require('express');
const router = express.Router();
const apartmentController = require('../controllers/apartment.controller');
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');

/**
 * @swagger
 * /api/v1/apartments:
 *   post:
 *     tags: [Apartments]
 *     summary: Créer un nouvel appartement
 *     security:
 *       - bearerAuth: []
 *     description: Permet à un propriétaire de créer un nouvel appartement dans un immeuble
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - buildingId
 *               - number
 *               - type
 *               - floor
 *               - surface
 *               - rooms
 *               - bathrooms
 *               - price
 *             properties:
 *               buildingId:
 *                 type: string
 *                 description: ID de l'immeuble
 *               number:
 *                 type: string
 *                 description: Numéro de l'appartement
 *               type:
 *                 type: string
 *                 enum: [studio, f1, f2, f3, f4, f5, duplex, penthouse]
 *                 description: Type d'appartement
 *               floor:
 *                 type: number
 *                 description: Étage de l'appartement
 *               surface:
 *                 type: number
 *                 description: Surface en mètres carrés
 *               rooms:
 *                 type: number
 *                 description: Nombre de pièces
 *               bathrooms:
 *                 type: number
 *                 description: Nombre de salles de bain
 *               price:
 *                 type: object
 *                 properties:
 *                   amount:
 *                     type: number
 *                     description: Prix mensuel du loyer
 *                   currency:
 *                     type: string
 *                     default: CDF
 *                     description: Devise du prix
 *                   paymentFrequency:
 *                     type: string
 *                     enum: [day, mensuel, trimestriel, semestriel, annuel]
 *                     default: mensuel
 *                     description: Fréquence de paiement
 *               description:
 *                 type: string
 *                 description: Description de l'appartement
 *               features:
 *                 type: object
 *                 properties:
 *                   furnished:
 *                     type: boolean
 *                     default: false
 *                     description: Appartement meublé
 *                   airConditioning:
 *                     type: boolean
 *                     default: false
 *                     description: Climatisation
 *                   balcony:
 *                     type: boolean
 *                     default: false
 *                     description: Balcon
 *                   internet:
 *                     type: boolean
 *                     default: false
 *                     description: Internet
 *                   parking:
 *                     type: boolean
 *                     default: false
 *                     description: Parking
 *                   securitySystem:
 *                     type: boolean
 *                     default: false
 *                     description: Système de sécurité
 *               status:
 *                 type: string
 *                 enum: [disponible, loué, en_rénovation, réservé]
 *                 default: disponible
 *                 description: État actuel de l'appartement
 *     responses:
 *       201:
 *         description: Appartement créé avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Non autorisé à créer un appartement dans cet immeuble
 */
router.post('/', auth(['proprietaire', 'admin'], { requireVerification: false }), apartmentController.createApartment);

/**
 * @swagger
 * /api/v1/apartments:
 *   get:
 *     tags: [Apartments]
 *     summary: Liste tous les appartements
 *     security:
 *       - bearerAuth: []
 *     description: Récupère la liste de tous les appartements avec pagination et filtres
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de la page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Nombre d'éléments par page
 *       - in: query
 *         name: buildingId
 *         schema:
 *           type: string
 *         description: Filtrer par immeuble
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [studio, f1, f2, f3, f4, f5, duplex, penthouse]
 *         description: Filtrer par type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [disponible, loué, en_rénovation, réservé]
 *         description: Filtrer par statut
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Prix minimum
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Prix maximum
 *     responses:
 *       200:
 *         description: Liste des appartements
 *       401:
 *         description: Non autorisé
 */
router.get('/', auth(['proprietaire', 'admin', 'locataire', 'agent'], { requireVerification: false }), apartmentController.getAllApartments);

/**
 * @swagger
 * /api/v1/apartments/building/{buildingId}:
 *   get:
 *     tags: [Apartments]
 *     summary: Obtenir tous les appartements d'un immeuble
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: buildingId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'immeuble
 *     responses:
 *       200:
 *         description: Liste des appartements de l'immeuble
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Apartment'
 *       404:
 *         description: Immeuble non trouvé
 *       401:
 *         description: Non autorisé
 */
router.get('/building/:buildingId', auth(['proprietaire', 'admin', 'locataire', 'agent'], { requireVerification: false }), apartmentController.getApartmentsByBuilding);

/**
 * @swagger
 * /api/v1/apartments/{id}:
 *   get:
 *     tags: [Apartments]
 *     summary: Obtenir les détails d'un appartement
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'appartement
 *     responses:
 *       200:
 *         description: Détails de l'appartement
 *       404:
 *         description: Appartement non trouvé
 *       401:
 *         description: Non autorisé
 */
router.get('/:id', auth(['proprietaire', 'admin', 'locataire', 'agent'], { requireVerification: false }), apartmentController.getApartmentById);

/**
 * @swagger
 * /api/v1/apartments/{id}:
 *   put:
 *     tags: [Apartments]
 *     summary: Mettre à jour un appartement
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'appartement
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               number:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [studio, f1, f2, f3, f4, f5, duplex, penthouse]
 *               floor:
 *                 type: number
 *               surface:
 *                 type: number
 *               rooms:
 *                 type: number
 *               bathrooms:
 *                 type: number
 *               price:
 *                 type: object
 *                 properties:
 *                   amount:
 *                     type: number
 *                   currency:
 *                     type: string
 *                   paymentFrequency:
 *                     type: string
 *                     enum: [day, mensuel, trimestriel, semestriel, annuel]
 *               description:
 *                 type: string
 *               features:
 *                 type: object
 *                 properties:
 *                   furnished:
 *                     type: boolean
 *                   airConditioning:
 *                     type: boolean
 *                   balcony:
 *                     type: boolean
 *                   internet:
 *                     type: boolean
 *                   parking:
 *                     type: boolean
 *                   securitySystem:
 *                     type: boolean
 *               status:
 *                 type: string
 *                 enum: [disponible, loué, en_rénovation, réservé]
 *     responses:
 *       200:
 *         description: Appartement mis à jour avec succès
 *       404:
 *         description: Appartement non trouvé
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Non autorisé à modifier cet appartement
 */
router.put('/:id', auth(['proprietaire', 'admin'], { requireVerification: false }), apartmentController.updateApartment);

/**
 * @swagger
 * /api/v1/apartments/{id}:
 *   delete:
 *     tags: [Apartments]
 *     summary: Supprimer un appartement
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'appartement
 *     responses:
 *       200:
 *         description: Appartement supprimé avec succès
 *       404:
 *         description: Appartement non trouvé
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Non autorisé à supprimer cet appartement
 */
router.delete('/:id', auth(['proprietaire', 'admin'], { requireVerification: false }), apartmentController.deleteApartment);

/**
 * @swagger
 * /api/v1/apartments/{id}/images:
 *   post:
 *     tags: [Apartments]
 *     summary: Ajouter des images à un appartement
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'appartement
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Images ajoutées avec succès
 *       404:
 *         description: Appartement non trouvé
 *       401:
 *         description: Non autorisé
 */
router.post('/:id/images', auth(['proprietaire', 'admin'], { requireVerification: false }), upload.array('images', 10), apartmentController.addImages);

/**
 * @swagger
 * /api/v1/apartments/{id}/images/{imageId}:
 *   delete:
 *     tags: [Apartments]
 *     summary: Supprimer une image d'un appartement
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'appartement
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'image
 *     responses:
 *       200:
 *         description: Image supprimée avec succès
 *       404:
 *         description: Image ou appartement non trouvé
 *       401:
 *         description: Non autorisé
 */
router.delete('/:id/images/:imageId', auth(['proprietaire', 'admin'], { requireVerification: false }), apartmentController.deleteImage);

module.exports = router;
