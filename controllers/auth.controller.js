const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Otp } = require('../models/otp.model');
const axios = require('axios');

// Configuration JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '24h';

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: API d'authentification
 */

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Inscription d'un nouvel utilisateur
 *     description: Permet à un nouvel utilisateur de s'inscrire
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - password
 *               - firstName
 *               - lastName
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email de l'utilisateur (optionnel)
 *               phone:
 *                 type: string
 *                 description: Numéro de téléphone
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Mot de passe
 *               firstName:
 *                 type: string
 *                 description: Prénom
 *               lastName:
 *                 type: string
 *                 description: Nom
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *                 description: Rôle de l'utilisateur
 *     responses:
 *       201:
 *         description: Inscription réussie
 *       400:
 *         description: Données invalides ou utilisateur existant
 *       500:
 *         description: Erreur serveur
 */
exports.register = async (req, res) => {
    try {
        const { email, phone, password, firstName, lastName, role } = req.body;

        // Vérifier si l'utilisateur existe déjà
        const existingUserQuery = { phone };
        if (email) {
            existingUserQuery.$or = [{ phone }, { email }];
        }
        
        const existingUser = await User.findOne(existingUserQuery);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: email ? 'Email ou numéro de téléphone déjà utilisé' : 'Numéro de téléphone déjà utilisé'
            });
        }

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Créer le token de vérification
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // Créer le nouvel utilisateur
        const user = new User({
            phone,
            password: hashedPassword,
            firstName,
            lastName,
            role,
            verificationToken
        });

        // Ajouter l'email seulement s'il est fourni
        if (email) {
            user.email = email;
        }

        await user.save();

        // Envoyer l'email de vérification (à implémenter) - seulement si l'email est fourni
        let message = 'Inscription réussie.';
        if (email) {
            message += ' Veuillez vérifier votre email.';
        }

        res.status(201).json({
            success: true,
            message
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'inscription',
            error: error.message
        });
    }
};

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Connexion d'un utilisateur
 *     description: Permet à un utilisateur de se connecter
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *               - password
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Email ou numéro de téléphone
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Mot de passe
 *     responses:
 *       200:
 *         description: Connexion réussie
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Identifiant ou mot de passe incorrect
 *       500:
 *         description: Erreur serveur
 */
exports.login = async (req, res) => {
    try {
        const { identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({
                success: false,
                message: 'Veuillez fournir un identifiant et un mot de passe'
            });
        }

        // Rechercher l'utilisateur par email ou téléphone
        const user = await User.findOne({
            $or: [
                { email: identifier },
                { phone: identifier }
            ]
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Identifiant ou mot de passe incorrect'
            });
        }

        // Vérifier le mot de passe
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Identifiant ou mot de passe incorrect'
            });
        }

        // Générer le token JWT
        const token = jwt.sign(
            { 
                userId: user._id,
                role: user.role
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                email: user.email,
                phone: user.phone,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                isVerified: user.isVerified,
                profileImage: user.profileImage || null
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la connexion',
            error: error.message
        });
    }
};

/**
 * @swagger
 * /api/v1/auth/verify-email/{token}:
 *   get:
 *     tags: [Authentication]
 *     summary: Vérification de l'email
 *     description: Permet de vérifier l'email d'un utilisateur
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         description: Token de vérification
 *     responses:
 *       200:
 *         description: Email vérifié
 *       400:
 *         description: Token invalide
 *       500:
 *         description: Erreur serveur
 */
exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        const user = await User.findOne({ verificationToken: token });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Token de vérification invalide'
            });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Email vérifié avec succès'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la vérification',
            error: error.message
        });
    }
};

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Demande de réinitialisation du mot de passe
 *     description: Permet de demander la réinitialisation du mot de passe
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email de l'utilisateur
 *     responses:
 *       200:
 *         description: Instructions de réinitialisation envoyées
 *       404:
 *         description: Aucun compte associé à cet email
 *       500:
 *         description: Erreur serveur
 */
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Aucun compte associé à cet email'
            });
        }

        // Générer le token de réinitialisation
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 heure
        await user.save();

        // Envoyer l'email de réinitialisation (à implémenter)

        res.status(200).json({
            success: true,
            message: 'Instructions de réinitialisation envoyées par email'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la demande de réinitialisation',
            error: error.message
        });
    }
};

