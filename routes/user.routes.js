const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { auth } = require('../middleware/auth');

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

module.exports = router;
