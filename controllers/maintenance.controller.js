const Maintenance = require('../models/maintenance.model');
const Apartment = require('../models/apartment.model');
const Building = require('../models/building.model');
const cloudinary = require('../config/cloudinary');

exports.createMaintenance = async (req, res) => {
    try {
        const apartment = await Apartment.findById(req.body.apartmentId);
        if (!apartment) {
            return res.status(404).json({
                success: false,
                message: 'Appartement non trouvé'
            });
        }

        // Vérifier les autorisations
        if (req.user.role === 'locataire') {
            // Vérifier si le locataire est bien le locataire actuel de l'appartement
            if (apartment.currentTenant.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Non autorisé - Vous devez être le locataire actuel de cet appartement'
                });
            }
        } else if (req.user.role === 'proprietaire') {
            // Vérifier si le propriétaire est bien le propriétaire de l'immeuble
            const building = await Building.findById(apartment.buildingId);
            if (building.owner.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Non autorisé - Vous devez être le propriétaire de cet immeuble'
                });
            }
        }

        const maintenance = new Maintenance(req.body);
        await maintenance.save();

        res.status(201).json({
            success: true,
            data: maintenance
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création de la maintenance',
            error: error.message
        });
    }
};

exports.getAllMaintenances = async (req, res) => {
    try {
        const query = {};

        // Filtres
        if (req.query.apartmentId) query.apartmentId = req.query.apartmentId;
        if (req.query.status) query.status = req.query.status;
        if (req.query.startDate) query.date = { $gte: new Date(req.query.startDate) };
        if (req.query.endDate) {
            query.date = {
                ...query.date,
                $lte: new Date(req.query.endDate)
            };
        }

        // Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;

        const maintenances = await Maintenance.find(query)
            .populate('apartmentId', 'number type floor')
            .skip(skip)
            .limit(limit)
            .sort({ date: -1 });

        const total = await Maintenance.countDocuments(query);

        res.status(200).json({
            success: true,
            count: maintenances.length,
            total,
            pages: Math.ceil(total / limit),
            currentPage: page,
            data: maintenances
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des maintenances',
            error: error.message
        });
    }
};

exports.getMaintenanceById = async (req, res) => {
    try {
        const maintenance = await Maintenance.findById(req.params.id)
            .populate('apartmentId', 'number type floor buildingId');

        if (!maintenance) {
            return res.status(404).json({
                success: false,
                message: 'Maintenance non trouvée'
            });
        }

        res.status(200).json({
            success: true,
            data: maintenance
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de la maintenance',
            error: error.message
        });
    }
};

exports.updateMaintenance = async (req, res) => {
    try {
        const maintenance = await Maintenance.findById(req.params.id)
            .populate('apartmentId');
        
        if (!maintenance) {
            return res.status(404).json({
                success: false,
                message: 'Maintenance non trouvée'
            });
        }

        // Vérifier les autorisations
        const building = await Building.findById(maintenance.apartmentId.buildingId);
        if (building.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Non autorisé à modifier cette maintenance'
            });
        }

        const updatedMaintenance = await Maintenance.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: updatedMaintenance
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour de la maintenance',
            error: error.message
        });
    }
};

exports.deleteMaintenance = async (req, res) => {
    try {
        const maintenance = await Maintenance.findById(req.params.id)
            .populate('apartmentId');
            
        if (!maintenance) {
            return res.status(404).json({
                success: false,
                message: 'Maintenance non trouvée'
            });
        }

        // Vérifier les autorisations
        const building = await Building.findById(maintenance.apartmentId.buildingId);
        if (building.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Non autorisé à supprimer cette maintenance'
            });
        }

        // Supprimer les images de Cloudinary
        for (const imageUrl of maintenance.images) {
            const publicId = imageUrl.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(publicId);
        }

        await maintenance.remove();

        res.status(200).json({
            success: true,
            message: 'Maintenance supprimée avec succès'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression de la maintenance',
            error: error.message
        });
    }
};

exports.addImages = async (req, res) => {
    try {
        const maintenance = await Maintenance.findById(req.params.id)
            .populate('apartmentId');

        if (!maintenance) {
            return res.status(404).json({
                success: false,
                message: 'Maintenance non trouvée'
            });
        }

        // Vérifier les autorisations
        const building = await Building.findById(maintenance.apartmentId.buildingId);
        if (building.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Non autorisé à ajouter des images à cette maintenance'
            });
        }

        if (!req.files || !Array.isArray(req.files)) {
            return res.status(400).json({
                success: false,
                message: 'Aucune image fournie'
            });
        }

        const uploadPromises = req.files.map(file => {
            return new Promise((resolve, reject) => {
                cloudinary.uploader.upload(file.path, {
                    folder: 'maintenance_images',
                    resource_type: 'auto'
                }, (error, result) => {
                    if (error) reject(error);
                    else resolve(result.secure_url);
                });
            });
        });

        const uploadedUrls = await Promise.all(uploadPromises);
        maintenance.images = [...maintenance.images, ...uploadedUrls];
        await maintenance.save();

        res.status(200).json({
            success: true,
            data: maintenance
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'ajout des images',
            error: error.message
        });
    }
};

exports.deleteImage = async (req, res) => {
    try {
        const { id, imageUrl } = req.params;
        const maintenance = await Maintenance.findById(id)
            .populate('apartmentId');

        if (!maintenance) {
            return res.status(404).json({
                success: false,
                message: 'Maintenance non trouvée'
            });
        }

        // Vérifier les autorisations
        const building = await Building.findById(maintenance.apartmentId.buildingId);
        if (building.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Non autorisé à supprimer des images de cette maintenance'
            });
        }

        if (!maintenance.images.includes(imageUrl)) {
            return res.status(404).json({
                success: false,
                message: 'Image non trouvée dans la maintenance'
            });
        }

        // Supprimer l'image de Cloudinary
        const publicId = imageUrl.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(publicId);

        // Mettre à jour la liste des images
        maintenance.images = maintenance.images.filter(img => img !== imageUrl);
        await maintenance.save();

        res.status(200).json({
            success: true,
            message: 'Image supprimée avec succès',
            data: maintenance
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression de l\'image',
            error: error.message
        });
    }
};