/**
 * @swagger
 * /api/v1/auth/reset-password/{token}:
 *   patch:
 *     tags: [Authentication]
 *     summary: Réinitialisation du mot de passe
 *     description: Permet de réinitialiser le mot de passe
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         description: Token de réinitialisation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Nouveau mot de passe
 *     responses:
 *       200:
 *         description: Mot de passe réinitialisé
 *       400:
 *         description: Token invalide ou expiré
 *       500:
 *         description: Erreur serveur
 */
exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Token invalide ou expiré'
            });
        }

        // Hasher le nouveau mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Mot de passe réinitialisé avec succès'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la réinitialisation du mot de passe',
            error: error.message
        });
    }
};

/**
 * @swagger
 * /api/v1/auth/verify-token:
 *   get:
 *     tags: [Authentication]
 *     summary: Vérification de la validité du token
 *     description: Vérifie si le token JWT est valide et non expiré
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token valide
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Token invalide ou expiré
 */
exports.verifyToken = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                valid: false,
                message: 'Token non fourni'
            });
        }

        const token = authHeader.split(' ')[1];
        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(401).json({
                    valid: false,
                    message: 'Token invalide ou expiré'
                });
            }

            res.status(200).json({
                valid: true,
                userId: decoded.userId,
                role: decoded.role
            });
        });
    } catch (error) {
        res.status(500).json({
            valid: false,
            message: 'Erreur lors de la vérification du token'
        });
    }
};

/**
 * @swagger
 * /api/v1/auth/send-otp:
 *   post:
 *     tags: [Authentication]
 *     summary: Envoi d'un code OTP
 *     description: Permet d'envoyer un code OTP pour la connexion ou l'inscription
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - number
 *             properties:
 *               number:
 *                 type: string
 *                 description: Numéro de téléphone
 *     responses:
 *       200:
 *         description: Code OTP envoyé
 *       400:
 *         description: Données invalides
 *       500:
 *         description: Erreur serveur
 */
exports.sendOtp = async (req, res) => {
    try {
        let { number } = req.body;

        // S'assurer que le numéro de téléphone commence par "+"
        if (number && !number.startsWith('+')) {
            number = '+' + number;
            console.log("Ajout du '+' au numéro de téléphone:", number);
        }

        if (!number) {
            return res.status(400).json({
                success: false,
                message: 'Le numéro de téléphone est requis'
            });
        }

        // Afficher tous les OTP existants pour ce numéro (débogage)
        const existingOtps = await Otp.find({ number });
        console.log("OTPs existants pour ce numéro:", existingOtps.map(o => ({
            id: o._id,
            number: o.number,
            createdAt: o.createdAt
        })));

        // Vérifier si l'utilisateur existe (connexion) ou est nouveau (inscription)
        const user = await User.findOne({ phone: number });
        console.log("Utilisateur trouvé:", user ? "Oui" : "Non");
        
        // Générer le code OTP (6 chiffres)
        const otp = Math.floor(100000 + Math.random() * 900000);
        const ttl = 5 * 60 * 1000; // 5 minutes en millisecondes
        const expires = Date.now() + ttl;
        
        // Hacher le code OTP
        const hashedOtp = await bcrypt.hash(otp.toString(), 10);
        
        // Supprimer les anciens OTP pour ce numéro
        await Otp.deleteMany({ number });
        console.log("Anciens OTPs supprimés pour le numéro:", number);
        
        // Créer un nouvel enregistrement OTP
        const newOtp = new Otp({
            number,
            otp: hashedOtp
        });
        
        await newOtp.save();
        console.log("Nouvel OTP créé:", {
            id: newOtp._id,
            number: newOtp.number,
            createdAt: newOtp.createdAt
        });
        
        // Envoi du code OTP via WhatsApp
        let data = JSON.stringify({
          "messaging_product": "whatsapp",
          "to": number,
          "type": "template",
          "template": {
            "name": "otp_1",
            "language": {
              "code": "en_US"
            },
            "components": [
              {
                "type": "body",
                "parameters": [
                  {
                    "type": "text",
                    "text": otp.toString()
                  }
                ]
              },
              {
                "type": "button",
                "sub_type": "url",
                "index": "0",
                "parameters": [
                  {
                    "type": "text",
                    "text": otp.toString()
                  }
                ]
              }
            ]
          }
        });

        let config = {
          method: 'post',
          maxBodyLength: Infinity,
          url: 'https://graph.facebook.com/v16.0/230630080143527/messages',
          headers: { 
            'Content-Type': 'application/json', 
            'Authorization': 'Bearer EAALOqv96b5kBOyZBK9MAZCF7Ev63btHib6DKyOTudKXvNYFkZBDdYZA6LDE6nssXrTZCEkdLP3hZBRLky3LS4SC5ZByFOtTzXNBVac4SKZCQPIug7YksXgiyeDZAqvGkcusMzz1cDjPPKXNkoVvQ8wrEZA4veGrRIyStcKg7a0MxBD1TE1DRCW76VLJikBEb9DLa8RQYhhKtkn4GWdduA8'
          },
          data : data
        };

        try {
            const response = await axios.request(config);
            console.log("WhatsApp API Response:", JSON.stringify(response.data));
        } catch (error) {
            console.error("WhatsApp API Error:", error.message);
            // Ne pas interrompre la réponse même si l'envoi WhatsApp échoue
        }
        
        res.status(200).json({
            success: true,
            message: 'Code OTP envoyé avec succès',
            data: {
                otp, // En production, ne jamais renvoyer l'OTP non haché
                expiresIn: ttl / 1000, // en secondes
                user: user ? 'login' : 'signup',
                number
            }
        });
        
    } catch (error) {
        console.error("Erreur lors de l'envoi du code OTP:", error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'envoi du code OTP',
            error: error.message
        });
    }
};

