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
 *               type:
 *                 type: string
 *                 enum: [text, image, document]
 *                 default: text
 *                 description: Type du message (text par défaut)
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
/**
 * @swagger
 * /api/v1/messages/conversations:
 *   get:
 *     tags: [Messages]
 *     summary: Obtenir toutes les conversations de l'utilisateur
 *     security:
 *       - bearerAuth: []
 *     description: Récupère la liste de toutes les conversations de l'utilisateur connecté
 *     responses:
 *       200:
 *         description: Liste des conversations récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       participants:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             _id:
 *                               type: string
 *                             firstName:
 *                               type: string
 *                             lastName:
 *                               type: string
 *                             email:
 *                               type: string
 *                             profilePicture:
 *                               type: string
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
router.get('/conversations', auth(), messageController.getConversations);

/**
 * @swagger
 * /api/v1/messages/conversations:
 *   post:
 *     tags: [Messages]
 *     summary: Créer une nouvelle conversation
 *     security:
 *       - bearerAuth: []
 *     description: Permet de créer une nouvelle conversation avec un ou plusieurs utilisateurs
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - participants
 *               - type
 *             properties:
 *               participants:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Liste des IDs des participants à la conversation
 *               type:
 *                 type: string
 *                 enum: [direct, group]
 *                 description: Type de conversation (direct pour 2 personnes, group pour plus)
 *               metadata:
 *                 type: object
 *                 description: Métadonnées additionnelles (optionnel)
 *                 properties:
 *                   listingId:
 *                     type: string
 *                     description: ID de l'annonce concernée (optionnel)
 *     responses:
 *       201:
 *         description: Conversation créée avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé
 */
router.post('/conversations', auth(), messageController.createConversation);

/**
 * @swagger
 * /api/v1/messages/conversations/{id}:
 *   get:
 *     tags: [Messages]
 *     summary: Obtenir une conversation spécifique
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la conversation
 *     description: Récupère les détails d'une conversation spécifique
 *     responses:
 *       200:
 *         description: Conversation récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     participants:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                           email:
 *                             type: string
 *                           profilePicture:
 *                             type: string
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Conversation non trouvée
 *       500:
 *         description: Erreur serveur
 */
router.get('/conversations/:id', auth(), messageController.getConversationById);

/**
 * @swagger
 * /api/v1/messages/conversations/{id}/messages:
 *   post:
 *     tags: [Messages]
 *     summary: Envoyer un message dans une conversation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la conversation
 *     description: Permet d'envoyer un message dans une conversation existante
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: Contenu du message
 *               type:
 *                 type: string
 *                 enum: [text, image, document]
 *                 default: text
 *                 description: Type du message (text par défaut)
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [image, document, audio]
 *                     url:
 *                       type: string
 *                     name:
 *                       type: string
 *     responses:
 *       201:
 *         description: Message envoyé avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Conversation non trouvée
 */
router.post('/conversations/:id/messages', auth(), messageController.sendMessage);

/**
 * @swagger
 * /api/v1/messages/conversations/{id}/messages:
 *   get:
 *     tags: [Messages]
 *     summary: Obtenir tous les messages d'une conversation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la conversation
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
 *           default: 20
 *         description: Nombre de messages par page
 *     description: Récupère tous les messages d'une conversation spécifique avec pagination
 *     responses:
 *       200:
 *         description: Messages récupérés avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       conversation:
 *                         type: string
 *                       sender:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                           profilePicture:
 *                             type: string
 *                       content:
 *                         type: string
 *                       attachments:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             type:
 *                               type: string
 *                               enum: [image, document, audio]
 *                             url:
 *                               type: string
 *                             name:
 *                               type: string
 *                       readBy:
 *                         type: array
 *                         items:
 *                           type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Conversation non trouvée
 *       500:
 *         description: Erreur serveur
 */
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
