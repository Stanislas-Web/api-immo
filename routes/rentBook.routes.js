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
 *     summary: Permettre à tout utilisateur de faire un paiement pour un carnet de loyer
 *     description: Cette route permet à n'importe quel utilisateur authentifié de faire un paiement pour un carnet de loyer spécifique.
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
 *                 example: 500
 *               paymentMethod:
 *                 type: string
 *                 enum: [espèces, virement, chèque, mobile_money]
 *                 default: espèces
 *                 description: Méthode de paiement
 *                 example: mobile_money
 *               reference:
 *                 type: string
 *                 description: Référence du paiement
 *                 example: "REF-123456"
 *               comment:
 *                 type: string
 *                 description: Commentaire sur le paiement
 *                 example: "Paiement du loyer de mars 2025"
 *     responses:
 *       200:
 *         description: Paiement ajouté avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Paiement ajouté avec succès"
 *                 data:
 *                   $ref: '#/components/schemas/RentBook'
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Carnet de loyer non trouvé
 */
router.post('/:id/payment', auth(['proprietaire', 'locataire', 'admin', 'agent', 'utilisateur'], { requireVerification: false }), rentBookController.addPayment);

/**
 * @swagger
 * /api/v1/rentbooks/{id}/payment-history:
 *   get:
 *     tags: [RentBooks]
 *     summary: Obtenir l'historique des paiements d'un carnet de loyer
 *     description: Cette route permet de récupérer l'historique complet des paiements pour un carnet de loyer spécifique, avec un résumé des paiements.
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
 *         description: Historique des paiements récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Historique des paiements récupéré avec succès"
 *                 data:
 *                   type: object
 *                   properties:
 *                     paymentHistory:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-03-01T10:00:00.000Z"
 *                           amount:
 *                             type: number
 *                             example: 500
 *                           paymentMethod:
 *                             type: string
 *                             example: "mobile_money"
 *                           status:
 *                             type: string
 *                             example: "payé"
 *                           reference:
 *                             type: string
 *                             example: "REF-123456"
 *                           comment:
 *                             type: string
 *                             example: "Paiement du loyer de mars 2025"
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalPaid:
 *                           type: number
 *                           example: 1500
 *                         monthlyRent:
 *                           type: number
 *                           example: 500
 *                         numberOfPayments:
 *                           type: integer
 *                           example: 3
 *                         lastPaymentDate:
 *                           type: string
 *                           format: date-time
 *                           example: "2025-03-01T10:00:00.000Z"
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Carnet de loyer non trouvé
 */
router.get('/:id/payment-history', auth(['proprietaire', 'locataire', 'admin', 'agent', 'utilisateur'], { requireVerification: false }), rentBookController.getPaymentHistory);

/**
 * @swagger
 * /api/v1/rentbooks/{id}/public-payment:
 *   post:
 *     tags: [RentBooks]
 *     summary: Permettre à tout le monde de faire un paiement pour une location spécifique (accès public)
 *     description: Cette route permet à n'importe qui, même sans authentification, de faire un paiement pour un carnet de loyer spécifique.
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
 *                 example: 500
 *               paymentMethod:
 *                 type: string
 *                 enum: [espèces, virement, chèque, mobile_money]
 *                 default: espèces
 *                 description: Méthode de paiement
 *                 example: mobile_money
 *               reference:
 *                 type: string
 *                 description: Référence du paiement
 *                 example: "REF-123456"
 *               comment:
 *                 type: string
 *                 description: Commentaire sur le paiement
 *                 example: "Paiement du loyer de mars 2025"
 *     responses:
 *       200:
 *         description: Paiement ajouté avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Paiement ajouté avec succès"
 *                 data:
 *                   type: object
 *                   properties:
 *                     rentBookId:
 *                       type: string
 *                       example: "67c8f8ac04744d2e7ccf2c3a"
 *                     paymentDate:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-03-06T10:45:30.000Z"
 *                     amount:
 *                       type: number
 *                       example: 500
 *                     paymentMethod:
 *                       type: string
 *                       example: "mobile_money"
 *                     status:
 *                       type: string
 *                       example: "payé"
 *                     reference:
 *                       type: string
 *                       example: "REF-123456"
 *       404:
 *         description: Carnet de loyer non trouvé
 */
router.post('/:id/public-payment', rentBookController.publicPayment);

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