/**
 * @swagger
 * /api/v1/auth/verify-otp:
 *   post:
 *     tags: [Authentication]
 *     summary: Vérification du code OTP
 *     description: Vérifie le code OTP et procède à la connexion ou l'inscription
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - number
 *               - otp
 *             properties:
 *               number:
 *                 type: string
 *                 description: Numéro de téléphone
 *               otp:
 *                 type: string
 *                 description: Code OTP
 *               firstName:
 *                 type: string
 *                 description: Prénom (requis pour l'inscription)
 *               lastName:
 *                 type: string
 *                 description: Nom (requis pour l'inscription)
 *               testOnly:
 *                 type: boolean
 *                 description: Si true, vérifie seulement la validité de l'OTP sans créer de compte
 *           examples:
 *             login:
 *               value:
 *                 number: "+243826016607"
 *                 otp: "123456"
 *               summary: Connexion avec OTP
 *             signup:
 *               value:
 *                 number: "+243826016607"
 *                 otp: "123456"
 *                 firstName: "John"
 *                 lastName: "Doe"
 *               summary: Inscription avec OTP
 *             test:
 *               value:
 *                 number: "+243826016607"
 *                 otp: "123456"
 *                 testOnly: true
 *               summary: Test de validation OTP
 *     responses:
 *       200:
 *         description: Authentification réussie
 *       400:
 *         description: Code OTP invalide ou expiré
 *       500:
 *         description: Erreur serveur
 */
