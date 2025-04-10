const User = require('../models/user.model');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Gestion des utilisateurs
 */

/**
 * @swagger
 * /api/v1/users/search:
 *   get:
 *     tags: [Users]
 *     summary: Rechercher des locataires
 *     description: Permet de rechercher des locataires par nom, prénom ou numéro de téléphone
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Terme de recherche (nom, prénom ou numéro de téléphone)
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [locataire, proprietaire, agent, admin]
 *           default: locataire
 *         description: Rôle des utilisateurs à rechercher (par défaut, locataire)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Nombre maximum de résultats à retourner
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de page pour la pagination
 *     responses:
 *       200:
 *         description: Liste des utilisateurs correspondant aux critères de recherche
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
exports.searchUsers = async (req, res) => {
    try {
        const { query, role = 'locataire', limit = 10, page = 1 } = req.query;
        const skip = (page - 1) * limit;

        // Construire le filtre de recherche
        let filter = { role };
        
        if (query) {
            // Échapper les caractères spéciaux dans la requête pour éviter les erreurs d'expression régulière
            const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            
            filter = {
                ...filter,
                $or: [
                    { firstName: { $regex: escapedQuery, $options: 'i' } },
                    { lastName: { $regex: escapedQuery, $options: 'i' } },
                    { phone: { $regex: escapedQuery, $options: 'i' } },
                    { email: { $regex: escapedQuery, $options: 'i' } }
                ]
            };
        }

        // Exécuter la requête
        const users = await User.find(filter)
            .select('firstName lastName phone email role verified')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ firstName: 1, lastName: 1 });

        // Compter le nombre total de résultats pour la pagination
        const total = await User.countDocuments(filter);

        res.status(200).json({
            success: true,
            count: users.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la recherche des utilisateurs',
            error: error.message
        });
    }
};

/**
 * @swagger
 * /api/v1/users/tenants:
 *   get:
 *     tags: [Users]
 *     summary: Obtenir la liste des locataires
 *     description: Permet d'obtenir la liste de tous les locataires
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Nombre maximum de résultats à retourner
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de page pour la pagination
 *     responses:
 *       200:
 *         description: Liste des locataires
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
exports.getTenants = async (req, res) => {
    try {
        const { limit = 10, page = 1 } = req.query;
        const skip = (page - 1) * limit;

        // Récupérer tous les locataires
        const tenants = await User.find({ role: 'locataire' })
            .select('firstName lastName phone email verified')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ firstName: 1, lastName: 1 });

        // Compter le nombre total de locataires pour la pagination
        const total = await User.countDocuments({ role: 'locataire' });

        res.status(200).json({
            success: true,
            count: tenants.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            data: tenants
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des locataires',
            error: error.message
        });
    }
};

/**
 * @swagger
 * /api/v1/users/profile:
 *   put:
 *     tags: [Users]
 *     summary: Modifier le profil utilisateur
 *     description: Permet à un utilisateur de modifier son profil
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: Prénom de l'utilisateur
 *               lastName:
 *                 type: string
 *                 description: Nom de l'utilisateur
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email de l'utilisateur
 *               phone:
 *                 type: string
 *                 description: Numéro de téléphone de l'utilisateur
 *     responses:
 *       200:
 *         description: Profil mis à jour avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur serveur
 */
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const { firstName, lastName, email, phone } = req.body;

        // Vérifier si l'utilisateur existe
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        // Vérifier si l'email est déjà utilisé par un autre utilisateur
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email, _id: { $ne: userId } });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Cet email est déjà utilisé'
                });
            }
        }

        // Vérifier si le téléphone est déjà utilisé par un autre utilisateur
        if (phone && phone !== user.phone) {
            const existingUser = await User.findOne({ phone, _id: { $ne: userId } });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Ce numéro de téléphone est déjà utilisé'
                });
            }
        }

        // Mettre à jour les informations du profil
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    firstName: firstName || user.firstName,
                    lastName: lastName || user.lastName,
                    email: email || user.email,
                    phone: phone || user.phone
                }
            },
            { new: true, runValidators: true }
        ).select('-password');

        res.status(200).json({
            success: true,
            message: 'Profil mis à jour avec succès',
            data: updatedUser
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour du profil',
            error: error.message
        });
    }
};

