const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const maintenanceController = require('../controllers/maintenance.controller');

/**
 * @swagger
 * /api/v1/maintenances/owner:
 *   get:
 *     summary: Récupérer toutes les maintenances des appartements d'un propriétaire
 *     tags: [Maintenances]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des maintenances récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Maintenance'
 *       500:
 *         description: Erreur serveur
 */
router.get('/owner', auth(['proprietaire']), maintenanceController.getMaintenancesByOwner);

/**
 * @swagger
 * /api/v1/maintenances:
 *   post:
 *     summary: Créer une nouvelle maintenance
 *     tags: [Maintenances]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Maintenance'
 *     responses:
 *       201:
 *         description: Maintenance créée avec succès
 */
router.post('/', auth(['proprietaire', 'admin', 'locataire'], { requireVerification: false }), maintenanceController.createMaintenance);

/**
 * @swagger
 * /api/v1/maintenances:
 *   get:
 *     summary: Récupérer toutes les maintenances
 *     tags: [Maintenances]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: apartmentId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Liste des maintenances récupérée avec succès
 */
router.get('/', auth(['proprietaire', 'admin', 'locataire'], { requireVerification: false }), maintenanceController.getAllMaintenances);

/**
 * @swagger
 * /api/v1/maintenances/{id}:
 *   get:
 *     summary: Récupérer une maintenance par son ID
 *     tags: [Maintenances]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Maintenance récupérée avec succès
 */
router.get('/:id', auth(['proprietaire', 'admin', 'locataire'], { requireVerification: false }), maintenanceController.getMaintenanceById);

/**
 * @swagger
 * /api/v1/maintenances/apartment/{apartmentId}:
 *   get:
 *     tags: [Maintenances]
 *     summary: Récupérer toutes les maintenances d'un appartement
 *     security:
 *       - bearerAuth: []
 *     description: Récupère la liste de toutes les maintenances associées à un appartement spécifique
 *     parameters:
 *       - in: path
 *         name: apartmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'appartement
 *     responses:
 *       200:
 *         description: Liste des maintenances récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   description: Nombre de maintenances trouvées
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Maintenance'
 *       403:
 *         description: Non autorisé - Accès restreint au propriétaire de l'immeuble ou au locataire actuel
 *       404:
 *         description: Appartement non trouvé
 */
router.get('/apartment/:apartmentId', auth(['proprietaire', 'admin', 'locataire'], { requireVerification: false }), maintenanceController.getMaintenancesByApartment);

/**
 * @swagger
 * /api/v1/maintenances/{id}:
 *   put:
 *     summary: Mettre à jour une maintenance
 *     tags: [Maintenances]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Maintenance'
 *     responses:
 *       200:
 *         description: Maintenance mise à jour avec succès
 */
router.put('/:id', auth(['proprietaire', 'admin'], { requireVerification: false }), maintenanceController.updateMaintenance);

/**
 * @swagger
 * /api/v1/maintenances/{id}:
 *   delete:
 *     summary: Supprimer une maintenance
 *     tags: [Maintenances]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Maintenance supprimée avec succès
 */
router.delete('/:id', auth(['proprietaire', 'admin'], { requireVerification: false }), maintenanceController.deleteMaintenance);

/**
 * @swagger
 * /api/v1/maintenances/{id}/images:
 *   post:
 *     summary: Ajouter des images à une maintenance
 *     tags: [Maintenances]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
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
 */
router.post('/:id/images', auth(['proprietaire', 'admin', 'locataire'], { requireVerification: false }), upload.array('images'), maintenanceController.addImages);

/**
 * @swagger
 * /api/v1/maintenances/{id}/images/{imageUrl}:
 *   delete:
 *     summary: Supprimer une image d'une maintenance
 *     tags: [Maintenances]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: imageUrl
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Image supprimée avec succès
 */
router.delete('/:id/images/:imageUrl', auth(['proprietaire', 'admin'], { requireVerification: false }), maintenanceController.deleteImage);

module.exports = router;
