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