exports.verifyOtp = async (req, res) => {
  try {
    const { number, otp, firstName, lastName, testOnly } = req.body;
    
    // Valider les entrées
    if (!number || !otp) {
      return res.status(400).json({ 
        success: false,
        message: "Numéro et OTP requis" 
      });
    }
    
    // Vérifier si l'OTP existe
    const otpHolder = await Otp.find({ number });
    if (otpHolder.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Vous utilisez un OTP expiré ou invalide"
      });
    }
    
    // Récupérer le dernier OTP généré
    const rightOtpFind = otpHolder[otpHolder.length - 1];
    
    // Vérifier si l'OTP est valide
    const validOtp = await bcrypt.compare(otp, rightOtpFind.otp);
    
    if (rightOtpFind.number !== number || !validOtp) {
      return res.status(400).json({
        success: false,
        message: "Votre OTP est incorrect"
      });
    }
    
    // Si c'est juste un test de vérification, retourner succès
    if (testOnly) {
      const OTPDelete = await Otp.deleteMany({ number });
      return res.status(200).json({
        success: true,
        message: "OTP vérifié avec succès",
        validationOnly: true
      });
    }
    
    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ phone: number });
    
    if (user) {
      // OTP Login - L'utilisateur existe
      const result = await User.findOne({ phone: number });
      return res.status(200).json({
        success: true,
        message: "Connexion réussie",
        data: result,
        token: jwt.sign(
          { name: `${result.firstName} ${result.lastName}`, phone: result.phone, _id: result._id },
          "RESTFULAPIs"
        )
      });
    } else {
      // OTP SIGNUP - L'utilisateur n'existe pas
      if (!firstName || !lastName) {
        return res.status(400).json({
          success: false,
          message: "Les champs prénom et nom sont requis pour l'inscription"
        });
      }
      
      const newUser = new User({
        phone: number,
        firstName,
        lastName,
        password: await bcrypt.hash(crypto.randomBytes(8).toString('hex'), 10) // Mot de passe aléatoire sécurisé
      });
      
      const result = await newUser.save();
      const OTPDelete = await Otp.deleteMany({ number });
      
      return res.status(200).json({
        success: true,
        message: "Inscription réussie",
        data: result,
        token: jwt.sign(
          { name: `${result.firstName} ${result.lastName}`, phone: result.phone, _id: result._id },
          "RESTFULAPIs"
        )
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la vérification OTP",
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/v1/auth/change-password:
 *   patch:
 *     tags: [Authentication]
 *     summary: Modification du mot de passe
 *     description: Permet à un utilisateur connecté de modifier son mot de passe
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 description: Mot de passe actuel
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: Nouveau mot de passe
 *           examples:
 *             example:
 *               value:
 *                 currentPassword: "ancien_mot_de_passe"
 *                 newPassword: "nouveau_mot_de_passe"
 *               summary: Modification de mot de passe
 *     responses:
 *       200:
 *         description: Mot de passe modifié avec succès
 *       400:
 *         description: Mot de passe actuel incorrect ou nouveau mot de passe invalide
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur serveur
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id; // L'ID de l'utilisateur vient du middleware d'authentification
    
    // Vérifier que tous les champs sont présents
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Le mot de passe actuel et le nouveau mot de passe sont requis"
      });
    }
    
    // Vérifier que le nouveau mot de passe est suffisamment sécurisé
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Le nouveau mot de passe doit contenir au moins 6 caractères"
      });
    }
    
    // Récupérer l'utilisateur
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }
    
    // Vérifier que le mot de passe actuel est correct
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Le mot de passe actuel est incorrect"
      });
    }
    
    // Hacher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Mettre à jour le mot de passe
    user.password = hashedPassword;
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: "Mot de passe modifié avec succès"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la modification du mot de passe",
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/v1/auth/change-password-otp:
 *   post:
 *     tags: [Authentication]
 *     summary: Modification du mot de passe avec OTP
 *     description: Permet à un utilisateur de modifier son mot de passe en utilisant un code OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - number
 *               - otp
 *               - newPassword
 *             properties:
 *               number:
 *                 type: string
 *                 description: Numéro de téléphone
 *               otp:
 *                 type: string
 *                 description: Code OTP reçu
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: Nouveau mot de passe
 *           examples:
 *             example:
 *               value:
 *                 number: "+243826016607"
 *                 otp: "123456"
 *                 newPassword: "nouveau_mot_de_passe"
 *               summary: Modification de mot de passe par OTP
 *     responses:
 *       200:
 *         description: Mot de passe modifié avec succès
 *       400:
 *         description: Code OTP invalide ou nouveau mot de passe invalide
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur serveur
 */
