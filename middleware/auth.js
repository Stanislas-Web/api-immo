const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const auth = (roles = [], options = { requireVerification: false }) => {
    return async (req, res, next) => {
        try {
            let token;

            if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
                token = req.headers.authorization.split(' ')[1];
            }

            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'Non autorisé - Token manquant'
                });
            }

            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                const user = await User.findById(decoded.userId).select('-password');

                if (!user) {
                    return res.status(401).json({
                        success: false,
                        message: 'Utilisateur non trouvé'
                    });
                }

                // Vérification du compte seulement si requireVerification est true
                if (options.requireVerification && !user.isVerified) {
                    return res.status(401).json({
                        success: false,
                        message: 'Compte non vérifié'
                    });
                }

                // Vérification du rôle si des rôles sont spécifiés
                if (roles.length && !roles.includes(user.role)) {
                    return res.status(403).json({
                        success: false,
                        message: 'Non autorisé - Rôle insuffisant'
                    });
                }

                req.user = user;
                next();
            } catch (error) {
                return res.status(401).json({
                    success: false,
                    message: 'Token invalide'
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Erreur d\'authentification',
                error: error.message
            });
        }
    };
};

module.exports = { auth };
