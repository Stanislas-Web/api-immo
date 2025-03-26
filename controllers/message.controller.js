const { Message, Conversation } = require('../models/message.model');
const User = require('../models/user.model');
const axios = require('axios');

exports.createConversation = async (req, res) => {
    try {
        const { participants, type, metadata } = req.body;

        // Validate required fields
        if (!participants || !Array.isArray(participants) || participants.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Le champ participants est requis et doit être un tableau non vide'
            });
        }

        if (!type) {
            return res.status(400).json({
                success: false,
                message: 'Le champ type est requis'
            });
        }

        // Vérifier si tous les participants existent
        const users = await User.find({ _id: { $in: participants } });
        if (users.length !== participants.length) {
            return res.status(400).json({
                success: false,
                message: 'Un ou plusieurs participants n\'existent pas'
            });
        }

        // Pour les conversations directes, vérifier si une conversation existe déjà
        if (type === 'direct') {
            const existingConversation = await Conversation.findOne({
                type: 'direct',
                participants: { $all: participants }
            }).populate('participants', 'firstName lastName email phone');

            if (existingConversation) {
                // Envoyer le message WhatsApp aux participants
                for (const participant of existingConversation.participants) {
                    if (participant.phone && participant._id.toString() !== req.user._id.toString()) {
                        try {
                            console.log('Sending WhatsApp message to:', participant.phone);
                            
                            const data = {
                                messaging_product: "whatsapp",
                                to: participant.phone,
                                type: "template",
                                template: {
                                    name: "message_annonce",
                                    language: {
                                        code: "fr"
                                    }
                                }
                            };

                            const config = {
                                method: 'post',
                                maxBodyLength: Infinity,
                                url: 'https://graph.facebook.com/v16.0/230630080143527/messages',
                                headers: { 
                                    'Content-Type': 'application/json', 
                                    'Authorization': 'Bearer EAALOqv96b5kBOyZBK9MAZCF7Ev63btHib6DKyOTudKXvNYFkZBDdYZA6LDE6nssXrTZCEkdLP3hZBRLky3LS4SC5ZByFOtTzXNBVac4SKZCQPIug7YksXgiyeDZAqvGkcusMzz1cDjPPKXNkoVvQ8wrEZA4veGrRIyStcKg7a0MxBD1TE1DRCW76VLJikBEb9DLa8RQYhhKtkn4GWdduA8'
                                },
                                data: data
                            };

                            const response = await axios.request(config);
                            console.log('WhatsApp API Response:', JSON.stringify(response.data, null, 2));
                        } catch (whatsappError) {
                            console.error('Error sending WhatsApp message:', whatsappError.response?.data || whatsappError.message);
                        }
                    }
                }

                return res.status(200).json({
                    success: true,
                    data: existingConversation
                });
            }
        }

        const conversation = new Conversation({
            participants,
            type,
            metadata
        });

        await conversation.save();
        
        // Populate the participants after saving
        await conversation.populate('participants', 'firstName lastName email phone');

        // Envoyer le message WhatsApp aux nouveaux participants
        for (const participant of conversation.participants) {
            if (participant.phone && participant._id.toString() !== req.user._id.toString()) {
                try {
                    console.log('Sending WhatsApp message to:', participant.phone);
                    
                    const data = {
                        messaging_product: "whatsapp",
                        to: participant.phone,
                        type: "template",
                        template: {
                            name: "message_annonce",
                            language: {
                                code: "fr"
                            }
                        }
                    };

                    const config = {
                        method: 'post',
                        maxBodyLength: Infinity,
                        url: 'https://graph.facebook.com/v16.0/230630080143527/messages',
                        headers: { 
                            'Content-Type': 'application/json', 
                            'Authorization': 'Bearer EAALOqv96b5kBOyZBK9MAZCF7Ev63btHib6DKyOTudKXvNYFkZBDdYZA6LDE6nssXrTZCEkdLP3hZBRLky3LS4SC5ZByFOtTzXNBVac4SKZCQPIug7YksXgiyeDZAqvGkcusMzz1cDjPPKXNkoVvQ8wrEZA4veGrRIyStcKg7a0MxBD1TE1DRCW76VLJikBEb9DLa8RQYhhKtkn4GWdduA8'
                        },
                        data: data
                    };

                    const response = await axios.request(config);
                    console.log('WhatsApp API Response:', JSON.stringify(response.data, null, 2));
                } catch (whatsappError) {
                    console.error('Error sending WhatsApp message:', whatsappError.response?.data || whatsappError.message);
                }
            }
        }

        res.status(201).json({
            success: true,
            data: conversation
        });
    } catch (error) {
        console.error('Error in createConversation:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création de la conversation',
            error: error.message
        });
    }
};

