const Transaction = require('../models/transaction.model');
const Apartment = require('../models/apartment.model');
const User = require('../models/user.model');
const RentBook = require('../models/rentBook.model');
const { generateReceiptNumber } = require('../utils/receiptGenerator');
const axios = require('axios');

/**
 * @swagger
 * components:
 *   schemas:
 *     TransactionResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             transactions:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Transaction'
 *             sommeLoyerUSD:
 *               type: number
 *               description: Somme totale des loyers en USD
 *             sommeLoyerCDF:
 *               type: number
 *               description: Somme totale des loyers en CDF
 *             sommeFactureUSD:
 *               type: number
 *               description: Somme totale des factures en USD
 *             sommeFactureCDF:
 *               type: number
 *               description: Somme totale des factures en CDF
 *             sommesComplete:
 *               type: object
 *               properties:
 *                 sommeLoyerUSD:
 *                   type: number
 *                   description: Somme totale des loyers en USD pour les transactions complétées
 *                 sommeLoyerCDF:
 *                   type: number
 *                   description: Somme totale des loyers en CDF pour les transactions complétées
 *                 sommeFactureUSD:
 *                   type: number
 *                   description: Somme totale des factures en USD pour les transactions complétées
 *                 sommeFactureCDF:
 *                   type: number
 *                   description: Somme totale des factures en CDF pour les transactions complétées
 *             pagination:
 *               type: object
 *               properties:
 *                 total:
 *                   type: number
 *                 page:
 *                   type: number
 *                 pages:
 *                   type: number
 *                 limit:
 *                   type: number
 */

// Fonction utilitaire pour vérifier le statut
const verifyPaymentStatus = async (orderNumber) => {
    try {
        const response = await axios.get(`https://backend.flexpay.cd/api/rest/v1/check/${orderNumber}`, {
            headers: {
                'Authorization': `Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJcL2xvZ2luIiwicm9sZXMiOlsiTUVSQ0hBTlQiXSwiZXhwIjoxODA1OTg0NzU1LCJzdWIiOiIwMWRmMTkxNTdiNzA3NTY2NWY0YmJhNTBlYmU3NTMyZiJ9.z3d6avQpsKbAMAdvnUAeNsjgqnr_K4-O05CkeFqVXng`
            }
        });

        if (response.data.code === '0') {
            const transaction = await Transaction.findOne({
                'paymentMethod.providerResponse.orderNumber': orderNumber
            });

            if (transaction) {
                transaction.status = 'complete';
                transaction.paymentMethod.status = 'completed';
                transaction.paymentMethod.providerResponse = response.data;

                await transaction.save();

                // Mettre à jour l'appartement si c'est un paiement de loyer
                if (transaction.type === 'loyer') {
                    const apartment = await Apartment.findById(transaction.apartmentId);
                    if (apartment) {
                        apartment.lastPaymentDate = new Date();
                        apartment.nextPaymentDate = new Date(apartment.lastPaymentDate);
                        apartment.nextPaymentDate.setMonth(apartment.nextPaymentDate.getMonth() + 1);
                        await apartment.save();
                    }
                }

                // Envoyer une notification au propriétaire
                const landlord = await User.findById(transaction.landlord);
                if (landlord.whatsappNumber) {
                    // Implémenter l'envoi de notification WhatsApp
                }
            }
        }
    } catch (error) {
        console.error('Erreur lors de la vérification automatique:', error);
    }
};

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

        // Ne plus mettre à jour le RentBook lors de la création d'une transaction
        // Les paiements ne seront ajoutés que lors de la vérification (checkTransaction)
        
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

        // Calculer les sommes des loyers et factures par devise
        const aggregationResult = await Transaction.aggregate([
            { $match: query },
            {
                $group: {
                    _id: {
                        currency: '$amount.currency',
                        type: '$type',
                        status: '$status'
                    },
                    total: { $sum: '$amount.value' }
                }
            }
        ]);

        // Initialiser les sommes à 0
        let sommeLoyerUSD = 0;
        let sommeLoyerCDF = 0;
        let sommeFactureUSD = 0;
        let sommeFactureCDF = 0;
        let sommeLoyerUSDComplete = 0;
        let sommeLoyerCDFComplete = 0;
        let sommeFactureUSDComplete = 0;
        let sommeFactureCDFComplete = 0;

        // Assigner les sommes selon la devise et le type
        aggregationResult.forEach(result => {
            const isComplete = result._id.status === 'complete';
            if (result._id.currency === 'USD') {
                if (result._id.type === 'loyer') {
                    sommeLoyerUSD += result.total;
                    if (isComplete) {
                        sommeLoyerUSDComplete += result.total;
                    }
                } else if (result._id.type === 'facture') {
                    sommeFactureUSD += result.total;
                    if (isComplete) {
                        sommeFactureUSDComplete += result.total;
                    }
                }
            } else if (result._id.currency === 'CDF') {
                if (result._id.type === 'loyer') {
                    sommeLoyerCDF += result.total;
                    if (isComplete) {
                        sommeLoyerCDFComplete += result.total;
                    }
                } else if (result._id.type === 'facture') {
                    sommeFactureCDF += result.total;
                    if (isComplete) {
                        sommeFactureCDFComplete += result.total;
                    }
                }
            }
        });

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
            count: transactions.length,
            total,
            pages,
            currentPage: page,
            sommeLoyerUSD,
            sommeLoyerCDF,
            sommeFactureUSD,
            sommeFactureCDF,
            sommesComplete: {
                sommeLoyerUSD: sommeLoyerUSDComplete,
                sommeLoyerCDF: sommeLoyerCDFComplete,
                sommeFactureUSD: sommeFactureUSDComplete,
                sommeFactureCDF: sommeFactureCDFComplete
            },
            data: transactions
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des transactions:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des transactions',
            error: error.message
        });
    }
};

