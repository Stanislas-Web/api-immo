const Building = require('../models/building.model');
const Apartment = require('../models/apartment.model');

exports.createBuilding = async (req, res) => {
    try {
        const building = new Building({
            ...req.body,
            owner: req.user._id
        });

        await building.save();

        res.status(201).json({
            success: true,
            data: building
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création de l\'immeuble',
            error: error.message
        });
    }
};

exports.getAllBuildings = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;
        
        const query = {};
        
        // Filtrer par propriétaire si nécessaire
        if (req.query.owner) {
            query.owner = req.query.owner;
        }

        // Filtrer par ville
        if (req.query.city) {
            query['address.city'] = new RegExp(req.query.city, 'i');
        }

        // Filtrer par caractéristiques
        if (req.query.features) {
            query.features = { $all: req.query.features.split(',') };
        }

        // Filtrer par statut
        if (req.query.status) {
            query.status = req.query.status;
        }

        const total = await Building.countDocuments(query);
        const buildings = await Building.find(query)
            .populate('owner', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const pages = Math.ceil(total / limit);

        res.status(200).json({
            success: true,
            data: {
                buildings,
                total,
                page,
                pages
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des immeubles',
            error: error.message
        });
    }
};

exports.getBuildingById = async (req, res) => {
    try {
        const building = await Building.findById(req.params.id)
            .populate('owner', 'firstName lastName email');

        if (!building) {
            return res.status(404).json({
                success: false,
                message: 'Immeuble non trouvé'
            });
        }

        res.status(200).json({
            success: true,
            data: building
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de l\'immeuble',
            error: error.message
        });
    }
};

exports.updateBuilding = async (req, res) => {
    try {
        const building = await Building.findById(req.params.id);

        if (!building) {
            return res.status(404).json({
                success: false,
                message: 'Immeuble non trouvé'
            });
        }

        // Vérifier que l'utilisateur est le propriétaire
        if (building.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Non autorisé à modifier cet immeuble'
            });
        }

        const updatedBuilding = await Building.findByIdAndUpdate(
            req.params.id,
            { ...req.body },
            { new: true, runValidators: true }
        ).populate('owner', 'firstName lastName email');

        res.status(200).json({
            success: true,
            data: updatedBuilding
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour de l\'immeuble',
            error: error.message
        });
    }
};

exports.deleteBuilding = async (req, res) => {
    try {
        const building = await Building.findById(req.params.id);

        if (!building) {
            return res.status(404).json({
                success: false,
                message: 'Immeuble non trouvé'
            });
        }

        // Vérifier que l'utilisateur est le propriétaire
        if (building.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Non autorisé à supprimer cet immeuble'
            });
        }

        // Vérifier s'il y a des appartements liés
        const hasApartments = await Apartment.exists({ building: req.params.id });
        if (hasApartments) {
            return res.status(400).json({
                success: false,
                message: 'Impossible de supprimer l\'immeuble car il contient des appartements'
            });
        }

        await building.remove();

        res.status(200).json({
            success: true,
            message: 'Immeuble supprimé avec succès'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression de l\'immeuble',
            error: error.message
        });
    }
};

exports.addBuildingDocument = async (req, res) => {
    try {
        const building = await Building.findById(req.params.id);

        if (!building) {
            return res.status(404).json({
                success: false,
                message: 'Immeuble non trouvé'
            });
        }

        // Vérifier que l'utilisateur est le propriétaire
        if (building.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Non autorisé à ajouter des documents à cet immeuble'
            });
        }

        const { type, url, name } = req.body;

        building.documents.push({
            type,
            url,
            name
        });

        await building.save();

        res.status(201).json({
            success: true,
            data: building.documents[building.documents.length - 1]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'ajout du document',
            error: error.message
        });
    }
};

exports.getBuildingsByUserId = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;
        
        const userId = req.params.userId;

        const query = { owner: userId };

        const total = await Building.countDocuments(query);
        const buildings = await Building.find(query)
            .populate('owner', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const pages = Math.ceil(total / limit);

        res.status(200).json({
            success: true,
            data: {
                buildings,
                total,
                page,
                pages
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des immeubles',
            error: error.message
        });
    }
};

module.exports = exports;
