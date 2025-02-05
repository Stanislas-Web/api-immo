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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Apartment'
 *     responses:
 *       201:
 *         description: Appartement créé avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé
 */
router.post('/', auth(['proprietaire', 'agent']), apartmentController.createApartment);

/**
 * @swagger
 * /api/v1/apartments:
 *   get:
 *     tags: [Apartments]
 *     summary: Liste tous les appartements
 *     security:
 *       - bearerAuth: []
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
 *           enum: [disponible, loue, maintenance]
 *         description: Filtrer par statut
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [studio, appartement, maison, villa]
 *         description: Filtrer par type
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Apartment'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 pages:
 *                   type: integer
 */
router.get('/', auth(), apartmentController.getAllApartments);

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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Apartment'
 *       404:
 *         description: Appartement non trouvé
 */
router.get('/:id', auth(), apartmentController.getApartmentById);

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
 *             $ref: '#/components/schemas/Apartment'
 *     responses:
 *       200:
 *         description: Appartement mis à jour avec succès
 *       404:
 *         description: Appartement non trouvé
 *       401:
 *         description: Non autorisé
 */
router.put('/:id', auth(['proprietaire', 'agent']), apartmentController.updateApartment);

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
 */
router.delete('/:id', auth(['proprietaire', 'agent']), apartmentController.deleteApartment);

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
router.post('/:id/images', auth(['proprietaire', 'agent']), upload.array('images', 10), apartmentController.addImages);

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
router.delete('/:id/images/:imageId', auth(['proprietaire', 'agent']), apartmentController.deleteImage);

module.exports = router;