exports.getAllTransactions = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = {};
        if (req.query.status) {
            query.status = req.query.status;
        }

        if (req.query.type) {
            query.type = req.query.type;
        }

        // Get total count for pagination
        const total = await Transaction.countDocuments(query);
        const pages = Math.ceil(total / limit);

        // Calculer les sommes des loyers et factures par devise
        const aggregationResult = await Transaction.aggregate([
            { $match: query },
            {
                $group: {
                    _id: {
                        currency: '$amount.currency',
                        type: '$type',
                        status: '$status'
                    },
                    total: { $sum: '$amount.value' }
                }
            }
        ]);

        // Initialiser les sommes à 0
        let sommeLoyerUSD = 0;
        let sommeLoyerCDF = 0;
        let sommeFactureUSD = 0;
        let sommeFactureCDF = 0;
        let sommeLoyerUSDComplete = 0;
        let sommeLoyerCDFComplete = 0;
        let sommeFactureUSDComplete = 0;
        let sommeFactureCDFComplete = 0;

        // Assigner les sommes selon la devise et le type
        aggregationResult.forEach(result => {
            const isComplete = result._id.status === 'complete';
            if (result._id.currency === 'USD') {
                if (result._id.type === 'loyer') {
                    sommeLoyerUSD += result.total;
                    if (isComplete) {
                        sommeLoyerUSDComplete += result.total;
                    }
                } else if (result._id.type === 'facture') {
                    sommeFactureUSD += result.total;
                    if (isComplete) {
                        sommeFactureUSDComplete += result.total;
                    }
                }
            } else if (result._id.currency === 'CDF') {
                if (result._id.type === 'loyer') {
                    sommeLoyerCDF += result.total;
                    if (isComplete) {
                        sommeLoyerCDFComplete += result.total;
                    }
                } else if (result._id.type === 'facture') {
                    sommeFactureCDF += result.total;
                    if (isComplete) {
                        sommeFactureCDFComplete += result.total;
                    }
                }
            }
        });

        // Get transactions with pagination
        const transactions = await Transaction.find(query)
            .populate('tenant', 'firstName lastName email phone')
            .populate('landlord', 'firstName lastName email phone')
            .populate('apartmentId', 'number type')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            success: true,
            count: transactions.length,
            total,
            pages,
            currentPage: page,
            sommeLoyerUSD,
            sommeLoyerCDF,
            sommeFactureUSD,
            sommeFactureCDF,
            sommesComplete: {
                sommeLoyerUSD: sommeLoyerUSDComplete,
                sommeLoyerCDF: sommeLoyerCDFComplete,
                sommeFactureUSD: sommeFactureUSDComplete,
                sommeFactureCDF: sommeFactureCDFComplete
            },
            data: transactions
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des transactions:', error);
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

