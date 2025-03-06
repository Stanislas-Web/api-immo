const RentBook = require('../models/rentBook.model');
const Apartment = require('../models/apartment.model');
const User = require('../models/user.model');
const mongoose = require('mongoose');

// Créer un nouveau carnet de loyer
exports.createRentBook = async (req, res) => {
    try {
        const { apartmentId, tenantId, leaseStartDate, leaseEndDate, monthlyRent, securityDeposit } = req.body;

        // Vérifier si l'appartement existe
        const apartment = await Apartment.findById(apartmentId).populate('buildingId');
        if (!apartment) {
            return res.status(404).json({
                success: false,
                message: 'Appartement non trouvé'
            });
        }

        // Vérifier si l'utilisateur est le propriétaire de l'appartement (via le bâtiment)
        if (!apartment.buildingId || apartment.buildingId.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Non autorisé à créer un carnet de loyer pour cet appartement'
            });
        }

        // Vérifier si l'appartement est disponible
        if (apartment.status !== 'disponible' && apartment.status !== 'réservé') {
            return res.status(400).json({
                success: false,
                message: 'Appartement non disponible pour la location'
            });
        }

        // Vérifier si le locataire existe et a le rôle de locataire
        const tenant = await User.findById(tenantId);
        if (!tenant || tenant.role !== 'locataire') {
            return res.status(400).json({
                success: false,
                message: 'Locataire invalide'
            });
        }

        // Créer le carnet de loyer
        const rentBook = new RentBook({
            apartmentId,
            tenantId,
            ownerId: req.user._id,
            leaseStartDate,
            leaseEndDate, // Sera undefined si non fourni
            monthlyRent,
            securityDeposit,
            status: 'actif'
        });

        await rentBook.save();

        // Mettre à jour l'appartement
        apartment.currentTenant = tenantId;
        apartment.status = 'loué';
        apartment.leaseHistory.push({
            tenant: tenantId,
            startDate: leaseStartDate,
            endDate: leaseEndDate, // Sera undefined si non fourni
            monthlyRent,
            status: 'actif'
        });

        await apartment.save();

        res.status(201).json({
            success: true,
            message: 'Carnet de loyer créé avec succès',
            data: rentBook
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création du carnet de loyer',
            error: error.message
        });
    }
};

// Obtenir tous les carnets de loyer (admin)
exports.getAllRentBooks = async (req, res) => {
    try {
        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Filtres
        const filter = {};
        if (req.query.status) filter.status = req.query.status;
        if (req.query.apartmentId) filter.apartmentId = req.query.apartmentId;
        if (req.query.tenantId) filter.tenantId = req.query.tenantId;
        if (req.query.ownerId) filter.ownerId = req.query.ownerId;

        // Requête
        const rentBooks = await RentBook.find(filter)
            .skip(skip)
            .limit(limit)
            .populate({
                path: 'apartmentId',
                populate: {
                    path: 'buildingId',
                    select: 'name address'
                }
            })
            .populate('tenantId', 'firstName lastName phone email')
            .populate('ownerId', 'firstName lastName phone email');

        // Nombre total pour la pagination
        const total = await RentBook.countDocuments(filter);

        res.status(200).json({
            success: true,
            count: rentBooks.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            data: rentBooks
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des carnets de loyer',
            error: error.message
        });
    }
};

// Obtenir les carnets de loyer d'un propriétaire
exports.getOwnerRentBooks = async (req, res) => {
    try {
        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Filtres
        const filter = { ownerId: req.user._id };
        if (req.query.status) filter.status = req.query.status;
        if (req.query.apartmentId) filter.apartmentId = req.query.apartmentId;
        if (req.query.tenantId) filter.tenantId = req.query.tenantId;

        // Requête
        const rentBooks = await RentBook.find(filter)
            .skip(skip)
            .limit(limit)
            .populate({
                path: 'apartmentId',
                populate: {
                    path: 'buildingId',
                    select: 'name address'
                }
            })
            .populate('tenantId', 'firstName lastName phone email')
            .populate('ownerId', 'firstName lastName phone email');

        // Nombre total pour la pagination
        const total = await RentBook.countDocuments(filter);

        res.status(200).json({
            success: true,
            count: rentBooks.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            data: rentBooks
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des carnets de loyer',
            error: error.message
        });
    }
};

// Obtenir les carnets de loyer d'un locataire
exports.getTenantRentBooks = async (req, res) => {
    try {
        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Filtres
        const filter = { tenantId: req.user._id };
        if (req.query.status) filter.status = req.query.status;
        if (req.query.apartmentId) filter.apartmentId = req.query.apartmentId;

        // Requête
        const rentBooks = await RentBook.find(filter)
            .skip(skip)
            .limit(limit)
            .populate({
                path: 'apartmentId',
                populate: {
                    path: 'buildingId',
                    select: 'name address'
                }
            })
            .populate('tenantId', 'firstName lastName phone email')
            .populate('ownerId', 'firstName lastName phone email');

        // Nombre total pour la pagination
        const total = await RentBook.countDocuments(filter);

        res.status(200).json({
            success: true,
            count: rentBooks.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            data: rentBooks
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des carnets de loyer',
            error: error.message
        });
    }
};

