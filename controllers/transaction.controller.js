const Transaction = require('../models/transaction.model');
const Apartment = require('../models/apartment.model');
const User = require('../models/user.model');
const { generateReceiptNumber } = require('../utils/receiptGenerator');

exports.createTransaction = async (req, res) => {
    try {
        const apartment = await Apartment.findById(req.body.apartmentId)
            .populate('buildingId');

        if (!apartment) {
            return res.status(404).json({
                success: false,
                message: 'Appartement non trouvé'
            });
        }

        // Vérifier si l'utilisateur est le locataire
        if (apartment.currentTenant.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Non autorisé à créer une transaction pour cet appartement'
            });
        }

        // Générer un numéro de reçu unique
        const receiptNumber = generateReceiptNumber();
        
        const transaction = new Transaction({
            ...req.body,
            tenant: req.user._id,
            landlord: apartment.buildingId.owner,
            metadata: {
                ...req.body.metadata,
                receiptNumber: receiptNumber
            }
        });

        await transaction.save();

        // Envoyer une notification au propriétaire
        const landlord = await User.findById(apartment.buildingId.owner);
        if (landlord.whatsappNumber) {
            // Implémenter l'envoi de notification WhatsApp
        }

        res.status(201).json({
            success: true,
            data: transaction
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création de la transaction',
            error: error.message
        });
    }
};

exports.getTransactions = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Build query based on user role and filters
        const query = {};
        if (req.user.role === 'locataire') {
            query.tenant = req.user._id;
        } else if (req.user.role === 'proprietaire') {
            query.landlord = req.user._id;
        }

        if (req.query.status) {
            query.status = req.query.status;
        }

        if (req.query.type) {
            query.type = req.query.type;
        }

        // Get total count for pagination
        const total = await Transaction.countDocuments(query);
        const pages = Math.ceil(total / limit);

        // Get transactions with pagination
        const transactions = await Transaction.find(query)
            .populate('tenant', 'firstName lastName email')
            .populate('landlord', 'firstName lastName email')
            .populate('apartmentId')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            success: true,
            data: transactions,
            pagination: {
                total,
                page,
                pages
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des transactions',
            error: error.message
        });
    }
};

exports.getAllTransactions = async (req, res) => {
    try {
        const query = {};

        // Filtres selon le rôle de l'utilisateur
        if (req.user.role === 'locataire') {
            query.tenant = req.user._id;
        } else if (req.user.role === 'proprietaire') {
            query.landlord = req.user._id;
        }

        if (req.query.status) query.status = req.query.status;
        if (req.query.type) query.type = req.query.type;
        if (req.query.startDate) {
            query.createdAt = { $gte: new Date(req.query.startDate) };
        }
        if (req.query.endDate) {
            query.createdAt = {
                ...query.createdAt,
                $lte: new Date(req.query.endDate)
            };
        }

        // Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;

        const transactions = await Transaction.find(query)
            .populate('apartmentId', 'number type')
            .populate('tenant', 'firstName lastName email phone')
            .populate('landlord', 'firstName lastName email phone')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await Transaction.countDocuments(query);

        res.status(200).json({
            success: true,
            count: transactions.length,
            total,
            pages: Math.ceil(total / limit),
            currentPage: page,
            data: transactions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des transactions',
            error: error.message
        });
    }
};

exports.getTransactionById = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id)
            .populate('apartmentId', 'number type buildingId')
            .populate('tenant', 'firstName lastName email phone')
            .populate('landlord', 'firstName lastName email phone');

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction non trouvée'
            });
        }

        // Vérifier les autorisations
        if (![transaction.tenant.toString(), transaction.landlord.toString()].includes(req.user._id.toString())) {
            return res.status(403).json({
                success: false,
                message: 'Non autorisé à voir cette transaction'
            });
        }

        res.status(200).json({
            success: true,
            data: transaction
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de la transaction',
            error: error.message
        });
    }
};

