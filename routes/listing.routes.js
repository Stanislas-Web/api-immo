const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listing.controller');
const { auth } = require('../middleware/auth');

/**
 * @swagger
 * /api/v1/listings:
 *   post:
 *     tags: [Listings]
 *     summary: Créer une nouvelle annonce
 *     security:
 *       - bearerAuth: []
 *     description: Permet à un propriétaire ou agent de créer une nouvelle annonce pour un appartement
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - apartmentId
 *               - title
 *               - description
 *               - price
 *             properties:
 *               apartmentId:
 *                 type: string
 *                 description: ID de l'appartement
 *               title:
 *                 type: string
 *                 description: Titre de l'annonce
 *               description:
 *                 type: string
 *                 description: Description détaillée
 *               price:
 *                 type: number
 *                 description: Prix mensuel de location
 *               availableFrom:
 *                 type: string
 *                 format: date
 *                 description: Date de disponibilité
 *               minimumStay:
 *                 type: number
 *                 description: Durée minimum de location en mois
 *               status:
 *                 type: string
 *                 enum: [active, inactive, reserved, rented]
 *                 default: active
 *     responses:
 *       201:
 *         description: Annonce créée avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Non autorisé à créer une annonce pour cet appartement
 */
router.post('/', auth(['proprietaire', 'admin', 'agent']), listingController.createListing);

/**
 * @swagger
 * /api/v1/listings:
 *   get:
 *     tags: [Listings]
 *     summary: Liste toutes les annonces
 *     description: Récupère la liste de toutes les annonces avec pagination et filtres
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, reserved, rented]
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
 *         description: Liste des annonces
 */
router.get('/', listingController.getAllListings);

/**
 * @swagger
 * /api/v1/listings/{id}:
 *   get:
 *     tags: [Listings]
 *     summary: Obtenir les détails d'une annonce
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'annonce
 *     responses:
 *       200:
 *         description: Détails de l'annonce
 *       404:
 *         description: Annonce non trouvée
 */
router.get('/:id', listingController.getListingById);

/**
 * @swagger
 * /api/v1/listings/{id}:
 *   put:
 *     tags: [Listings]
 *     summary: Mettre à jour une annonce
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'annonce
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               availableFrom:
 *                 type: string
 *                 format: date
 *               minimumStay:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [active, inactive, reserved, rented]
 *     responses:
 *       200:
 *         description: Annonce mise à jour avec succès
 *       404:
 *         description: Annonce non trouvée
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Non autorisé à modifier cette annonce
 */
router.put('/:id', auth(['proprietaire', 'admin', 'agent']), listingController.updateListing);

/**
 * @swagger
 * /api/v1/listings/{id}:
 *   delete:
 *     tags: [Listings]
 *     summary: Supprimer une annonce
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'annonce
 *     responses:
 *       200:
 *         description: Annonce supprimée avec succès
 *       404:
 *         description: Annonce non trouvée
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Non autorisé à supprimer cette annonce
 */
router.delete('/:id', auth(['proprietaire', 'admin', 'agent']), listingController.deleteListing);

/**
 * @swagger
 * /api/v1/listings/{id}/toggle-favorite:
 *   post:
 *     tags: [Listings]
 *     summary: Ajouter/Retirer une annonce des favoris
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'annonce
 *     responses:
 *       200:
 *         description: Statut des favoris mis à jour avec succès
 *       404:
 *         description: Annonce non trouvée
 *       401:
 *         description: Non autorisé
 */
router.post('/:id/toggle-favorite', auth(), listingController.toggleFavorite);

module.exports = router;
