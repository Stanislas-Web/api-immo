const Apartment = require('../models/apartment.model');
const Building = require('../models/building.model');
const User = require('../models/user.model');

exports.createApartment = async (req, res) => {
    try {
        const building = await Building.findById(req.body.buildingId);
        if (!building) {
            return res.status(404).json({
                success: false,
                message: 'Immeuble non trouvé'
            });
        }

        // Vérifier si l'utilisateur est le propriétaire de l'immeuble
        if (building.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Non autorisé à ajouter un appartement à cet immeuble'
            });
        }

        const apartment = new Apartment(req.body);
        await apartment.save();

        // Mettre à jour le nombre total d'appartements dans l'immeuble
        building.totalApartments += 1;
        building.availableApartments += 1;
        await building.save();

        res.status(201).json({
            success: true,
            data: apartment
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création de l\'appartement',
            error: error.message
        });
    }
};

exports.getAllApartments = async (req, res) => {
    try {
        const query = {};

        // Filtres
        if (req.query.buildingId) query.buildingId = req.query.buildingId;
        if (req.query.status) query.status = req.query.status;
        if (req.query.type) query.type = req.query.type;
        if (req.query.minPrice) query['price.amount'] = { $gte: parseFloat(req.query.minPrice) };
        if (req.query.maxPrice) {
            query['price.amount'] = { 
                ...query['price.amount'],
                $lte: parseFloat(req.query.maxPrice)
            };
        }
        if (req.query.minSurface) query.surface = { $gte: parseFloat(req.query.minSurface) };
        if (req.query.maxSurface) {
            query.surface = {
                ...query.surface,
                $lte: parseFloat(req.query.maxSurface)
            };
        }

        // Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;

        const apartments = await Apartment.find(query)
            .populate('buildingId', 'name address')
            .populate('currentTenant', 'firstName lastName email')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await Apartment.countDocuments(query);

        res.status(200).json({
            success: true,
            count: apartments.length,
            total,
            pages: Math.ceil(total / limit),
            currentPage: page,
            data: apartments
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des appartements',
            error: error.message
        });
    }
};

exports.getApartmentById = async (req, res) => {
    try {
        const apartment = await Apartment.findById(req.params.id)
            .populate('buildingId', 'name address owner')
            .populate('currentTenant', 'firstName lastName email phone')
            .populate('leaseHistory.tenant', 'firstName lastName email');

        if (!apartment) {
            return res.status(404).json({
                success: false,
                message: 'Appartement non trouvé'
            });
        }

        res.status(200).json({
            success: true,
            data: apartment
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de l\'appartement',
            error: error.message
        });
    }
};

exports.updateApartment = async (req, res) => {
    try {
        const apartment = await Apartment.findById(req.params.id);
        if (!apartment) {
            return res.status(404).json({
                success: false,
                message: 'Appartement non trouvé'
            });
        }

        // Vérifier les autorisations
        const building = await Building.findById(apartment.buildingId);
        if (building.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Non autorisé à modifier cet appartement'
            });
        }

        const updatedApartment = await Apartment.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: updatedApartment
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour de l\'appartement',
            error: error.message
        });
    }
};

exports.deleteApartment = async (req, res) => {
    try {
        const apartment = await Apartment.findById(req.params.id);
        if (!apartment) {
            return res.status(404).json({
                success: false,
                message: 'Appartement non trouvé'
            });
        }

        // Vérifier les autorisations
        const building = await Building.findById(apartment.buildingId);
        if (building.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Non autorisé à supprimer cet appartement'
            });
        }

        // Vérifier si l'appartement est actuellement loué
        if (apartment.currentTenant) {
            return res.status(400).json({
                success: false,
                message: 'Impossible de supprimer un appartement actuellement loué'
            });
        }

        await apartment.remove();

        // Mettre à jour le nombre d'appartements dans l'immeuble
        building.totalApartments -= 1;
        if (apartment.status === 'disponible') {
            building.availableApartments -= 1;
        }
        await building.save();

        res.status(200).json({
            success: true,
            message: 'Appartement supprimé avec succès'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression de l\'appartement',
            error: error.message
        });
    }
};

