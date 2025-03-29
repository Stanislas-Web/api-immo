const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { auth } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: API de gestion des paiements
 */

/**
 * @swagger
 * /api/v1/payments/initiate:
 *   post:
 *     tags: [Payments]
 *     summary: Initier un paiement via FlexPay
 *     description: Permet d'initier un paiement pour un carnet de loyer
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rentBookId
 *               - type
 *               - amount
 *               - phone
 *             properties:
 *               rentBookId:
 *                 type: string
 *                 description: ID du carnet de loyer
 *               type:
 *                 type: string
 *                 enum: [loyer, caution, frais_service, autre]
 *                 description: Type de paiement
 *               amount:
 *                 type: number
 *                 description: Montant à payer
 *               phone:
 *                 type: string
 *                 description: Numéro de téléphone pour le paiement mobile
 *               devise:
 *                 type: string
 *                 enum: [CDF, USD]
 *                 default: CDF
 *                 description: Devise du paiement (Franc Congolais ou Dollar Américain)
 *               metadata:
 *                 type: object
 *                 properties:
 *                   notes:
 *                     type: string
 *                     description: Notes additionnelles sur le paiement
 *     responses:
 *       200:
 *         description: Paiement initié avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     transaction:
 *                       $ref: '#/components/schemas/Transaction'
 *                     rentBook:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         apartment:
 *                           type: string
 *                         tenant:
 *                           type: string
 *                         owner:
 *                           type: string
 *                     flexPayResponse:
 *                       type: object
 */
router.post('/initiate', auth(['proprietaire', 'locataire'], { requireVerification: false }), paymentController.initiatePayment);

/**
 * @swagger
 * /api/v1/payments/callback:
 *   post:
 *     tags: [Payments]
 *     summary: Callback FlexPay
 *     description: Endpoint pour recevoir les notifications de paiement de FlexPay
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - reference
 *               - amount
 *               - currency
 *             properties:
 *               code:
 *                 type: integer
 *                 description: Code résultat (0 = succès, autre = échec)
 *                 example: 0
 *               reference:
 *                 type: string
 *                 description: Référence de la transaction
 *                 example: "MLOPN5472458"
 *               provider_reference:
 *                 type: string
 *                 description: Référence du fournisseur
 *                 example: "7KI81020PHS"
 *               orderNumber:
 *                 type: string
 *                 description: Numéro de commande
 *                 example: "9bsTX7qXdpQe243815877848"
 *               amount:
 *                 type: number
 *                 description: Montant de la transaction
 *                 example: 100
 *               amountCustomer:
 *                 type: number
 *                 description: Montant total facturé au client
 *                 example: 102
 *               phone:
 *                 type: string
 *                 description: Numéro de téléphone
 *                 example: "243815877848"
 *               currency:
 *                 type: string
 *                 enum: [CDF, USD]
 *                 description: Devise de la transaction
 *                 example: "USD"
 *               createdAt:
 *                 type: string
 *                 description: Date de la transaction
 *                 example: "30-05-2022 10:01:47"
 *               channel:
 *                 type: string
 *                 description: Canal de paiement
 *                 example: "mpesa"
 *     responses:
 *       200:
 *         description: Callback traité avec succès
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
 *                   example: "Paiement traité avec succès"
 *                 data:
 *                   type: object
 *                   properties:
 *                     transactionId:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     reference:
 *                       type: string
 *                       example: "MLOPN5472458"
 *                     status:
 *                       type: string
 *                       example: "complete"
 *                     amount:
 *                       type: number
 *                       example: 100
 *                     currency:
 *                       type: string
 *                       example: "USD"
 *       404:
 *         description: Transaction non trouvée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Transaction introuvable"
 *                 reference:
 *                   type: string
 *                   example: "MLOPN5472458"
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Erreur lors du traitement du callback"
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
router.post('/callback', paymentController.handleCallback);

/**
 * @swagger
 * /api/v1/payments/transactions:
 *   get:
 *     tags: [Payments]
 *     summary: Obtenir les transactions de l'utilisateur connecté
 *     description: Récupère toutes les transactions où l'utilisateur est soit locataire soit propriétaire
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [en_attente, complete, echoue, rembourse]
 *         description: Filtrer par statut de transaction
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [loyer, caution, frais_service, autre]
 *         description: Filtrer par type de transaction
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de début (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de fin (YYYY-MM-DD)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Numéro de la page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Nombre d'éléments par page
 *     responses:
 *       200:
 *         description: Liste des transactions récupérée avec succès
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
 *                   example: "Transactions récupérées avec succès"
 *                 data:
 *                   type: object
 *                   properties:
 *                     transactions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "507f1f77bcf86cd799439011"
 *                           apartmentId:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               title:
 *                                 type: string
 *                               address:
 *                                 type: string
 *                           tenant:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               firstName:
 *                                 type: string
 *                               lastName:
 *                                 type: string
 *                               phone:
 *                                 type: string
 *                               email:
 *                                 type: string
 *                           landlord:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               firstName:
 *                                 type: string
 *                               lastName:
 *                                 type: string
 *                               phone:
 *                                 type: string
 *                               email:
 *                                 type: string
 *                           type:
 *                             type: string
 *                             enum: [loyer, caution, frais_service, autre]
 *                           amount:
 *                             type: object
 *                             properties:
 *                               value:
 *                                 type: number
 *                               currency:
 *                                 type: string
 *                           status:
 *                             type: string
 *                             enum: [en_attente, complete, echoue, rembourse]
 *                           paymentDate:
 *                             type: string
 *                             format: date-time
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 50
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         pages:
 *                           type: integer
 *                           example: 5
 *                         limit:
 *                           type: integer
 *                           example: 10
 *       401:
 *         description: Non autorisé - Token manquant ou invalide
 *       500:
 *         description: Erreur serveur
 */
router.get('/transactions', auth(['proprietaire', 'locataire']), paymentController.getUserTransactions);

/**
 * @swagger
 * /api/v1/payments/success-page:
 *   get:
 *     tags: [Payments]
 *     summary: Page de succès
 *     description: Affiche la page de succès du paiement
 *     responses:
 *       200:
 *         description: Page HTML de succès
 */
router.get('/success-page', paymentController.getSuccessPage);

/**
 * @swagger
 * /api/v1/payments/error-page:
 *   get:
 *     tags: [Payments]
 *     summary: Page d'erreur
 *     description: Affiche la page d'erreur du paiement
 *     responses:
 *       200:
 *         description: Page HTML d'erreur
 */
router.get('/error-page', paymentController.getErrorPage);

module.exports = router;
