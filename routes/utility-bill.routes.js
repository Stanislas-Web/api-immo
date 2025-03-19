const express = require('express');
const router = express.Router();
const utilityBillController = require('../controllers/utility-bill.controller');
const { auth } = require('../middleware/auth');

/**
 * @swagger
 * /api/v1/utility-bills:
 *   post:
 *     summary: Créer une nouvelle facture d'utilité (eau ou électricité)
 *     tags: [Factures d'utilité]
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
 *                 description: ID de l'immeuble
 *               type:
 *                 type: string
 *                 enum: [eau, electricite]
 *                 description: Type de facture (eau ou électricité)
 *               amount:
 *                 type: object
 *                 properties:
 *                   value:
 *                     type: number
 *                     description: Montant de la facture
 *                   currency:
 *                     type: string
 *                     description: Devise (par défaut CDF)
 *     responses:
 *       201:
 *         description: Facture créée avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
router.post('/', auth(['proprietaire', 'admin']), utilityBillController.createUtilityBill);

/**
 * @swagger
 * /api/v1/utility-bills:
 *   get:
 *     summary: Récupérer toutes les factures d'utilité
 *     tags: [Factures d'utilité]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des factures récupérée avec succès
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
router.get('/', auth(['proprietaire', 'admin']), utilityBillController.getAllUtilityBills);

/**
 * @swagger
 * /api/v1/utility-bills/building/{buildingId}:
 *   get:
 *     summary: Récupérer les factures d'utilité pour un immeuble spécifique
 *     tags: [Factures d'utilité]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: buildingId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'immeuble
 *     responses:
 *       200:
 *         description: Liste des factures récupérée avec succès
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Immeuble non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.get('/building/:buildingId', auth(['proprietaire', 'admin', 'locataire']), utilityBillController.getUtilityBillsByBuilding);

/**
 * @swagger
 * /api/v1/utility-bills/apartment/{apartmentId}:
 *   get:
 *     summary: Récupérer les factures d'utilité pour un appartement spécifique
 *     tags: [Factures d'utilité]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: apartmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'appartement
 *     responses:
 *       200:
 *         description: Liste des factures récupérée avec succès
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Appartement non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.get('/apartment/:apartmentId', auth(['proprietaire', 'admin', 'locataire']), utilityBillController.getUtilityBillsByApartment);

/**
 * @swagger
 * /api/v1/utility-bills/{id}:
 *   get:
 *     summary: Récupérer une facture d'utilité par son ID
 *     tags: [Factures d'utilité]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la facture
 *     responses:
 *       200:
 *         description: Facture récupérée avec succès
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Facture non trouvée
 *       500:
 *         description: Erreur serveur
 */
router.get('/:id', auth(['proprietaire', 'admin', 'locataire']), utilityBillController.getUtilityBillById);

/**
 * @swagger
 * /api/v1/utility-bills/{id}/mark-paid:
 *   patch:
 *     summary: Marquer une facture d'utilité comme payée
 *     tags: [Factures d'utilité]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la facture
 *     responses:
 *       200:
 *         description: Facture marquée comme payée avec succès
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Facture non trouvée
 *       500:
 *         description: Erreur serveur
 */
router.patch('/:id/mark-paid', auth(['proprietaire', 'admin', 'locataire']), utilityBillController.markUtilityBillAsPaid);

/**
 * @swagger
 * /api/v1/utility-bills/{billId}/apartment/{apartmentId}/mark-paid:
 *   patch:
 *     summary: Marquer une facture d'utilité comme payée pour un appartement spécifique
 *     tags: [Factures d'utilité]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: billId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la facture
 *       - in: path
 *         name: apartmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'appartement
 *     responses:
 *       200:
 *         description: Facture marquée comme payée pour cet appartement avec succès
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Facture ou appartement non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.patch('/:billId/apartment/:apartmentId/mark-paid', auth(['proprietaire', 'admin', 'locataire']), utilityBillController.markUtilityBillAsPaidForApartment);

/**
 * @swagger
 * /api/v1/utility-bills/{id}:
 *   delete:
 *     summary: Supprimer une facture d'utilité
 *     tags: [Factures d'utilité]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la facture
 *     responses:
 *       200:
 *         description: Facture supprimée avec succès
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Facture non trouvée
 *       500:
 *         description: Erreur serveur
 */
router.delete('/:id', auth(['proprietaire', 'admin']), utilityBillController.deleteUtilityBill);

module.exports = router;
