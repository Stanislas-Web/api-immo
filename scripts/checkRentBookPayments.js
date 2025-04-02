/**
 * Script pour vérifier spécifiquement les paiements d'un RentBook problématique
 * À exécuter avec: node scripts/checkRentBookPayments.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const RentBook = require('../models/rentBook.model');
const Transaction = require('../models/transaction.model');
const connectDB = require('../config/database');

// ID du RentBook problématique
const PROBLEMATIC_RENTBOOK_ID = '67ebce9653409d3e2187e658';

// Se connecter à MongoDB
connectDB()
.then(() => {
    console.log('Connecté à MongoDB pour la vérification du RentBook problématique');
    checkRentBook();
})
.catch(err => {
    console.error('Erreur de connexion à MongoDB:', err);
    process.exit(1);
});

async function checkRentBook() {
    try {
        // 1. Vérifier l'état actuel du RentBook
        console.log(`\n=== ANALYSE DU RENTBOOK ${PROBLEMATIC_RENTBOOK_ID} ===`);
        
        // Récupérer le RentBook avec lean() pour voir les données brutes sans middleware
        const rentBook = await RentBook.findById(PROBLEMATIC_RENTBOOK_ID).lean();
        
        if (!rentBook) {
            console.log('RentBook non trouvé!');
            process.exit(1);
        }
        
        console.log('\nInformations de base:');
        console.log(`- Appartement: ${rentBook.apartmentId}`);
        console.log(`- Locataire: ${rentBook.tenantId}`);
        console.log(`- Loyer mensuel: ${rentBook.monthlyRent}`);
        console.log(`- Statut: ${rentBook.status}`);
        
        console.log('\nÉtat de paymentHistory:');
        console.log(`- paymentHistory existe: ${rentBook.paymentHistory ? 'Oui' : 'Non'}`);
        console.log(`- paymentHistory est un tableau: ${Array.isArray(rentBook.paymentHistory) ? 'Oui' : 'Non'}`);
        console.log(`- Nombre de paiements: ${Array.isArray(rentBook.paymentHistory) ? rentBook.paymentHistory.length : 'N/A'}`);
        
        if (Array.isArray(rentBook.paymentHistory) && rentBook.paymentHistory.length > 0) {
            console.log('\nListe des paiements existants:');
            rentBook.paymentHistory.forEach((payment, index) => {
                console.log(`\nPaiement #${index + 1}:`);
                console.log(JSON.stringify(payment, null, 2));
            });
        }
        
        // 2. Rechercher les transactions liées à ce RentBook
        console.log('\n=== RECHERCHE DES TRANSACTIONS LIÉES ===');
        
        // Par apartmentId et tenantId
        const transactions = await Transaction.find({
            apartmentId: rentBook.apartmentId,
            tenant: rentBook.tenantId
        }).sort({ createdAt: -1 });
        
        console.log(`Nombre de transactions trouvées: ${transactions.length}`);
        
        if (transactions.length > 0) {
            console.log('\nListe des transactions:');
            transactions.forEach((tx, index) => {
                console.log(`\nTransaction #${index + 1} (${tx._id}):`);
                console.log(`- Date: ${tx.createdAt}`);
                console.log(`- Montant: ${tx.amount?.value || 'N/A'} ${tx.amount?.currency || ''}`);
                console.log(`- Statut: ${tx.status}`);
                console.log(`- Type: ${tx.type}`);
                console.log(`- Méthode: ${tx.paymentMethod?.type || 'N/A'}`);
                console.log(`- Reference: ${tx.metadata?.receiptNumber || 'N/A'}`);
            });
        }
        
        // 3. Proposer une solution pour ajouter les paiements manquants
        console.log('\n=== SOLUTION PROPOSÉE ===');
        
        if (transactions.length > rentBook.paymentHistory.length) {
            console.log('Des transactions existent mais ne sont pas reflétées dans l\'historique des paiements.');
            console.log('Voulez-vous exécuter le script suivant pour réparer ce RentBook spécifique?');
            console.log('node scripts/repairSpecificRentBook.js');
        } else {
            console.log('Le nombre de transactions correspond au nombre de paiements dans l\'historique.');
            console.log('Le problème pourrait être lié à la manière dont les données sont récupérées par l\'API.');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Erreur lors de la vérification du RentBook:', error);
        process.exit(1);
    }
}
