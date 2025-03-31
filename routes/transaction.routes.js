const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transaction.controller');
const { auth } = require('../middleware/auth');

/**
 * @swagger
 * /api/v1/transactions:
 *   post:
 *     tags: [Transactions]
 *     summary: Créer une nouvelle transaction
 *     security:
 *       - bearerAuth: []
 *     description: Permet de créer une nouvelle transaction pour une location
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - listingId
 *               - startDate
 *               - endDate
 *             properties:
 *               listingId:
 *                 type: string
 *                 description: ID de l'annonce
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Date de début de location
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: Date de fin de location
 *               amount:
 *                 type: number
 *                 description: Montant mensuel de la location
 *               deposit:
 *                 type: number
 *                 description: Montant de la caution
 *               notes:
 *                 type: string
 *                 description: Notes additionnelles
 *     responses:
 *       201:
 *         description: Transaction créée avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Non autorisé à créer une transaction pour cette annonce
 */
router.post('/', auth(['proprietaire', 'admin', 'agent']), transactionController.createTransaction);

/**
 * @swagger
 * /api/v1/transactions:
 *   get:
 *     tags: [Transactions]
 *     summary: Liste toutes les transactions
 *     security:
 *       - bearerAuth: []
 *     description: Récupère la liste de toutes les transactions avec pagination, filtres et sommes totales
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
 *           enum: [pending, active, completed, cancelled]
 *         description: Filtrer par statut
 *     responses:
 *       200:
 *         description: Liste des transactions avec sommes totales
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransactionResponse'
 *       401:
 *         description: Non autorisé
 */
router.get('/', auth(['proprietaire', 'admin', 'agent']), transactionController.getAllTransactions);

/**
 * @swagger
 * /api/v1/transactions/{id}:
 *   get:
 *     tags: [Transactions]
 *     summary: Obtenir les détails d'une transaction
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la transaction
 *     responses:
 *       200:
 *         description: Détails de la transaction
 *       404:
 *         description: Transaction non trouvée
 *       401:
 *         description: Non autorisé
 */
router.get('/:id', auth(['proprietaire', 'admin', 'agent', 'locataire']), transactionController.getTransactionById);

/**
 * @swagger
 * /api/v1/transactions/{id}:
 *   put:
 *     tags: [Transactions]
 *     summary: Mettre à jour une transaction
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la transaction
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               amount:
 *                 type: number
 *               deposit:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [pending, active, completed, cancelled]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Transaction mise à jour avec succès
 *       404:
 *         description: Transaction non trouvée
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Non autorisé à modifier cette transaction
 */
router.put('/:id', auth(['proprietaire', 'admin', 'agent']), transactionController.updateTransaction);

/**
 * @swagger
 * /api/v1/transactions/{id}/status:
 *   patch:
 *     tags: [Transactions]
 *     summary: Mettre à jour le statut d'une transaction
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la transaction
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
 *                 enum: [pending, active, completed, cancelled]
 *     responses:
 *       200:
 *         description: Statut de la transaction mis à jour avec succès
 *       404:
 *         description: Transaction non trouvée
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Non autorisé à modifier le statut de cette transaction
 */
router.patch('/:id/status', auth(['proprietaire', 'admin', 'agent']), transactionController.updateTransactionStatus);

/**
 * @swagger
 * /api/v1/transactions/{id}/validate:
 *   patch:
 *     tags: [Transactions]
 *     summary: Valider une transaction
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la transaction
 *     responses:
 *       200:
 *         description: Transaction validée avec succès
 *       404:
 *         description: Transaction non trouvée
 *       401:
 *         description: Non autorisé
 */
router.patch('/:id/validate', auth(['proprietaire', 'agent']), transactionController.validateTransaction);

/**
 * @swagger
 * /api/v1/transactions/{id}/reject:
 *   patch:
 *     tags: [Transactions]
 *     summary: Rejeter une transaction
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la transaction
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Raison du rejet
 *     responses:
 *       200:
 *         description: Transaction rejetée avec succès
 *       404:
 *         description: Transaction non trouvée
 *       401:
 *         description: Non autorisé
 */
router.patch('/:id/reject', auth(['proprietaire', 'agent']), transactionController.rejectTransaction);

/**
 * @swagger
 * /api/v1/transactions/stats:
 *   get:
 *     tags: [Transactions]
 *     summary: Obtenir les statistiques des transactions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de début pour les statistiques
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de fin pour les statistiques
 *     responses:
 *       200:
 *         description: Statistiques des transactions
 */
router.get('/stats', auth(['proprietaire', 'admin']), transactionController.getTransactionStats);

module.exports = router;