exports.updateTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction non trouvée'
            });
        }

        // Vérifier si l'utilisateur est autorisé à modifier la transaction
        if (transaction.landlord.toString() !== req.user._id.toString() && 
            req.user.role !== 'admin' && 
            req.user.role !== 'agent') {
            return res.status(403).json({
                success: false,
                message: 'Non autorisé à modifier cette transaction'
            });
        }

        const updatedTransaction = await Transaction.findByIdAndUpdate(
            req.params.id,
            { ...req.body },
            { new: true, runValidators: true }
        )
        .populate('tenant', 'firstName lastName email')
        .populate('landlord', 'firstName lastName email')
        .populate('apartmentId');

        res.status(200).json({
            success: true,
            data: updatedTransaction
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour de la transaction',
            error: error.message
        });
    }
};

exports.updateTransactionStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const transaction = await Transaction.findById(req.params.id);

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction non trouvée'
            });
        }

        // Seul le propriétaire peut mettre à jour le statut
        if (transaction.landlord.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Non autorisé à modifier cette transaction'
            });
        }

        transaction.status = status;
        await transaction.save();

        // Envoyer une notification au locataire
        const tenant = await User.findById(transaction.tenant);
        if (tenant.whatsappNumber) {
            // Implémenter l'envoi de notification WhatsApp
        }

        res.status(200).json({
            success: true,
            data: transaction
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour de la transaction',
            error: error.message
        });
    }
};

exports.validateTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id)
            .populate({
                path: 'apartmentId',
                populate: {
                    path: 'buildingId',
                    select: 'owner'
                }
            });

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction non trouvée'
            });
        }

        // Vérifier que l'utilisateur est le propriétaire de l'appartement
        if (transaction.apartmentId.buildingId.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Non autorisé à valider cette transaction'
            });
        }

        // Vérifier que la transaction est en attente
        if (transaction.status !== 'en_attente') {
            return res.status(400).json({
                success: false,
                message: 'Cette transaction ne peut pas être validée'
            });
        }

        // Mettre à jour le statut de la transaction
        transaction.status = 'validee';
        transaction.validatedAt = new Date();
        transaction.validatedBy = req.user._id;
        await transaction.save();

        // Envoyer une notification au locataire
        const tenant = await User.findById(transaction.tenant);
        if (tenant.whatsappNumber) {
            // Implémenter l'envoi de notification WhatsApp
        }

        res.status(200).json({
            success: true,
            message: 'Transaction validée avec succès',
            data: transaction
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la validation de la transaction',
            error: error.message
        });
    }
};

exports.rejectTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id)
            .populate({
                path: 'apartmentId',
                populate: {
                    path: 'buildingId',
                    select: 'owner'
                }
            });

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction non trouvée'
            });
        }

        // Vérifier que l'utilisateur est le propriétaire de l'appartement
        if (transaction.apartmentId.buildingId.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Non autorisé à rejeter cette transaction'
            });
        }

        // Vérifier que la transaction est en attente
        if (transaction.status !== 'en_attente') {
            return res.status(400).json({
                success: false,
                message: 'Cette transaction ne peut pas être rejetée'
            });
        }

        // Mettre à jour le statut de la transaction
        transaction.status = 'rejetee';
        transaction.rejectedAt = new Date();
        transaction.rejectedBy = req.user._id;
        transaction.rejectionReason = req.body.reason || 'Aucune raison fournie';
        await transaction.save();

        // Envoyer une notification au locataire
        const tenant = await User.findById(transaction.tenant);
        if (tenant.whatsappNumber) {
            // Implémenter l'envoi de notification WhatsApp
        }

        res.status(200).json({
            success: true,
            message: 'Transaction rejetée avec succès',
            data: transaction
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors du rejet de la transaction',
            error: error.message
        });
    }
};

exports.getTransactionStats = async (req, res) => {
    try {
        const userId = req.user._id;
        const role = req.user.role;
        const query = role === 'locataire' ? { tenant: userId } : { landlord: userId };

        const stats = await Transaction.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount.value' }
                }
            }
        ]);

        const monthlyStats = await Transaction.aggregate([
            { $match: query },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount.value' }
                }
            },
            { $sort: { '_id.year': -1, '_id.month': -1 } },
            { $limit: 12 }
        ]);

        res.status(200).json({
            success: true,
            data: {
                statusStats: stats,
                monthlyStats
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des statistiques',
            error: error.message
        });
    }
};
