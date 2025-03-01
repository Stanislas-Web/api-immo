const express = require('express');
const router = express.Router();
const rentBookController = require('../controllers/rentBook.controller');
const { auth } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: RentBooks
 *   description: Gestion des carnets de loyer
 */

/**
 * @swagger
 * /api/v1/rentbooks:
 *   post:
 *     tags: [RentBooks]
 *     summary: Créer un nouveau carnet de loyer
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - apartmentId
 *               - tenantId
 *               - leaseStartDate
 *               - leaseEndDate
 *               - monthlyRent
 *             properties:
 *               apartmentId:
 *                 type: string
 *                 description: ID de l'appartement
 *               tenantId:
 *                 type: string
 *                 description: ID du locataire
 *               leaseStartDate:
 *                 type: string
 *                 format: date
 *                 description: Date de début du bail
 *               leaseEndDate:
 *                 type: string
 *                 format: date
 *                 description: Date de fin du bail
 *               monthlyRent:
 *                 type: number
 *                 description: Montant du loyer mensuel
 *               securityDeposit:
 *                 type: number
 *                 description: Montant de la caution
 *     responses:
 *       201:
 *         description: Carnet de loyer créé avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès interdit
 *       404:
 *         description: Appartement ou locataire non trouvé
 */
router.post('/', auth(['proprietaire', 'admin'], { requireVerification: false }), rentBookController.createRentBook);

/**
 * @swagger
 * /api/v1/rentbooks:
 *   get:
 *     tags: [RentBooks]
 *     summary: Obtenir tous les carnets de loyer (admin uniquement)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de page pour la pagination
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
 *           enum: [actif, terminé, résilié]
 *         description: Filtrer par statut
 *       - in: query
 *         name: apartmentId
 *         schema:
 *           type: string
 *         description: Filtrer par ID d'appartement
 *       - in: query
 *         name: tenantId
 *         schema:
 *           type: string
 *         description: Filtrer par ID de locataire
 *       - in: query
 *         name: ownerId
 *         schema:
 *           type: string
 *         description: Filtrer par ID de propriétaire
 *     responses:
 *       200:
 *         description: Liste des carnets de loyer
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès interdit
 */
router.get('/', auth(['admin'], { requireVerification: false }), rentBookController.getAllRentBooks);

/**
 * @swagger
 * /api/v1/rentbooks/owner:
 *   get:
 *     tags: [RentBooks]
 *     summary: Obtenir les carnets de loyer du propriétaire connecté
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de page pour la pagination
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
 *           enum: [actif, terminé, résilié]
 *         description: Filtrer par statut
 *       - in: query
 *         name: apartmentId
 *         schema:
 *           type: string
 *         description: Filtrer par ID d'appartement
 *       - in: query
 *         name: tenantId
 *         schema:
 *           type: string
 *         description: Filtrer par ID de locataire
 *     responses:
 *       200:
 *         description: Liste des carnets de loyer du propriétaire
 *       401:
 *         description: Non autorisé
 */
router.get('/owner', auth(['proprietaire'], { requireVerification: false }), rentBookController.getOwnerRentBooks);

/**
 * @swagger
 * /api/v1/rentbooks/tenant:
 *   get:
 *     tags: [RentBooks]
 *     summary: Obtenir les carnets de loyer du locataire connecté
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de page pour la pagination
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
 *           enum: [actif, terminé, résilié]
 *         description: Filtrer par statut
 *       - in: query
 *         name: apartmentId
 *         schema:
 *           type: string
 *         description: Filtrer par ID d'appartement
 *     responses:
 *       200:
 *         description: Liste des carnets de loyer du locataire
 *       401:
 *         description: Non autorisé
 */
router.get('/tenant', auth(['locataire'], { requireVerification: false }), rentBookController.getTenantRentBooks);

/**
 * @swagger
 * /api/v1/rentbooks/{id}:
 *   get:
 *     tags: [RentBooks]
 *     summary: Obtenir un carnet de loyer par son ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du carnet de loyer
 *     responses:
 *       200:
 *         description: Détails du carnet de loyer
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès interdit
 *       404:
 *         description: Carnet de loyer non trouvé
 */
router.get('/:id', auth(['proprietaire', 'locataire', 'admin'], { requireVerification: false }), rentBookController.getRentBookById);

/**
 * @swagger
 * /api/v1/rentbooks/{id}/payment:
 *   post:
 *     tags: [RentBooks]
 *     summary: Ajouter un paiement à un carnet de loyer
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du carnet de loyer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Montant du paiement
 *               paymentMethod:
 *                 type: string
 *                 enum: [espèces, virement, chèque, mobile_money]
 *                 default: espèces
 *                 description: Méthode de paiement
 *               reference:
 *                 type: string
 *                 description: Référence du paiement
 *               comment:
 *                 type: string
 *                 description: Commentaire sur le paiement
 *     responses:
 *       200:
 *         description: Paiement ajouté avec succès
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès interdit
 *       404:
 *         description: Carnet de loyer non trouvé
 */
router.post('/:id/payment', auth(['proprietaire', 'admin'], { requireVerification: false }), rentBookController.addPayment);

/**
 * @swagger
 * /api/v1/rentbooks/{id}/status:
 *   put:
 *     tags: [RentBooks]
 *     summary: Mettre à jour le statut d'un carnet de loyer
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du carnet de loyer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [actif, terminé, résilié]
 *                 description: Nouveau statut du carnet de loyer
 *     responses:
 *       200:
 *         description: Statut mis à jour avec succès
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès interdit
 *       404:
 *         description: Carnet de loyer non trouvé
 */
router.put('/:id/status', auth(['proprietaire', 'admin'], { requireVerification: false }), rentBookController.updateRentBookStatus);

/**
 * @swagger
 * /api/v1/rentbooks/{id}:
 *   delete:
 *     tags: [RentBooks]
 *     summary: Supprimer un carnet de loyer (admin uniquement)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du carnet de loyer
 *     responses:
 *       200:
 *         description: Carnet de loyer supprimé avec succès
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès interdit
 *       404:
 *         description: Carnet de loyer non trouvé
 */
router.delete('/:id', auth(['admin'], { requireVerification: false }), rentBookController.deleteRentBook);

module.exports = router;