/**
 * @swagger
 * /api/v1/users/profile/image:
 *   post:
 *     tags: [Users]
 *     summary: Télécharger une image de profil
 *     description: Permet à un utilisateur de télécharger une image de profil
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image à télécharger (max 5MB)
 *     responses:
 *       200:
 *         description: Image téléchargée avec succès
 *       400:
 *         description: Aucune image fournie ou format invalide
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur serveur
 */
exports.uploadProfileImage = async (req, res) => {
    try {
        const userId = req.user._id;

        // Vérifier si l'image est fournie
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Aucune image fournie'
            });
        }

        // Utiliser Cloudinary pour stocker l'image
        const cloudinary = require('../config/cloudinary');
        
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

        // Configuration pour Cloudinary
        const options = {
            folder: 'api-immo/profiles',
            resource_type: 'auto',
            transformation: [
                { width: 400, height: 400, crop: 'fill', gravity: 'face' },
                { quality: 'auto' },
                { fetch_format: 'auto' }
            ]
        };

        // Upload de l'image sur Cloudinary
        const uploadResult = await uploadToCloudinary(req.file.buffer, options);
        
        // Mettre à jour le profil de l'utilisateur avec l'URL Cloudinary
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: { profileImage: uploadResult.secure_url } },
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Image de profil téléchargée avec succès',
            data: {
                profileImage: uploadResult.secure_url,
                user: updatedUser
            }
        });
    } catch (error) {
        console.error('Erreur lors du téléchargement de l\'image:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors du téléchargement de l\'image',
            error: error.message
        });
    }
};

/**
 * @swagger
 * /api/v1/users/profile:
 *   get:
 *     tags: [Users]
 *     summary: Obtenir le profil utilisateur
 *     description: Permet à un utilisateur d'obtenir son profil
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil récupéré avec succès
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur serveur
 */
exports.getProfile = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du profil',
            error: error.message
        });
    }
};
/**
 * @swagger
 * /api/v1/users/income-summary:
 *   get:
 *     tags: [Users]
 *     summary: Obtenir la somme des montants encaissés (propriétaire)
 *     description: Permet à un propriétaire d'obtenir la somme totale des montants qu'il a encaissés, en USD et en CDF
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de début pour filtrer les transactions (format YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de fin pour filtrer les transactions (format YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Résumé des revenus obtenu avec succès
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
exports.getIncomeSummary = async (req, res) => {
    try {
        const userId = req.user._id;
        const { startDate, endDate } = req.query;
        
        // Vérifier que l'utilisateur est un propriétaire
        const user = await User.findById(userId);
        if (!user || user.role !== 'proprietaire') {
            return res.status(403).json({
                success: false,
                message: 'Cette fonctionnalité n\'est disponible que pour les propriétaires'
            });
        }
        
        // Préparer le filtre pour les transactions
        const filter = {
            landlord: userId,
            status: 'complete'
        };
        
        // Ajouter le filtre de date si spécifié
        if (startDate || endDate) {
            filter.createdAt = {};
            
            if (startDate) {
                filter.createdAt.$gte = new Date(startDate);
            }
            
            if (endDate) {
                // Ajouter un jour à la date de fin pour inclure toute la journée
                const endDateObj = new Date(endDate);
                endDateObj.setDate(endDateObj.getDate() + 1);
                filter.createdAt.$lte = endDateObj;
            }
        }
        
        // Récupérer le modèle Transaction
        const Transaction = require('../models/transaction.model');
        
        // Agréger les transactions par devise
        const transactions = await Transaction.find(filter);
        
        // Calculer les totaux par devise
        let totalUSD = 0;
        let totalCDF = 0;
        
        transactions.forEach(transaction => {
            if (transaction.amount && transaction.amount.value) {
                if (transaction.amount.currency === 'USD') {
                    totalUSD += transaction.amount.value;
                } else if (transaction.amount.currency === 'CDF') {
                    totalCDF += transaction.amount.value;
                }
            }
        });
        
        // Formater les montants avec 2 décimales
        totalUSD = parseFloat(totalUSD.toFixed(2));
        totalCDF = parseFloat(totalCDF.toFixed(2));
        
        // Compter le nombre de transactions
        const transactionCount = transactions.length;
        
        res.status(200).json({
            success: true,
            data: {
                totalUSD,
                totalCDF,
                transactionCount,
                period: {
                    from: startDate || 'Toutes les dates',
                    to: endDate || 'Toutes les dates'
                }
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération du résumé des revenus:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du résumé des revenus',
            error: error.message
        });
    }
};
