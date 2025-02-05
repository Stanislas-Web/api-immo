const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - phone
 *         - password
 *         - firstName
 *         - lastName
 *       properties:
 *         phone:
 *           type: string
 *           description: Numéro de téléphone de l'utilisateur
 *         email:
 *           type: string
 *           format: email
 *           description: Email de l'utilisateur (optionnel)
 *         password:
 *           type: string
 *           format: password
 *           description: Mot de passe hashé
 *         firstName:
 *           type: string
 *           description: Prénom
 *         lastName:
 *           type: string
 *           description: Nom
 *         role:
 *           type: string
 *           enum: [locataire, proprietaire, agent, admin]
 *           default: locataire
 *           description: Rôle de l'utilisateur
 *         isVerified:
 *           type: boolean
 *           default: false
 *           description: Indique si le compte est vérifié
 *         verificationToken:
 *           type: string
 *           description: Token pour la vérification du compte
 *         resetPasswordToken:
 *           type: string
 *           description: Token pour la réinitialisation du mot de passe
 *         resetPasswordExpires:
 *           type: string
 *           format: date-time
 *           description: Date d'expiration du token de réinitialisation
 *         lastLogin:
 *           type: string
 *           format: date-time
 *           description: Date de la dernière connexion
 *         profileImage:
 *           type: string
 *           description: URL de l'image de profil
 *         status:
 *           type: string
 *           enum: [actif, inactif, suspendu]
 *           default: actif
 *           description: Statut du compte
 *       example:
 *         phone: "+243123456789"
 *         email: "user@example.com"
 *         firstName: "John"
 *         lastName: "Doe"
 *         role: "locataire"
 *         isVerified: true
 *         status: "actif"
 */

const userSchema = new Schema({
    phone: {
        type: String,
        required: [true, 'Le numéro de téléphone est requis'],
        unique: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Veuillez fournir un email valide']
    },
    password: {
        type: String,
        required: [true, 'Le mot de passe est requis'],
        minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères']
    },
    firstName: {
        type: String,
        required: [true, 'Le prénom est requis'],
        trim: true
    },
    lastName: {
        type: String,
        required: [true, 'Le nom est requis'],
        trim: true
    },
    role: {
        type: String,
        enum: ['locataire', 'proprietaire', 'agent', 'admin'],
        default: 'locataire'
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    lastLogin: Date,
    profileImage: String,
    status: {
        type: String,
        enum: ['actif', 'inactif', 'suspendu'],
        default: 'actif'
    }
}, {
    timestamps: true,
    versionKey: false
});

// Index pour la recherche rapide
userSchema.index({ phone: 1 });
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });

module.exports = mongoose.model('User', userSchema);