exports.changePasswordOtp = async (req, res) => {
  try {
    const { phone, otp, newPassword } = req.body;
    
    console.log("Requête de changement de mot de passe par OTP:", { phone, otp });
    
    // Vérifier que tous les champs sont présents
    if (!phone || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Numéro, OTP et nouveau mot de passe sont requis"
      });
    }
    
    // Vérifier que le nouveau mot de passe est suffisamment sécurisé
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Le nouveau mot de passe doit contenir au moins 6 caractères"
      });
    }
    
    // Vérifier que l'utilisateur existe - chercher par phone au lieu de number
    const user = await User.findOne({ phone });
    console.log("Utilisateur trouvé:", user ? "Oui" : "Non");
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Aucun utilisateur trouvé avec ce numéro"
      });
    }
    
    // Vérifier l'OTP
    const otpHolder = await Otp.find({ phone });
    console.log("OTPs trouvés:", otpHolder.length);
    
    if (otpHolder.length === 0) {
      return res.status(400).json({
        success: false,
        message: "OTP expiré ou invalide"
      });
    }
    
    const rightOtpFind = otpHolder[otpHolder.length - 1];
    console.log("OTP trouvé pour ce numéro:", rightOtpFind.phone === phone ? "Oui" : "Non");
    
    const validOtp = await bcrypt.compare(otp, rightOtpFind.otp);
    console.log("OTP valide:", validOtp ? "Oui" : "Non");
    
    if (!validOtp) {
      return res.status(400).json({
        success: false,
        message: "Code OTP incorrect"
      });
    }
    
    // Hacher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Mettre à jour le mot de passe
    user.password = hashedPassword;
    await user.save();
    console.log("Mot de passe mis à jour avec succès");
    
    // Supprimer l'OTP
    await Otp.deleteMany({ phone });
    
    return res.status(200).json({
      success: true,
      message: "Mot de passe modifié avec succès",
      token: jwt.sign(
        { name: `${user.firstName} ${user.lastName}`, phone: user.phone, _id: user._id },
        "RESTFULAPIs"
      )
    });
  } catch (error) {
    console.error("Erreur lors du changement de mot de passe par OTP:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la modification du mot de passe",
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/v1/auth/register-with-otp:
 *   post:
 *     tags: [Authentication]
 *     summary: Inscription avec vérification OTP en une seule étape
 *     description: Permet à un nouvel utilisateur de s'inscrire en vérifiant un OTP déjà reçu
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - password
 *               - firstName
 *               - lastName
 *               - role
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email de l'utilisateur (optionnel)
 *               phone:
 *                 type: string
 *                 description: Numéro de téléphone
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Mot de passe
 *               firstName:
 *                 type: string
 *                 description: Prénom
 *               lastName:
 *                 type: string
 *                 description: Nom
 *               role:
 *                 type: string
 *                 enum: [locataire, proprietaire, agent, admin]
 *                 description: Rôle de l'utilisateur
 *               otp:
 *                 type: string
 *                 description: Code OTP reçu
 *     responses:
 *       201:
 *         description: Inscription réussie
 *       400:
 *         description: Données invalides, utilisateur existant ou OTP invalide
 *       500:
 *         description: Erreur serveur
 */
exports.registerWithOtp = async (req, res) => {
    try {
        // Extraire les données de la requête
        let { email, phone, password, firstName, lastName, role, otp } = req.body;

        console.log("Données de la requête:", { email, phone, password, firstName, lastName, role, otp });

        // S'assurer que le numéro de téléphone commence par "+"
        if (phone && !phone.startsWith('+')) {
            phone = '+' + phone;
        }

        // Valider les entrées
        if (!phone || !password || !firstName || !lastName || !role || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Tous les champs sont requis sauf l\'email'
            });
        }

        // Vérifier si l'utilisateur existe déjà
        const existingUserQuery = { phone };
        if (email) {
            existingUserQuery.$or = [{ phone }, { email }];
        }
        
        const existingUser = await User.findOne(existingUserQuery);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: email ? 'Email ou numéro de téléphone déjà utilisé' : 'Numéro de téléphone déjà utilisé'
            });
        }

        // Afficher tous les OTPs dans la base de données pour le débogage
        const allOtps = await Otp.find();
        console.log("Tous les OTPs dans la base de données:", 
            allOtps.map(o => ({ id: o._id, number: o.number, createdAt: o.createdAt }))
        );

        // IMPORTANT: Recherche de l'OTP avec le numéro correct
        console.log("Recherche de l'OTP pour le numéro:", phone);
        
        // Utiliser findOne avec sort pour obtenir l'OTP le plus récent
        const otpRecord = await Otp.findOne({ number: phone }).sort({ createdAt: -1 });
        
        // Si aucun OTP n'est trouvé, essayer avec le format sans "+"
        if (!otpRecord && phone.startsWith('+')) {
            const phoneWithoutPlus = phone.substring(1);
            console.log("Essai sans le '+' :", phoneWithoutPlus);
            const otpRecordAlt = await Otp.findOne({ number: phoneWithoutPlus }).sort({ createdAt: -1 });
            
            if (otpRecordAlt) {
                console.log("OTP trouvé avec le format sans '+'");
                // Utiliser cet OTP
                const isValidOtp = await bcrypt.compare(otp, otpRecordAlt.otp);
                console.log("OTP valide:", isValidOtp);
                
                if (!isValidOtp) {
                    return res.status(400).json({
                        success: false,
                        message: "Code OTP incorrect"
                    });
                }
                
                // Si on arrive ici, l'OTP est valide - procéder à l'inscription
                const hashedPassword = await bcrypt.hash(password, 10);
                
                const user = new User({
                    phone,
                    password: hashedPassword,
                    firstName,
                    lastName,
                    role,
                    isVerified: true
                });
                
                if (email) {
                    user.email = email;
                }
                
                await user.save();
                
                // Supprimer l'OTP utilisé
                await Otp.deleteOne({ _id: otpRecordAlt._id });
                
                // Générer le token JWT
                const token = jwt.sign(
                    { 
                        userId: user._id,
                        role: user.role
                    },
                    JWT_SECRET,
                    { expiresIn: JWT_EXPIRES_IN }
                );
                
                return res.status(201).json({
                    success: true,
                    message: 'Inscription réussie avec vérification OTP',
                    data: {
                        user: {
                            id: user._id,
                            phone: user.phone,
                            email: user.email,
                            firstName: user.firstName,
                            lastName: user.lastName,
                            role: user.role
                        },
                        token
                    }
                });
            }
            
            // Si aucun OTP n'est trouvé même avec le format alternatif
            return res.status(400).json({
                success: false,
                message: "Aucun OTP trouvé pour ce numéro. Veuillez demander un nouveau code."
            });
        }
        
        // Si un OTP est trouvé avec le format original
        if (otpRecord) {
            console.log("OTP trouvé:", { id: otpRecord._id, number: otpRecord.number });
            
            // Vérifier si l'OTP est correct
            const isValidOtp = await bcrypt.compare(otp, otpRecord.otp);
            console.log("OTP valide:", isValidOtp);
            
            if (!isValidOtp) {
                return res.status(400).json({
                    success: false,
                    message: "Code OTP incorrect"
                });
            }
            
            // Si on arrive ici, l'OTP est valide - procéder à l'inscription
            const hashedPassword = await bcrypt.hash(password, 10);
            
            const user = new User({
                phone,
                password: hashedPassword,
                firstName,
                lastName,
                role,
                isVerified: true
            });
            
            if (email) {
                user.email = email;
            }
            
            await user.save();
            
            // Supprimer l'OTP utilisé
            await Otp.deleteOne({ _id: otpRecord._id });
            
            // Générer le token JWT
            const token = jwt.sign(
                { 
                    userId: user._id,
                    role: user.role
                },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRES_IN }
            );
            
            return res.status(201).json({
                success: true,
                message: 'Inscription réussie avec vérification OTP',
                data: {
                    user: {
                        id: user._id,
                        phone: user.phone,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        role: user.role
                    },
                    token
                }
            });
        } else {
            // Si aucun OTP n'est trouvé
            return res.status(400).json({
                success: false,
                message: "Aucun OTP trouvé pour ce numéro. Veuillez demander un nouveau code."
            });
        }
    } catch (error) {
        console.error("Erreur lors de l'inscription avec OTP:", error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'inscription',
            error: error.message
        });
    }
};