exports.checkTransaction = async (req, res) => {
    try {
        const { orderNumber } = req.params;
        console.log('Recherche de transaction avec orderNumber:', orderNumber);
        
        // Chercher la transaction avec l'orderNumber dans providerResponse
        const transaction = await Transaction.findOne({
            'paymentMethod.providerResponse.orderNumber': orderNumber
        });

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction non trouvée'
            });
        }

        console.log('Transaction trouvée:', JSON.stringify(transaction, null, 2));

        // Vérifier si la transaction est déjà complétée
        if (transaction.status === 'complete') {
            return res.status(200).json({
                success: true,
                message: 'La transaction a déjà été traitée avec succès',
                data: transaction
            });
        }

        // Faire la requête à l'API FlexPay pour vérifier le statut
        console.log('Vérification avec FlexPay API pour orderNumber:', orderNumber);
        const response = await axios.get(`https://backend.flexpay.cd/api/rest/v1/check/${orderNumber}`, {
            headers: {
                'Authorization': `Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJcL2xvZ2luIiwicm9sZXMiOlsiTUVSQ0hBTlQiXSwiZXhwIjoxODA1OTg0NzU1LCJzdWIiOiIwMWRmMTkxNTdiNzA3NTY2NWY0YmJhNTBlYmU3NTMyZiJ9.z3d6avQpsKbAMAdvnUAeNsjgqnr_K4-O05CkeFqVXng`
            }
        });

        const flexPayResponse = response.data;
        console.log('Réponse FlexPay:', JSON.stringify(flexPayResponse, null, 2));

        // Si le paiement est réussi (code = 0)
        if (flexPayResponse.code === '0') {
            // Mettre à jour la transaction
            transaction.status = 'complete';
            transaction.paymentMethod.status = 'completed';
            transaction.paymentMethod.providerResponse = flexPayResponse;

            await transaction.save();
            console.log('Transaction mise à jour avec succès:', transaction._id);

            // Mettre à jour le statut du paiement de l'appartement
            if (transaction.type === 'loyer') {
                const apartment = await Apartment.findById(transaction.apartmentId);
                if (apartment) {
                    apartment.lastPaymentDate = new Date();
                    apartment.nextPaymentDate = new Date(apartment.lastPaymentDate);
                    apartment.nextPaymentDate.setMonth(apartment.nextPaymentDate.getMonth() + 1);
                    await apartment.save();
                }
                
                // Vérifier si c'est un paiement de facture d'utilité (via les métadonnées)
                if (transaction.metadata && transaction.metadata.isUtilityPayment === true && transaction.metadata.utilityBillId) {
                    try {
                        console.log('Paiement de facture d\'utilité détecté, ID de facture:', transaction.metadata.utilityBillId);
                        
                        // Effectuer la requête pour marquer la facture comme payée
                        const axios = require('axios');
                        const utilityBillId = transaction.metadata.utilityBillId;
                        
                        // Obtenir un token admin ou propriétaire pour l'authentification
                        // Dans un environnement de production, vous devriez utiliser un token de service
                        // Pour cet exemple, nous utiliserons une approche directe
                        const UtilityBill = require('../models/utility-bill.model');
                        
                        // Trouver et mettre à jour la facture directement
                        const utilityBill = await UtilityBill.findById(utilityBillId);
                        if (utilityBill && !utilityBill.isPaid) {
                            utilityBill.isPaid = true;
                            utilityBill.paidDate = new Date();
                            
                            // Marquer la distribution spécifique à cet appartement comme payée
                            if (utilityBill.distributionDetails && utilityBill.distributionDetails.length > 0) {
                                utilityBill.distributionDetails.forEach(detail => {
                                    if (detail.apartmentId && detail.apartmentId.toString() === transaction.apartmentId.toString()) {
                                        detail.isPaid = true;
                                    }
                                });
                            }
                            
                            await utilityBill.save();
                            console.log(`Facture d'utilité ${utilityBillId} marquée comme payée suite à la transaction ${transaction._id}`);
                        } else if (utilityBill && utilityBill.isPaid) {
                            console.log(`Facture d'utilité ${utilityBillId} déjà marquée comme payée`);
                        } else {
                            console.error(`Facture d'utilité ${utilityBillId} non trouvée`);
                        }
                    } catch (error) {
                        console.error('Erreur lors de la mise à jour de la facture d\'utilité:', error);
                        // Ne pas faire échouer la transaction principale
                    }
                }
                
                // Mettre à jour l'historique des paiements du RentBook
                try {
                    console.log('Recherche du RentBook pour ajouter le paiement, transaction:', transaction._id);
                    
                    // Rechercher le RentBook correspondant à cette transaction
                    let rentBook = await RentBook.findOne({
                        apartmentId: transaction.apartmentId,
                        tenantId: transaction.tenant,
                        status: 'actif'
                    });
                    
                    console.log('Premier essai de recherche RentBook:', rentBook ? rentBook._id : 'Non trouvé');
                    
                    // Si pas trouvé, essayer avec seulement l'ID de l'appartement
                    if (!rentBook) {
                        console.log('Deuxième essai avec seulement apartmentId:', transaction.apartmentId);
                        rentBook = await RentBook.findOne({
                            apartmentId: transaction.apartmentId,
                            status: 'actif'
                        });
                        console.log('Résultat deuxième essai:', rentBook ? rentBook._id : 'Non trouvé');
                    }
                    
                    // Si un RentBook est trouvé, mettre à jour son historique de paiements
                    if (rentBook) {
                        console.log('RentBook trouvé, ajout du paiement à l\'historique:', rentBook._id);
                        
                        // Déterminer le statut du paiement
                        let status = 'payé';
                        const txStatus = transaction.paymentMethod?.providerResponse?.transaction?.status;
                        
                        if (txStatus === '1') {
                            status = 'impayé';
                            console.log('Transaction marquée comme impayée selon le provider');
                        } else if (transaction.amount && transaction.amount.value < rentBook.monthlyRent) {
                            status = 'partiel';
                            console.log('Paiement partiel détecté');
                        }
                        
                        // Créer l'objet du nouveau paiement
                        const receiptNumber = transaction.metadata?.receiptNumber || `TRANS-${transaction._id.toString().substr(-6)}`;
                        const newPayment = {
                            date: new Date(),
                            amount: transaction.amount?.value || 0,
                            paymentMethod: transaction.paymentMethod?.type || 'mobile_money',
                            status: status,
                            reference: receiptNumber,
                            comment: `Paiement via ${transaction.paymentMethod?.type || 'mobile_money'} - Transaction vérifiée #${receiptNumber}`
                        };
                        
                        console.log('Nouveau paiement à ajouter:', JSON.stringify(newPayment));
                        
                        // S'assurer que paymentHistory existe
                        if (!rentBook.paymentHistory) {
                            rentBook.paymentHistory = [];
                            console.log('Initialisation d\'un tableau vide pour paymentHistory');
                        }
                        
                        // Vérifier si un paiement avec cette référence existe déjà
                        const paymentExists = rentBook.paymentHistory.some(
                            payment => payment.reference === receiptNumber
                        );
                        
                        // Ajouter le paiement uniquement s'il n'existe pas déjà
                        if (!paymentExists) {
                            rentBook.paymentHistory.push(newPayment);
                            rentBook.markModified('paymentHistory');
                            await rentBook.save();
                            console.log('Carnet de loyer mis à jour avec succès');
                        } else {
                            console.log('Ce paiement existe déjà dans l\'historique, référence:', receiptNumber);
                        }
                    } else {
                        console.error('ERREUR: Aucun RentBook trouvé pour cette transaction');
                    }
                } catch (error) {
                    console.error('Erreur lors de la mise à jour du RentBook:', error);
                    // Ne pas faire échouer la transaction principale
                }
            }
            // Traitement spécifique pour les factures d'utilité
            else if (transaction.type === 'facture') {
                console.log('Paiement de type facture détecté, ID de transaction:', transaction._id);
                
                // Vérifier si les métadonnées contiennent l'ID de la facture
                if (transaction.metadata && transaction.metadata.utilityBillId) {
                    try {
                        const utilityBillId = transaction.metadata.utilityBillId;
                        console.log('ID de facture trouvé dans les métadonnées:', utilityBillId);
                        
                        // Trouver et mettre à jour la facture
                        const UtilityBill = require('../models/utility-bill.model');
                        const utilityBill = await UtilityBill.findById(utilityBillId);
                        
                        if (utilityBill && !utilityBill.isPaid) {
                            utilityBill.isPaid = true;
                            utilityBill.paidDate = new Date();
                            
                            // Marquer la distribution spécifique à cet appartement comme payée
                            if (utilityBill.distributionDetails && utilityBill.distributionDetails.length > 0) {
                                utilityBill.distributionDetails.forEach(detail => {
                                    if (detail.apartmentId && detail.apartmentId.toString() === transaction.apartmentId.toString()) {
                                        detail.isPaid = true;
                                    }
                                });
                            }
                            
                            await utilityBill.save();
                            console.log(`Facture d'utilité ${utilityBillId} marquée comme payée suite à la transaction de type 'facture'`);
                        } else if (utilityBill && utilityBill.isPaid) {
                            console.log(`Facture d'utilité ${utilityBillId} déjà marquée comme payée`);
                        } else {
                            console.error(`Facture d'utilité ${utilityBillId} non trouvée`);
                        }
                    } catch (error) {
                        console.error('Erreur lors de la mise à jour de la facture d\'utilité:', error);
                    }
                } else {
                    console.error('Aucun ID de facture trouvé dans les métadonnées de la transaction');
                }
            }

            // Envoyer une notification au propriétaire
            const landlord = await User.findById(transaction.landlord);
            if (landlord.whatsappNumber) {
                // Implémenter l'envoi de notification WhatsApp
            }

            return res.status(200).json({
                success: true,
                message: 'Transaction complétée avec succès',
                data: transaction
            });
        }

        // Si le paiement n'est pas réussi
        return res.status(200).json({
            success: false,
            message: 'La transaction est en attente ou a échoué',
            data: {
                status: flexPayResponse.code,
                message: flexPayResponse.message
            }
        });

    } catch (error) {
        console.error('Erreur lors de la vérification de la transaction:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur lors de la vérification de la transaction',
            error: error.message
        });
    }
};

exports.initiatePayment = async (req, res) => {
    try {
        // ... votre code d'initialisation existant ...

        // Après avoir obtenu la réponse de FlexPay et créé la transaction
        const orderNumber = flexPayResponse.orderNumber; // ou là où vous stockez l'orderNumber

        // Planifier la vérification après 5 minutes
        setTimeout(() => {
            verifyPaymentStatus(orderNumber);
        }, 5 * 60 * 1000); // 5 minutes en millisecondes

        // Retourner la réponse normale
        return res.status(200).json({
            success: true,
            message: 'Paiement initié avec succès',
            data: {
                orderNumber,
                // ... autres données ...
            }
        });

    } catch (error) {
        console.error('Erreur lors de l\'initialisation du paiement:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'initialisation du paiement',
            error: error.message
        });
    }
};
