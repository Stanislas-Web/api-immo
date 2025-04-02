/**
 * Script pour vérifier et réparer l'historique des paiements des RentBooks
 * À exécuter avec: node scripts/verifyAndFixPaymentHistory.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const RentBook = require('../models/rentBook.model');
const connectDB = require('../config/database');

// Liste des IDs de RentBooks problématiques à vérifier spécifiquement
const problematicRentBookIds = [
    '67ebce9653409d3e2187e658', // RentBook spécifiquement mentionné
    '67c90e9dc2765f5b0a58ee29',
    '67c992772837ba7db897b3ab',
    '67c9b9f52837ba7db897b65d',
    '67d19234b81771a90d66ba47'
];

// Se connecter à MongoDB
connectDB()
.then(() => {
    console.log('Connecté à MongoDB pour la vérification des RentBooks');
    runTests();
})
.catch(err => {
    console.error('Erreur de connexion à MongoDB:', err);
    process.exit(1);
});

async function runTests() {
    try {
        // 1. Tester la récupération et réparation des RentBooks problématiques
        console.log('=== TEST 1: Vérification des RentBooks problématiques ===');
        
        for (const rentBookId of problematicRentBookIds) {
            // Récupérer le RentBook avant modification
            const rentBookBefore = await RentBook.findById(rentBookId).lean();
            
            if (!rentBookBefore) {
                console.log(`RentBook ${rentBookId} non trouvé dans la base de données.`);
                continue;
            }
            
            // Afficher l'état avant réparation
            console.log(`\n--- RentBook ${rentBookId} ---`);
            console.log('État AVANT:');
            console.log(`paymentHistory existe: ${rentBookBefore.paymentHistory ? 'Oui' : 'Non'}`);
            console.log(`paymentHistory est un tableau: ${Array.isArray(rentBookBefore.paymentHistory) ? 'Oui' : 'Non'}`);
            console.log(`Nombre d'entrées: ${Array.isArray(rentBookBefore.paymentHistory) ? rentBookBefore.paymentHistory.length : 'N/A'}`);
            
            // Appliquer la correction
            const rentBook = await RentBook.findById(rentBookId);
            
            // Vérifier et initialiser l'historique des paiements si nécessaire
            let isModified = false;
            
            if (!rentBook.paymentHistory) {
                rentBook.paymentHistory = [];
                isModified = true;
                console.log(`Initialisation de paymentHistory pour ${rentBookId}`);
            }
            
            // Si l'historique est vide, ajouter un paiement initial
            if (Array.isArray(rentBook.paymentHistory) && rentBook.paymentHistory.length === 0) {
                rentBook.paymentHistory.push({
                    date: rentBook.startDate || new Date(),
                    amount: rentBook.monthlyRent || 0,
                    paymentMethod: 'espèces',
                    status: 'payé',
                    reference: `TEST-${rentBook._id.toString().substr(-6)}`,
                    comment: 'Paiement de test généré par le script de vérification'
                });
                
                isModified = true;
                console.log(`Ajout d'un paiement initial pour ${rentBookId}`);
            }
            
            // Sauvegarder les modifications si nécessaire
            if (isModified) {
                rentBook.markModified('paymentHistory');
                await rentBook.save();
                console.log(`RentBook ${rentBookId} mis à jour avec succès`);
            } else {
                console.log(`RentBook ${rentBookId} déjà correctement formaté`);
            }
            
            // Récupérer le RentBook après modification pour vérifier
            const rentBookAfter = await RentBook.findById(rentBookId).lean();
            
            // Afficher l'état après réparation
            console.log('\nÉtat APRÈS:');
            console.log(`paymentHistory existe: ${rentBookAfter.paymentHistory ? 'Oui' : 'Non'}`);
            console.log(`paymentHistory est un tableau: ${Array.isArray(rentBookAfter.paymentHistory) ? 'Oui' : 'Non'}`);
            console.log(`Nombre d'entrées: ${Array.isArray(rentBookAfter.paymentHistory) ? rentBookAfter.paymentHistory.length : 'N/A'}`);
            
            if (Array.isArray(rentBookAfter.paymentHistory) && rentBookAfter.paymentHistory.length > 0) {
                console.log('\nDétail du premier paiement:');
                console.log(JSON.stringify(rentBookAfter.paymentHistory[0], null, 2));
            }
        }
        
        // 2. Test global sur tous les RentBooks (statistiques)
        console.log('\n=== TEST 2: Vérification globale des RentBooks ===');
        
        // Compter les RentBooks avec historique vide ou null
        const totalRentBooks = await RentBook.countDocuments({});
        const emptyHistoryRentBooks = await RentBook.countDocuments({ 
            $or: [
                { paymentHistory: { $exists: false } },
                { paymentHistory: null },
                { paymentHistory: { $size: 0 } }
            ]
        });
        
        console.log(`Nombre total de RentBooks: ${totalRentBooks}`);
        console.log(`RentBooks avec historique vide ou null: ${emptyHistoryRentBooks}`);
        console.log(`Pourcentage de RentBooks problématiques: ${(emptyHistoryRentBooks / totalRentBooks * 100).toFixed(2)}%`);
        
        // Terminer
        console.log('\nTests terminés. Vérifiez les résultats ci-dessus pour vous assurer que tout fonctionne correctement.');
        process.exit(0);
    } catch (error) {
        console.error('Erreur lors de l\'exécution des tests:', error);
        process.exit(1);
    }
}