// Obtenir un carnet de loyer par ID
exports.getRentBookById = async (req, res) => {
    try {
        const rentBook = await RentBook.findById(req.params.id)
            .populate({
                path: 'apartmentId',
                populate: {
                    path: 'buildingId',
                    select: 'name address'
                }
            })
            .populate('tenantId', 'firstName lastName phone email')
            .populate('ownerId', 'firstName lastName phone email');

        if (!rentBook) {
            return res.status(404).json({
                success: false,
                message: 'Carnet de loyer non trouvé'
            });
        }

        // Vérifier les autorisations
        if (
            req.user.role !== 'admin' &&
            rentBook.ownerId._id.toString() !== req.user._id.toString() &&
            rentBook.tenantId._id.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: 'Non autorisé à accéder à ce carnet de loyer'
            });
        }

        res.status(200).json({
            success: true,
            data: rentBook
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du carnet de loyer',
            error: error.message
        });
    }
};

// Ajouter un paiement au carnet de loyer
exports.addPayment = async (req, res) => {
    try {
        const { amount, paymentMethod, reference, comment } = req.body;
        const rentBook = await RentBook.findById(req.params.id);

        if (!rentBook) {
            return res.status(404).json({
                success: false,
                message: 'Carnet de loyer non trouvé'
            });
        }

        // Déterminer le statut du paiement
        let status = 'payé';
        if (amount < rentBook.monthlyRent) {
            status = 'partiel';
        }

        // Ajouter le paiement
        rentBook.paymentHistory.push({
            date: new Date(),
            amount,
            paymentMethod,
            status,
            reference,
            comment
        });

        await rentBook.save();

        res.status(200).json({
            success: true,
            message: 'Paiement ajouté avec succès',
            data: rentBook
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'ajout du paiement',
            error: error.message
        });
    }
};

// Mettre à jour le statut d'un carnet de loyer
exports.updateRentBookStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const rentBook = await RentBook.findById(req.params.id);

        if (!rentBook) {
            return res.status(404).json({
                success: false,
                message: 'Carnet de loyer non trouvé'
            });
        }

        // Vérifier les autorisations
        if (rentBook.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Non autorisé à modifier ce carnet de loyer'
            });
        }

        // Mettre à jour le statut
        rentBook.status = status;

        // Si le bail est terminé ou résilié, mettre à jour l'appartement
        if (status === 'terminé' || status === 'résilié') {
            const apartment = await Apartment.findById(rentBook.apartmentId);
            
            if (apartment) {
                apartment.status = 'disponible';
                apartment.currentTenant = null;
                
                // Mettre à jour le statut dans l'historique des locations
                const leaseIndex = apartment.leaseHistory.findIndex(
                    lease => lease.tenant.toString() === rentBook.tenantId.toString() && 
                           lease.status === 'actif'
                );
                
                if (leaseIndex !== -1) {
                    apartment.leaseHistory[leaseIndex].status = status;
                }
                
                await apartment.save();
            }
        }

        await rentBook.save();

        res.status(200).json({
            success: true,
            message: 'Statut du carnet de loyer mis à jour avec succès',
            data: rentBook
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour du statut',
            error: error.message
        });
    }
};

// Supprimer un carnet de loyer (admin uniquement)
exports.deleteRentBook = async (req, res) => {
    try {
        const rentBook = await RentBook.findById(req.params.id);

        if (!rentBook) {
            return res.status(404).json({
                success: false,
                message: 'Carnet de loyer non trouvé'
            });
        }

        // Seul l'admin peut supprimer un carnet de loyer
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Non autorisé à supprimer ce carnet de loyer'
            });
        }

        await RentBook.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Carnet de loyer supprimé avec succès'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression du carnet de loyer',
            error: error.message
        });
    }
};

// Obtenir l'historique des paiements d'un carnet de loyer
exports.getPaymentHistory = async (req, res) => {
    try {
        const rentBook = await RentBook.findById(req.params.id);

        if (!rentBook) {
            return res.status(404).json({
                success: false,
                message: 'Carnet de loyer non trouvé'
            });
        }

        // Récupérer l'historique des paiements
        const paymentHistory = rentBook.paymentHistory;

        // Calculer le total des paiements
        const totalPaid = paymentHistory.reduce((sum, payment) => sum + payment.amount, 0);
        
        // Calculer le montant restant à payer (si applicable)
        const monthlyRent = rentBook.monthlyRent;
        
        // Informations supplémentaires
        const summary = {
            totalPaid,
            monthlyRent,
            numberOfPayments: paymentHistory.length,
            lastPaymentDate: paymentHistory.length > 0 ? paymentHistory[paymentHistory.length - 1].date : null
        };

        res.status(200).json({
            success: true,
            message: 'Historique des paiements récupéré avec succès',
            data: {
                paymentHistory,
                summary
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de l\'historique des paiements',
            error: error.message
        });
    }
};

// Permettre à tout le monde de faire un paiement pour une location spécifique (accès public)
exports.publicPayment = async (req, res) => {
    try {
        const { amount, paymentMethod, reference, comment } = req.body;
        const rentBook = await RentBook.findById(req.params.id);

        if (!rentBook) {
            return res.status(404).json({
                success: false,
                message: 'Carnet de loyer non trouvé'
            });
        }

        // Déterminer le statut du paiement
        let status = 'payé';
        if (amount < rentBook.monthlyRent) {
            status = 'partiel';
        }

        // Ajouter le paiement
        rentBook.paymentHistory.push({
            date: new Date(),
            amount,
            paymentMethod,
            status,
            reference,
            comment
        });

        await rentBook.save();

        res.status(200).json({
            success: true,
            message: 'Paiement ajouté avec succès',
            data: {
                rentBookId: rentBook._id,
                paymentDate: new Date(),
                amount,
                paymentMethod,
                status,
                reference
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'ajout du paiement',
            error: error.message
        });
    }
};
