const express = require('express');
const router = express.Router();
const taxController = require('../controllers/tax.controller');
const { auth } = require('../middleware/auth');

/**
 * @swagger
 * /api/v1/taxes:
 *   post:
 *     tags: [Taxes]
 *     summary: Créer une nouvelle taxe
 *     security:
 *       - bearerAuth: []
 *     description: Permet de créer une nouvelle taxe pour un appartement
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - apartmentId
 *               - amount
 *             properties:
 *               apartmentId:
 *                 type: string
 *                 description: ID de l'appartement
 *               amount:
 *                 type: object
 *                 required: true
 *                 properties:
 *                   value:
 *                     type: number
 *                     description: Montant de la taxe
 *                   currency:
 *                     type: string
 *                     default: CDF
 *                     description: Devise de la taxe
 *               dueDate:
 *                 type: string
 *                 format: date
 *                 description: Date d'échéance de la taxe
 *               description:
 *                 type: string
 *                 description: Description ou motif de la taxe
 *     responses:
 *       201:
 *         description: Taxe créée avec succès
 *       400:
 *         description: Appartement non soumis à une taxe
 *       404:
 *         description: Appartement non trouvé
 */
router.post('/', auth(['proprietaire', 'admin']), taxController.createTax);

/**
 * @swagger
 * /api/v1/taxes:
 *   get:
 *     tags: [Taxes]
 *     summary: Récupérer toutes les taxes
 *     security:
 *       - bearerAuth: []
 *     description: Récupère la liste de toutes les taxes avec filtres optionnels
 *     parameters:
 *       - in: query
 *         name: apartmentId
 *         schema:
 *           type: string
 *         description: Filtrer par ID d'appartement
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, paid, overdue]
 *         description: Filtrer par statut de paiement
 *     responses:
 *       200:
 *         description: Liste des taxes récupérée avec succès
 */
router.get('/', auth(['proprietaire', 'admin']), taxController.getAllTaxes);

/**
 * @swagger
 * /api/v1/taxes/apartment/{apartmentId}:
 *   get:
 *     tags: [Taxes]
 *     summary: Récupérer toutes les taxes d'un appartement
 *     security:
 *       - bearerAuth: []
 *     description: Récupère la liste de toutes les taxes associées à un appartement spécifique
 *     parameters:
 *       - in: path
 *         name: apartmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'appartement
 *     responses:
 *       200:
 *         description: Liste des taxes récupérée avec succès
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
 *                   description: Nombre de taxes trouvées
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Tax'
 *       404:
 *         description: Appartement non trouvé
 */
router.get('/apartment/:apartmentId', auth(['proprietaire', 'admin']), taxController.getTaxesByApartment);

/**
 * @swagger
 * /api/v1/taxes/{id}:
 *   get:
 *     tags: [Taxes]
 *     summary: Récupérer une taxe par son ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la taxe
 *     responses:
 *       200:
 *         description: Taxe récupérée avec succès
 *       404:
 *         description: Taxe non trouvée
 */
router.get('/:id', auth(['proprietaire', 'admin']), taxController.getTaxById);

/**
 * @swagger
 * /api/v1/taxes/{id}:
 *   put:
 *     tags: [Taxes]
 *     summary: Mettre à jour une taxe
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la taxe
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: object
 *                 properties:
 *                   value:
 *                     type: number
 *                     description: Montant de la taxe
 *                   currency:
 *                     type: string
 *                     description: Devise de la taxe
 *               status:
 *                 type: string
 *                 enum: [pending, paid, overdue]
 *                 description: Statut du paiement
 *               dueDate:
 *                 type: string
 *                 format: date
 *                 description: Date d'échéance
 *               description:
 *                 type: string
 *                 description: Description ou motif
 *     responses:
 *       200:
 *         description: Taxe mise à jour avec succès
 *       404:
 *         description: Taxe non trouvée
 */
router.put('/:id', auth(['proprietaire', 'admin']), taxController.updateTax);

/**
 * @swagger
 * /api/v1/taxes/{id}:
 *   delete:
 *     tags: [Taxes]
 *     summary: Supprimer une taxe
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la taxe
 *     responses:
 *       200:
 *         description: Taxe supprimée avec succès
 *       404:
 *         description: Taxe non trouvée
 */
router.delete('/:id', auth(['proprietaire', 'admin']), taxController.deleteTax);

module.exports = router;
