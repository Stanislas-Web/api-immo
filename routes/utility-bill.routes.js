const express = require('express');
const router = express.Router();
const utilityBillController = require('../controllers/utility-bill.controller');
const { auth } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: UtilityBills
 *   description: Gestion des factures d'eau et d'électricité
 */

/**
 * @swagger
 * /api/v1/utility-bills:
 *   post:
 *     summary: Créer une nouvelle facture d'eau ou d'électricité
 *     tags: [UtilityBills]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - buildingId
 *               - type
 *               - amount
 *             properties:
 *               buildingId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [eau, electricite]
 *               amount:
 *                 type: object
 *                 properties:
 *                   value:
 *                     type: number
 *                   currency:
 *                     type: string
 *     responses:
 *       201:
 *         description: Facture créée avec succès
 *       400:
 *         description: Données invalides
 *       404:
 *         description: Immeuble non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.post('/', auth(), utilityBillController.createUtilityBill);

/**
 * @swagger
 * /api/v1/utility-bills:
 *   get:
 *     summary: Récupérer toutes les factures
 *     tags: [UtilityBills]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des factures
 *       500:
 *         description: Erreur serveur
 */
router.get('/', auth(), utilityBillController.getAllUtilityBills);

/**
 * @swagger
 * /api/v1/utility-bills/{id}:
 *   get:
 *     summary: Récupérer une facture par son ID
 *     tags: [UtilityBills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la facture
 *     responses:
 *       200:
 *         description: Détails de la facture
 *       404:
 *         description: Facture non trouvée
 *       500:
 *         description: Erreur serveur
 */
router.get('/:id', auth(), utilityBillController.getUtilityBillById);

/**
 * @swagger
 * /api/v1/utility-bills/building/{buildingId}:
 *   get:
 *     summary: Récupérer les factures par immeuble
 *     tags: [UtilityBills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: buildingId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de l'immeuble
 *     responses:
 *       200:
 *         description: Liste des factures pour cet immeuble
 *       500:
 *         description: Erreur serveur
 */
router.get('/building/:buildingId', auth(), utilityBillController.getUtilityBillsByBuilding);

/**
 * @swagger
 * /api/v1/utility-bills/{id}/mark-paid:
 *   patch:
 *     summary: Marquer une facture comme payée
 *     tags: [UtilityBills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la facture
 *     responses:
 *       200:
 *         description: Facture marquée comme payée
 *       404:
 *         description: Facture non trouvée
 *       500:
 *         description: Erreur serveur
 */
router.patch('/:id/mark-paid', auth(), utilityBillController.markUtilityBillAsPaid);

/**
 * @swagger
 * /api/v1/utility-bills/{id}/apartment/{apartmentId}/mark-paid:
 *   patch:
 *     summary: Marquer le paiement d'un appartement pour une facture
 *     tags: [UtilityBills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la facture
 *       - in: path
 *         name: apartmentId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de l'appartement
 *     responses:
 *       200:
 *         description: Paiement enregistré
 *       404:
 *         description: Facture ou appartement non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.patch('/:id/apartment/:apartmentId/mark-paid', auth(), utilityBillController.markApartmentPayment);

/**
 * @swagger
 * /api/v1/utility-bills/{id}:
 *   delete:
 *     summary: Supprimer une facture
 *     tags: [UtilityBills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la facture
 *     responses:
 *       200:
 *         description: Facture supprimée
 *       404:
 *         description: Facture non trouvée
 *       500:
 *         description: Erreur serveur
 */
router.delete('/:id', auth(), utilityBillController.deleteUtilityBill);

module.exports = router;
