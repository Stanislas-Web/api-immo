const express = require('express');
const router = express.Router();
const buildingController = require('../controllers/building.controller');
const { auth } = require('../middleware/auth');

/**
 * @swagger
 * /api/buildings:
 *   post:
 *     tags: [Buildings]
 *     summary: Créer un nouveau bâtiment
 *     security:
 *       - bearerAuth: []
 *     description: Permet à un propriétaire de créer un nouveau bâtiment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Building'
 *     responses:
 *       201:
 *         description: Bâtiment créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Building'
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé
 */
router.post('/', auth(['proprietaire', 'admin']), buildingController.createBuilding);

/**
 * @swagger
 * /api/buildings:
 *   get:
 *     tags: [Buildings]
 *     summary: Liste tous les bâtiments
 *     description: Récupère la liste de tous les bâtiments avec pagination
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
 *           enum: [en_construction, disponible, complet]
 *         description: Filtrer par statut
 *     responses:
 *       200:
 *         description: Liste des bâtiments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 buildings:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Building'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 pages:
 *                   type: integer
 */
router.get('/', auth(['proprietaire', 'admin']), buildingController.getAllBuildings);

/**
 * @swagger
 * /api/buildings/{id}:
 *   get:
 *     tags: [Buildings]
 *     summary: Obtenir les détails d'un bâtiment
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du bâtiment
 *     responses:
 *       200:
 *         description: Détails du bâtiment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Building'
 *       404:
 *         description: Bâtiment non trouvé
 */
router.get('/:id', auth(['proprietaire', 'admin']), buildingController.getBuildingById);

/**
 * @swagger
 * /api/buildings/{id}:
 *   put:
 *     tags: [Buildings]
 *     summary: Mettre à jour un bâtiment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du bâtiment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Building'
 *     responses:
 *       200:
 *         description: Bâtiment mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Building'
 *       404:
 *         description: Bâtiment non trouvé
 *       401:
 *         description: Non autorisé
 */
router.put('/:id', auth(['proprietaire', 'admin']), buildingController.updateBuilding);

/**
 * @swagger
 * /api/buildings/{id}:
 *   delete:
 *     tags: [Buildings]
 *     summary: Supprimer un bâtiment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du bâtiment
 *     responses:
 *       200:
 *         description: Bâtiment supprimé avec succès
 *       404:
 *         description: Bâtiment non trouvé
 *       401:
 *         description: Non autorisé
 */
router.delete('/:id', auth(['proprietaire', 'admin']), buildingController.deleteBuilding);

/**
 * @swagger
 * /api/buildings/{id}/documents:
 *   post:
 *     tags: [Buildings]
 *     summary: Ajouter un document à un bâtiment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du bâtiment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - url
 *               - name
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [titre_foncier, permis_construction, autre]
 *               url:
 *                 type: string
 *                 description: URL du document
 *               name:
 *                 type: string
 *                 description: Nom du document
 *     responses:
 *       201:
 *         description: Document ajouté avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 type:
 *                   type: string
 *                 url:
 *                   type: string
 *                 name:
 *                   type: string
 *       404:
 *         description: Bâtiment non trouvé
 *       401:
 *         description: Non autorisé
 */
router.post('/:id/documents', auth(['proprietaire', 'admin']), buildingController.addBuildingDocument);

module.exports = router;
