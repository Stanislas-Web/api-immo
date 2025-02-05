const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listing.controller');
const { auth } = require('../middleware/auth');

/**
 * @swagger
 * /api/listings:
 *   post:
 *     tags: [Listings]
 *     summary: Créer une nouvelle annonce
 *     security:
 *       - bearerAuth: []
 *     description: Permet à un propriétaire de créer une nouvelle annonce pour un bien immobilier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - propertyType
 *               - transactionType
 *               - price
 *             properties:
 *               title:
 *                 type: string
 *                 description: Titre de l'annonce
 *               description:
 *                 type: string
 *                 description: Description détaillée de l'annonce
 *               propertyType:
 *                 type: string
 *                 enum: [appartement, maison, terrain, bureau, commerce]
 *               transactionType:
 *                 type: string
 *                 enum: [location, vente]
 *               price:
 *                 type: object
 *                 properties:
 *                   amount:
 *                     type: number
 *                   currency:
 *                     type: string
 *                     default: CDF
 *                   period:
 *                     type: string
 *                     enum: [mois, trimestre, annee]
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *               location:
 *                 type: object
 *                 properties:
 *                   address:
 *                     type: string
 *                   city:
 *                     type: string
 *                   coordinates:
 *                     type: object
 *                     properties:
 *                       latitude:
 *                         type: number
 *                       longitude:
 *                         type: number
 *     responses:
 *       201:
 *         description: Annonce créée avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé
 */
router.post('/', auth(['proprietaire', 'admin']), listingController.createListing);

/**
 * @swagger
 * /api/listings:
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
 *         name: propertyType
 *         schema:
 *           type: string
 *           enum: [appartement, maison, terrain, bureau, commerce]
 *         description: Type de bien
 *       - in: query
 *         name: transactionType
 *         schema:
 *           type: string
 *           enum: [location, vente]
 *         description: Type de transaction
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
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Ville
 *     responses:
 *       200:
 *         description: Liste des annonces
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Listing'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 pages:
 *                   type: integer
 */
router.get('/', listingController.getAllListings);

/**
 * @swagger
 * /api/listings/{id}:
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Listing'
 *       404:
 *         description: Annonce non trouvée
 */
router.get('/:id', listingController.getListingById);

/**
 * @swagger
 * /api/listings/{id}:
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
 *             $ref: '#/components/schemas/Listing'
 *     responses:
 *       200:
 *         description: Annonce mise à jour avec succès
 *       404:
 *         description: Annonce non trouvée
 *       401:
 *         description: Non autorisé
 */
router.put('/:id', auth(['proprietaire', 'admin']), listingController.updateListing);

/**
 * @swagger
 * /api/listings/{id}:
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
 */
router.delete('/:id', auth(['proprietaire', 'admin']), listingController.deleteListing);

/**
 * @swagger
 * /api/listings/{id}/toggle-favorite:
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
