const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message.controller');
const { auth } = require('../middleware/auth');

/**
 * @swagger
 * /api/v1/messages:
 *   post:
 *     tags: [Messages]
 *     summary: Envoyer un nouveau message
 *     security:
 *       - bearerAuth: []
 *     description: Permet d'envoyer un message à un autre utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - receiverId
 *               - content
 *             properties:
 *               receiverId:
 *                 type: string
 *                 description: ID du destinataire
 *               content:
 *                 type: string
 *                 description: Contenu du message
 *               listingId:
 *                 type: string
 *                 description: ID de l'annonce concernée (optionnel)
 *     responses:
 *       201:
 *         description: Message envoyé avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé
 */
router.post('/', auth(['proprietaire', 'admin', 'agent', 'locataire']), messageController.sendMessage);

/**
 * @swagger
 * /api/v1/messages:
 *   get:
 *     tags: [Messages]
 *     summary: Liste tous les messages
 *     security:
 *       - bearerAuth: []
 *     description: Récupère la liste de tous les messages de l'utilisateur
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
 *         name: userId
 *         schema:
 *           type: string
 *         description: ID de l'autre utilisateur pour filtrer la conversation
 *     responses:
 *       200:
 *         description: Liste des messages
 *       401:
 *         description: Non autorisé
 */
router.get('/', auth(['proprietaire', 'admin', 'agent', 'locataire']), messageController.getMessages);

// Move the conversations routes before the :id routes to prevent path conflicts
router.get('/conversations', auth(), messageController.getConversations);
router.post('/conversations', auth(), messageController.createConversation);
router.get('/conversations/:id', auth(), messageController.getConversationById);
router.post('/conversations/:id/messages', auth(), messageController.sendMessage);
router.get('/conversations/:id/messages', auth(), messageController.getMessages);

// Then place the conversation-specific routes
router.get('/:id', auth(['proprietaire', 'admin', 'agent', 'locataire']), messageController.getMessageById);

/**
 * @swagger
 * /api/v1/messages/{id}:
 *   delete:
 *     tags: [Messages]
 *     summary: Supprimer un message
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du message
 *     responses:
 *       200:
 *         description: Message supprimé avec succès
 *       404:
 *         description: Message non trouvé
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Non autorisé à supprimer ce message
 */
router.delete('/:id', auth(['proprietaire', 'admin', 'agent', 'locataire']), messageController.deleteMessage);

module.exports = router;