exports.assignTenant = async (req, res) => {
    try {
        const { tenantId, startDate, endDate, monthlyRent, securityDeposit } = req.body;
        const apartment = await Apartment.findById(req.params.id);

        if (!apartment) {
            return res.status(404).json({
                success: false,
                message: 'Appartement non trouvé'
            });
        }

        // Vérifier si l'utilisateur est le propriétaire de l'appartement
        if (apartment.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Non autorisé à modifier cet appartement'
            });
        }

        const tenant = await User.findById(tenantId);
        if (!tenant || tenant.role !== 'locataire') {
            return res.status(400).json({
                success: false,
                message: 'Locataire invalide'
            });
        }

        // Vérifier si l'appartement est disponible
        if (apartment.status !== 'disponible' && apartment.status !== 'réservé') {
            return res.status(400).json({
                success: false,
                message: 'Appartement non disponible'
            });
        }

        apartment.currentTenant = tenantId;
        apartment.status = 'loué';
        apartment.leaseHistory.push({
            tenant: tenantId,
            startDate,
            endDate, // Sera undefined si non fourni
            monthlyRent,
            status: 'actif'
        });

        await apartment.save();

        // Mettre à jour le nombre d'appartements disponibles dans l'immeuble
        const building = await Building.findById(apartment.buildingId);
        if (building) {
            building.availableApartments -= 1;
            await building.save();
        }

        // Créer un carnet de loyer
        const RentBook = require('../models/rentBook.model');
        const rentBook = new RentBook({
            apartmentId: apartment._id,
            tenantId,
            ownerId: req.user._id,
            leaseStartDate: startDate,
            leaseEndDate: endDate, // Sera undefined si non fourni
            monthlyRent,
            securityDeposit: securityDeposit || 0,
            status: 'actif'
        });

        await rentBook.save();

        res.status(200).json({
            success: true,
            message: 'Locataire assigné et carnet de loyer créé avec succès',
            data: {
                apartment,
                rentBook
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'attribution du locataire',
            error: error.message
        });
    }
};

exports.addImages = async (req, res) => {
    try {
        const apartment = await Apartment.findById(req.params.id);
        
        if (!apartment) {
            return res.status(404).json({
                success: false,
                message: 'Appartement non trouvé'
            });
        }

        // Vérifier si des fichiers ont été uploadés
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Aucune image n\'a été fournie'
            });
        }

        // Upload des images sur Cloudinary
        const cloudinary = require('../config/cloudinary');
        const uploadPromises = [];
        
        // Fonction pour uploader un buffer vers Cloudinary
        const uploadToCloudinary = (buffer, options) => {
            return new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    options,
                    (error, result) => {
                        if (error) return reject(error);
                        resolve(result);
                    }
                );
                
                // Convertir le buffer en stream et l'envoyer à Cloudinary
                const Readable = require('stream').Readable;
                const readableStream = new Readable();
                readableStream.push(buffer);
                readableStream.push(null);
                readableStream.pipe(uploadStream);
            });
        };
        
        // Uploader chaque image
        for (const file of req.files) {
            const options = {
                folder: 'api-immo/apartments',
                resource_type: 'auto',
                transformation: [
                    { width: 1200, crop: 'limit' },
                    { quality: 'auto' },
                    { fetch_format: 'auto' }
                ]
            };
            
            uploadPromises.push(uploadToCloudinary(file.buffer, options));
        }
        
        const uploadResults = await Promise.all(uploadPromises);
        console.log('Images uploadées sur Cloudinary:', uploadResults);
        
        // Ajouter les URLs Cloudinary à l'appartement
        const cloudinaryUrls = uploadResults.map(result => result.secure_url);
        
        // S'assurer que apartment.images est un tableau
        if (!apartment.images) {
            apartment.images = [];
        }
        
        apartment.images = apartment.images.concat(cloudinaryUrls);

        await apartment.save();

        res.status(200).json({
            success: true,
            message: 'Images ajoutées avec succès',
            data: apartment
        });
    } catch (error) {
        console.error('Erreur lors de l\'ajout des images:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'ajout des images',
            error: error.message
        });
    }
};

exports.deleteImage = async (req, res) => {
    try {
        const apartment = await Apartment.findById(req.params.id);
        
        if (!apartment) {
            return res.status(404).json({
                success: false,
                message: 'Appartement non trouvé'
            });
        }

        // S'assurer que apartment.images est un tableau
        if (!apartment.images || !Array.isArray(apartment.images)) {
            return res.status(404).json({
                success: false,
                message: 'Aucune image trouvée pour cet appartement'
            });
        }

        // Trouver l'index de l'image à supprimer
        const imageIndex = apartment.images.findIndex(img => img.includes(req.params.imageId));
        
        if (imageIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Image non trouvée'
            });
        }

        // Supprimer l'image du tableau
        apartment.images.splice(imageIndex, 1);
        await apartment.save();

        res.status(200).json({
            success: true,
            message: 'Image supprimée avec succès',
            data: apartment
        });
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'image:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression de l\'image',
            error: error.message
        });
    }
};

exports.getApartmentsByBuilding = async (req, res) => {
    try {
        const building = await Building.findById(req.params.buildingId);
        if (!building) {
            return res.status(404).json({
                success: false,
                message: 'Immeuble non trouvé'
            });
        }

        const apartments = await Apartment.find({ buildingId: req.params.buildingId })
            .populate('currentTenant', 'firstName lastName email phone')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: apartments.length,
            data: apartments
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des appartements',
            error: error.message
        });
    }
};
