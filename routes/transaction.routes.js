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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Transaction'
 *     responses:
 *       201:
 *         description: Transaction créée avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé
 */
router.post('/', auth(['locataire', 'proprietaire', 'agent']), transactionController.createTransaction);

/**
 * @swagger
 * /api/v1/transactions:
 *   get:
 *     tags: [Transactions]
 *     summary: Liste toutes les transactions
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
 *           enum: [en_attente, validee, rejetee]
 *         description: Filtrer par statut
 *     responses:
 *       200:
 *         description: Liste des transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 pages:
 *                   type: integer
 */
router.get('/', auth(), transactionController.getTransactions);

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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 *       404:
 *         description: Transaction non trouvée
 */
router.get('/:id', auth(), transactionController.getTransactionById);

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

module.exports = router;
