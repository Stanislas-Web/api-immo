const Listing = require('../models/listing.model');
const Apartment = require('../models/apartment.model');
const Building = require('../models/building.model');

exports.createListing = async (req, res) => {
    try {
        const apartment = await Apartment.findById(req.body.apartmentId)
            .populate('buildingId');

        if (!apartment) {
            return res.status(404).json({
                success: false,
                message: 'Appartement non trouvé'
            });
        }

        // Vérifier si l'utilisateur est le propriétaire
        if (apartment.buildingId.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Non autorisé à créer une annonce pour cet appartement'
            });
        }

        // Vérifier si une annonce active existe déjà pour cet appartement
        const existingListing = await Listing.findOne({ 
            apartmentId: req.body.apartmentId,
            status: { $in: ['active', 'pending'] }
        });

        if (existingListing) {
            return res.status(400).json({
                success: false,
                message: 'Une annonce existe déjà pour cet appartement. Veuillez la désactiver avant d\'en créer une nouvelle.'
            });
        }

        const listing = new Listing({
            ...req.body,
            price: typeof req.body.price === 'number' 
                ? { 
                    amount: req.body.price,
                    currency: apartment.price.currency 
                } 
                : {
                    ...req.body.price,
                    currency: apartment.price.currency 
                },
            publisher: req.user._id
        });

        await listing.save();

        res.status(201).json({
            success: true,
            data: listing
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création de l\'annonce',
            error: error.message
        });
    }
};

exports.getAllListings = async (req, res) => {
    try {
        const query = {};

        // Filtres
        if (req.query.status) query.status = req.query.status;
        if (req.query.minPrice) query['price.amount'] = { $gte: parseFloat(req.query.minPrice) };
        if (req.query.maxPrice) {
            query['price.amount'] = {
                ...query['price.amount'],
                $lte: parseFloat(req.query.maxPrice)
            };
        }

        // Recherche textuelle
        if (req.query.search) {
            query.$text = { $search: req.query.search };
        }

        // Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;

        const listings = await Listing.find(query)
            .populate({
                path: 'apartmentId',
                select: 'type surface rooms bathrooms price features images',
                populate: {
                    path: 'buildingId',
                    select: 'name address'
                }
            })
            .populate('publisher', 'firstName lastName phone')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await Listing.countDocuments(query);

        res.status(200).json({
            success: true,
            count: listings.length,
            total,
            pages: Math.ceil(total / limit),
            currentPage: page,
            data: listings
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des annonces',
            error: error.message
        });
    }
};

exports.getListingById = async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id)
            .populate({
                path: 'apartmentId',
                select: 'type surface rooms bathrooms price features images',
                populate: {
                    path: 'buildingId',
                    select: 'name address features'
                }
            })
            .populate('publisher', 'firstName lastName phone whatsappNumber');

        if (!listing) {
            return res.status(404).json({
                success: false,
                message: 'Annonce non trouvée'
            });
        }

        // Incrémenter le nombre de vues
        listing.views += 1;
        await listing.save();

        res.status(200).json({
            success: true,
            data: listing
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de l\'annonce',
            error: error.message
        });
    }
};

exports.updateListing = async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);

        if (!listing) {
            return res.status(404).json({
                success: false,
                message: 'Annonce non trouvée'
            });
        }

        // Vérifier si l'utilisateur est le publisher
        if (listing.publisher.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Non autorisé à modifier cette annonce'
            });
        }

        const updatedListing = await Listing.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: updatedListing
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour de l\'annonce',
            error: error.message
        });
    }
};

exports.deleteListing = async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);

        if (!listing) {
            return res.status(404).json({
                success: false,
                message: 'Annonce non trouvée'
            });
        }

        // Vérifier si l'utilisateur est le publisher
        if (listing.publisher.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Non autorisé à supprimer cette annonce'
            });
        }

        await listing.remove();

        res.status(200).json({
            success: true,
            message: 'Annonce supprimée avec succès'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression de l\'annonce',
            error: error.message
        });
    }
};

exports.toggleFavorite = async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);

        if (!listing) {
            return res.status(404).json({
                success: false,
                message: 'Annonce non trouvée'
            });
        }

        const userId = req.user._id;
        const isFavorite = listing.favorites.includes(userId);

        if (isFavorite) {
            listing.favorites = listing.favorites.filter(
                id => id.toString() !== userId.toString()
            );
        } else {
            listing.favorites.push(userId);
        }

        await listing.save();

        res.status(200).json({
            success: true,
            isFavorite: !isFavorite,
            message: `Annonce ${!isFavorite ? 'ajoutée aux' : 'retirée des'} favoris`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la modification des favoris',
            error: error.message
        });
    }
};

exports.getListingsByUserId = async (req, res) => {
    try {
        const userId = req.params.userId;
        const listings = await Listing.find({ publisher: userId })
            .populate({
                path: 'apartmentId',
                select: 'type surface rooms bathrooms price features images',
                populate: {
                    path: 'buildingId',
                    select: 'name address'
                }
            })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: listings.length,
            data: listings
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des annonces',
            error: error.message
        });
    }
};
