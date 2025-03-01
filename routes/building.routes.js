const express = require('express');
const router = express.Router();
const buildingController = require('../controllers/building.controller');
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');

/**
 * @swagger
 * /api/v1/buildings:
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
 *             type: object
 *             required:
 *               - name
 *               - address
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   postalCode:
 *                     type: string
 *                   country:
 *                     type: string
 *                     default: Congo
 *               description:
 *                 type: string
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [ascenseur, parking, gardien, piscine, gym, jardin]
 *               totalApartments:
 *                 type: number
 *               availableApartments:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [en_construction, disponible, complet]
 *               constructionYear:
 *                 type: number
 *     responses:
 *       201:
 *         description: Bâtiment créé avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé
 */
router.post('/', auth(['proprietaire', 'admin'], { requireVerification: false }), buildingController.createBuilding);

/**
 * @swagger
 * /api/v1/buildings:
 *   get:
 *     tags: [Buildings]
 *     summary: Liste tous les bâtiments
 *     security:
 *       - bearerAuth: []
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
 *       401:
 *         description: Non autorisé
 */
router.get('/', auth(['proprietaire', 'admin', 'locataire'], { requireVerification: false }), buildingController.getAllBuildings);
/**
 * @swagger
 * /api/v1/buildings/{id}:
 *   get:
 *     tags: [Buildings]
 *     summary: Obtenir les détails d'un bâtiment
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
 *         description: Détails du bâtiment
 *       404:
 *         description: Bâtiment non trouvé
 *       401:
 *         description: Non autorisé
 */
router.get('/:id', auth(['proprietaire', 'admin'], { requireVerification: false }), buildingController.getBuildingById);
/**
 * @swagger
 * /api/v1/buildings/{id}:
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
 *       404:
 *         description: Bâtiment non trouvé
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Non autorisé à modifier cet immeuble
 */
router.put('/:id', auth(['proprietaire', 'admin'], { requireVerification: false }), buildingController.updateBuilding);

/**
 * @swagger
 * /api/v1/buildings/{id}:
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
 *       403:
 *         description: Non autorisé à supprimer cet immeuble
 */
router.delete('/:id', auth(['proprietaire', 'admin'], { requireVerification: false }), buildingController.deleteBuilding);

/**
 * @swagger
 * /api/v1/buildings/{id}/documents:
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
router.post('/:id/documents', auth(['proprietaire', 'admin'], { requireVerification: false }), buildingController.addBuildingDocument);

/**
 * @swagger
 * /api/v1/buildings/{id}/images:
 *   post:
 *     tags: [Buildings]
 *     summary: Ajouter des images à un immeuble
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'immeuble
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
 *         description: Immeuble non trouvé
 *       401:
 *         description: Non autorisé
 */
router.post('/:id/images', auth(['proprietaire', 'admin'], { requireVerification: false }), upload.building.array('images', 10), buildingController.addBuildingImages);

/**
 * @swagger
 * /api/v1/buildings/{id}/images/{imageId}:
 *   delete:
 *     tags: [Buildings]
 *     summary: Supprimer une image d'un immeuble
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'immeuble
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
 *         description: Image ou immeuble non trouvé
 *       401:
 *         description: Non autorisé
 */
router.delete('/:id/images/:imageId', auth(['proprietaire', 'admin'], { requireVerification: false }), buildingController.deleteBuildingImage);

/**
 * @swagger
 * /api/v1/buildings/user/{userId}:
 *   get:
 *     tags: [Buildings]
 *     summary: Obtenir les immeubles d'un utilisateur spécifique
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
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
 *     responses:
 *       200:
 *         description: Liste des immeubles de l'utilisateur
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Utilisateur non trouvé
 */
router.get('/user/:userId', auth(['proprietaire', 'admin'], { requireVerification: false }), buildingController.getBuildingsByUserId);

/**
 * @swagger
 * /api/v1/buildings/user/{userId}/apartments:
 *   get:
 *     tags: [Buildings]
 *     summary: Obtenir le total des appartements d'un utilisateur dans ses buildings
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Total des appartements récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 totalBuildings:
 *                   type: integer
 *                   description: Nombre total de buildings
 *                 totalApartments:
 *                   type: integer
 *                   description: Nombre total d'appartements
 *                 details:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       buildingId:
 *                         type: string
 *                       buildingName:
 *                         type: string
 *                       totalApartments:
 *                         type: integer
 *       500:
 *         description: Erreur serveur
 */
router.get('/user/:userId/apartments', buildingController.getTotalApartmentsByUser);

module.exports = router;
