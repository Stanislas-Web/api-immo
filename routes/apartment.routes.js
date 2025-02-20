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
 *               price:
 *                 type: number
 *                 description: Prix mensuel de location
 *               surface:
 *                 type: number
 *                 description: Surface en mètres carrés
 *               description:
 *                 type: string
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [meuble, climatisation, balcon, parking, internet]
 *               status:
 *                 type: string
 *                 enum: [disponible, loue, maintenance]
 *                 default: disponible
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
router.post('/', auth(['proprietaire', 'admin']), apartmentController.createApartment);

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
 *           enum: [disponible, loue, maintenance]
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
router.get('/', auth(['proprietaire', 'admin', 'locataire', 'agent']), apartmentController.getAllApartments);

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
router.get('/:id', auth(['proprietaire', 'admin', 'locataire', 'agent']), apartmentController.getApartmentById);

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
 *               price:
 *                 type: number
 *               surface:
 *                 type: number
 *               description:
 *                 type: string
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [meuble, climatisation, balcon, parking, internet]
 *               status:
 *                 type: string
 *                 enum: [disponible, loue, maintenance]
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
router.put('/:id', auth(['proprietaire', 'admin']), apartmentController.updateApartment);

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
router.delete('/:id', auth(['proprietaire', 'admin']), apartmentController.deleteApartment);

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
router.post('/:id/images', auth(['proprietaire', 'admin']), upload.array('images', 10), apartmentController.addImages);

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
router.delete('/:id/images/:imageId', auth(['proprietaire', 'admin']), apartmentController.deleteImage);

module.exports = router;