exports.getConversations = async (req, res) => {
    try {
        const conversations = await Conversation.find({
            participants: req.user._id
        })
            .populate('participants', 'firstName lastName email phone')
            .sort({ 'lastMessage.timestamp': -1 });

        res.status(200).json({
            success: true,
            data: conversations
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des conversations',
            error: error.message
        });
    }
};

exports.getConversationById = async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.id)
            .populate('participants', 'firstName lastName email phone');

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Conversation non trouvée'
            });
        }

        // Vérifier si l'utilisateur est un participant
        if (!conversation.participants.some(p => p._id.toString() === req.user._id.toString())) {
            return res.status(403).json({
                success: false,
                message: 'Non autorisé à accéder à cette conversation'
            });
        }

        res.status(200).json({
            success: true,
            data: conversation
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de la conversation',
            error: error.message
        });
    }
};

exports.sendMessage = async (req, res) => {
    try {
        const { content, type, attachments } = req.body;
        const conversation = await Conversation.findById(req.params.id);

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Conversation non trouvée'
            });
        }

        // Vérifier si l'utilisateur est un participant
        if (!conversation.participants.includes(req.user._id)) {
            return res.status(403).json({
                success: false,
                message: 'Non autorisé à envoyer un message dans cette conversation'
            });
        }

        const message = new Message({
            conversation: conversation._id,
            sender: req.user._id,
            content,
            type,
            attachments
        });

        await message.save();

        // Mettre à jour la conversation
        conversation.lastMessage = {
            content,
            sender: req.user._id,
            timestamp: new Date()
        };
        
        // Réinitialiser le compteur de messages non lus pour l'expéditeur
        conversation.unreadCount.set(req.user._id.toString(), 0);
        
        // Incrémenter le compteur pour les autres participants
        conversation.participants.forEach(participantId => {
            if (participantId.toString() !== req.user._id.toString()) {
                const currentCount = conversation.unreadCount.get(participantId.toString()) || 0;
                conversation.unreadCount.set(participantId.toString(), currentCount + 1);
            }
        });

        await conversation.save();

        // Envoyer des notifications WhatsApp si configuré
        const recipients = await User.find({
            _id: { 
                $in: conversation.participants,
                $ne: req.user._id
            },
            whatsappNumber: { $exists: true }
        });

        for (const recipient of recipients) {
            // Implémenter l'envoi de notification WhatsApp
        }

        res.status(201).json({
            success: true,
            data: message
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'envoi du message',
            error: error.message
        });
    }
};

exports.getMessages = async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.id);

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Conversation non trouvée'
            });
        }

        // Vérifier si l'utilisateur est un participant
        if (!conversation.participants.includes(req.user._id)) {
            return res.status(403).json({
                success: false,
                message: 'Non autorisé à voir les messages de cette conversation'
            });
        }

        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 50;
        const skip = (page - 1) * limit;

        const messages = await Message.find({ conversation: req.params.id })
            .populate('sender', 'firstName lastName email phone')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Marquer les messages comme lus
        await Message.updateMany(
            {
                conversation: req.params.id,
                'readBy.user': { $ne: req.user._id }
            },
            {
                $push: {
                    readBy: {
                        user: req.user._id,
                        readAt: new Date()
                    }
                }
            }
        );

        // Réinitialiser le compteur de messages non lus
        conversation.unreadCount.set(req.user._id.toString(), 0);
        await conversation.save();

        res.status(200).json({
            success: true,
            data: messages.reverse() // Renvoyer dans l'ordre chronologique
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des messages',
            error: error.message
        });
    }
};

exports.getMessageById = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id)
            .populate('sender', 'firstName lastName email phone')
            .populate('receiver', 'firstName lastName email phone');

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message non trouvé'
            });
        }

        // Vérifier si l'utilisateur est autorisé à voir ce message
        if (message.sender.toString() !== req.user._id.toString() && 
            message.receiver.toString() !== req.user._id.toString() && 
            req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Non autorisé à voir ce message'
            });
        }

        res.status(200).json({
            success: true,
            data: message
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du message',
            error: error.message
        });
    }
};

exports.deleteMessage = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message non trouvé'
            });
        }

        // Vérifier si l'utilisateur est autorisé à supprimer ce message
        if (message.sender.toString() !== req.user._id.toString() && 
            req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Non autorisé à supprimer ce message'
            });
        }

        await message.remove();

        res.status(200).json({
            success: true,
            message: 'Message supprimé avec succès'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression du message',
            error: error.message
        });
    }
};
