const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message.controller');
const { auth } = require('../middleware/auth');

/**
 * @swagger
 * /api/v1/messages/conversations:
 *   post:
 *     tags: [Messages]
 *     summary: Créer une nouvelle conversation
 *     security:
 *       - bearerAuth: []
 *     description: Permet de créer une nouvelle conversation entre deux utilisateurs
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
 *                   format: uuid
 *                 description: Liste des IDs des participants
 *               type:
 *                 type: string
 *                 enum: [direct, groupe]
 *                 description: Type de conversation
 *               title:
 *                 type: string
 *                 description: Titre de la conversation (requis pour les groupes)
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
 * /api/v1/messages/conversations:
 *   get:
 *     tags: [Messages]
 *     summary: Liste toutes les conversations
 *     security:
 *       - bearerAuth: []
 *     description: Récupère la liste de toutes les conversations de l'utilisateur
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
 *         name: type
 *         schema:
 *           type: string
 *           enum: [direct, groupe]
 *         description: Filtrer par type de conversation
 *     responses:
 *       200:
 *         description: Liste des conversations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Conversation'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 pages:
 *                   type: integer
 */
router.get('/conversations', auth(), messageController.getConversations);

/**
 * @swagger
 * /api/v1/messages/conversations/{id}:
 *   get:
 *     tags: [Messages]
 *     summary: Obtenir les détails d'une conversation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la conversation
 *     responses:
 *       200:
 *         description: Détails de la conversation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Conversation'
 *       404:
 *         description: Conversation non trouvée
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
 *       404:
 *         description: Conversation non trouvée
 *       401:
 *         description: Non autorisé
 */
router.post('/conversations/:id/messages', auth(), messageController.sendMessage);

/**
 * @swagger
 * /api/v1/messages/conversations/{id}/messages:
 *   get:
 *     tags: [Messages]
 *     summary: Liste tous les messages d'une conversation
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
 *     responses:
 *       200:
 *         description: Liste des messages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Message'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 pages:
 *                   type: integer
 *       404:
 *         description: Conversation non trouvée
 */
router.get('/conversations/:id/messages', auth(), messageController.getMessages);

module.exports = router;
