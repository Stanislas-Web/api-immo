const mongoose = require('mongoose');
const { Schema, model } = mongoose;

/**
 * @swagger
 * components:
 *   schemas:
 *     Message:
 *       type: object
 *       required:
 *         - conversation
 *         - sender
 *         - content
 *       properties:
 *         conversation:
 *           type: string
 *           format: uuid
 *           description: Référence à la conversation
 *         sender:
 *           type: string
 *           format: uuid
 *           description: Référence à l'utilisateur qui envoie le message
 *         content:
 *           type: string
 *           description: Contenu du message
 *         attachments:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [image, document, audio]
 *               url:
 *                 type: string
 *               name:
 *                 type: string
 *         readBy:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *           description: Liste des utilisateurs qui ont lu le message
 *         status:
 *           type: string
 *           enum: [envoyé, délivré, lu]
 *           default: envoyé
 *           description: Statut du message
 *       example:
 *         conversation: "507f1f77bcf86cd799439011"
 *         sender: "507f1f77bcf86cd799439012"
 *         content: "Bonjour, je suis intéressé par votre appartement."
 *         status: "envoyé"
 *         readBy: []
 *     Conversation:
 *       type: object
 *       required:
 *         - participants
 *         - type
 *       properties:
 *         participants:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *           description: Liste des participants à la conversation
 *         type:
 *           type: string
 *           enum: [direct, groupe]
 *           description: Type de conversation
 *         title:
 *           type: string
 *           description: Titre de la conversation (pour les groupes)
 *         lastMessage:
 *           type: object
 *           properties:
 *             content:
 *               type: string
 *             sender:
 *               type: string
 *               format: uuid
 *             timestamp:
 *               type: string
 *               format: date-time
 *         unreadCount:
 *           type: object
 *           additionalProperties:
 *             type: integer
 *           description: Nombre de messages non lus par utilisateur
 *         settings:
 *           type: object
 *           properties:
 *             notifications:
 *               type: boolean
 *               default: true
 *             muted:
 *               type: boolean
 *               default: false
 *       example:
 *         participants: ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]
 *         type: "direct"
 *         lastMessage:
 *           content: "D'accord, je vous recontacte bientôt."
 *           sender: "507f1f77bcf86cd799439011"
 *           timestamp: "2025-02-04T14:30:00Z"
 *         unreadCount:
 *           "507f1f77bcf86cd799439012": 1
 */

const messageSchema = new Schema({
  conversation: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  type: {
    type: String,
    enum: ['text', 'image', 'document'],
    default: 'text'
  },
  attachments: [{
    url: { type: String },
    type: { type: String },
    name: { type: String }
  }],
  readBy: [{
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    readAt: { type: Date, default: Date.now }
  }],
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  }
}, {
  timestamps: true,
  versionKey: false
});

const conversationSchema = new Schema({
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  type: {
    type: String,
    enum: ['direct', 'group'],
    default: 'direct'
  },
  lastMessage: {
    content: { type: String },
    sender: { type: Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date }
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: {}
  },
  metadata: {
    apartment: { type: Schema.Types.ObjectId, ref: 'Apartment' },
    listing: { type: Schema.Types.ObjectId, ref: 'Listing' }
  }
}, {
  timestamps: true,
  versionKey: false
});

// Index pour la recherche de messages
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ 'readBy.user': 1 });

// Index pour la recherche de conversations
conversationSchema.index({ participants: 1 });
conversationSchema.index({ 'lastMessage.timestamp': -1 });

module.exports = {
  Message: model('Message', messageSchema),
  Conversation: model('Conversation', conversationSchema)
};
