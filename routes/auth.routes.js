const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

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
 *               - email
 *               - phone
 *               - password
 *               - firstName
 *               - lastName
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, proprietaire, locataire, agent]
 *     responses:
 *       201:
 *         description: Inscription réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Données invalides
 */
router.post('/register', authController.register);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Connexion utilisateur
 *     description: Authentifie un utilisateur avec son email/téléphone et son mot de passe
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
 *                 description: Email ou numéro de téléphone de l'utilisateur
 *                 examples:
 *                   - "user@example.com"
 *                   - "+243826016607"
 *               password:
 *                 type: string
 *                 format: password
 *           examples:
 *             phone:
 *               value:
 *                 identifier: "+243826016607"
 *                 password: "1234"
 *               summary: Connexion avec téléphone
 *             email:
 *               value:
 *                 identifier: "user@example.com"
 *                 password: "motdepasse123"
 *               summary: Connexion avec email
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "5f7d3c4b9d3e2a1b3c4d5e6f"
 *                     email:
 *                       type: string
 *                       example: "user@example.com"
 *                     phone:
 *                       type: string
 *                       example: "+243826016607"
 *                     firstName:
 *                       type: string
 *                       example: "John"
 *                     lastName:
 *                       type: string
 *                       example: "Doe"
 *                     role:
 *                       type: string
 *                       example: "locataire"
 *       401:
 *         description: Identifiant ou mot de passe incorrect
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Identifiant ou mot de passe incorrect"
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /api/v1/auth/verify-email/{token}:
 *   get:
 *     tags: [Authentication]
 *     summary: Vérification de l'email
 *     description: Vérifie l'email d'un utilisateur via un token
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Email vérifié avec succès
 *       400:
 *         description: Token invalide
 */
router.get('/verify-email/:token', authController.verifyEmail);

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Demande de réinitialisation de mot de passe
 *     description: Envoie un email avec les instructions de réinitialisation
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
 *     responses:
 *       200:
 *         description: Instructions envoyées par email
 *       404:
 *         description: Email non trouvé
 */
router.post('/forgot-password', authController.forgotPassword);

/**
 * @swagger
 * /api/v1/auth/reset-password/{token}:
 *   post:
 *     tags: [Authentication]
 *     summary: Réinitialisation du mot de passe
 *     description: Réinitialise le mot de passe avec un nouveau
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
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
 *     responses:
 *       200:
 *         description: Mot de passe réinitialisé avec succès
 *       400:
 *         description: Token invalide ou expiré
 */
router.post('/reset-password/:token', authController.resetPassword);

/**
 * @swagger
 * /api/v1/auth/verify-token:
 *   get:
 *     tags: [Authentication]
 *     summary: Vérification du token JWT
 *     description: Vérifie si le token JWT est valide
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token valide
 *       401:
 *         description: Token invalide ou expiré
 */
router.get('/verify-token', authController.verifyToken);

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
 *           examples:
 *             example:
 *               value:
 *                 number: "+243826016607"
 *               summary: Envoi d'OTP
 *     responses:
 *       200:
 *         description: Code OTP envoyé
 *       400:
 *         description: Données invalides
 *       500:
 *         description: Erreur serveur
 */
router.post('/send-otp', authController.sendOtp);

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
 *     responses:
 *       200:
 *         description: Authentification réussie
 *       400:
 *         description: Code OTP invalide ou expiré
 *       500:
 *         description: Erreur serveur
 */
router.post('/verify-otp', authController.verifyOtp);

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
 *               newPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Mot de passe modifié avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 */
router.patch('/change-password', authController.changePassword);

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
 *               otp:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Mot de passe modifié avec succès
 *       400:
 *         description: Code OTP invalide
 *       404:
 *         description: Utilisateur non trouvé
 */
router.post('/change-password-otp', authController.changePasswordOtp);

module.exports = router;
