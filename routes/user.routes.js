const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');

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
router.get('/search', auth(['proprietaire', 'admin', 'agent'], { requireVerification: false }), userController.searchUsers);

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
router.get('/tenants', auth(['proprietaire', 'admin', 'agent'], { requireVerification: false }), userController.getTenants);

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
router.get('/profile', auth(['locataire', 'proprietaire', 'admin', 'agent'], { requireVerification: false }), userController.getProfile);

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
router.put('/profile', auth(['locataire', 'proprietaire', 'admin', 'agent'], { requireVerification: false }), userController.updateProfile);

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
router.post('/profile/image', auth(['locataire', 'proprietaire', 'admin', 'agent'], { requireVerification: false }), upload.single('image'), userController.uploadProfileImage);

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
router.get('/income-summary', auth(['proprietaire'], { requireVerification: false }), userController.getIncomeSummary);

module.exports = router;
