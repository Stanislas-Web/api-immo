/**
 * Script pour vérifier les paiements d'un RentBook spécifique et identifier les doublons
 * À exécuter avec: node scripts/checkNewRentBookPayments.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const RentBook = require('../models/rentBook.model');
const Transaction = require('../models/transaction.model');
const connectDB = require('../config/database');

// ID du RentBook problématique avec doublons
const RENTBOOK_ID = '67ed3a77b12f468537d8de77';

// Se connecter à MongoDB
connectDB()
.then(() => {
    console.log('Connecté à MongoDB pour la vérification du RentBook');
    checkRentBook();
})
.catch(err => {
    console.error('Erreur de connexion à MongoDB:', err);
    process.exit(1);
});

async function checkRentBook() {
    try {
        // 1. Récupérer le RentBook
        console.log(`\n=== ANALYSE DU RENTBOOK ${RENTBOOK_ID} ===`);
        
        const rentBook = await RentBook.findById(RENTBOOK_ID).lean();
        
        if (!rentBook) {
            console.log('RentBook non trouvé!');
            process.exit(1);
        }
        
        console.log('\nInformations de base:');
        console.log(`- Appartement: ${rentBook.apartmentId}`);
        console.log(`- Locataire: ${rentBook.tenantId}`);
        console.log(`- Loyer mensuel: ${rentBook.monthlyRent}`);
        console.log(`- Statut: ${rentBook.status}`);
        
        // 2. Vérifier l'historique des paiements
        if (!rentBook.paymentHistory || !Array.isArray(rentBook.paymentHistory)) {
            console.log('\nL\'historique des paiements n\'existe pas ou n\'est pas un tableau');
            process.exit(1);
        }
        
        const paymentCount = rentBook.paymentHistory.length;
        console.log(`\nNombre total de paiements: ${paymentCount}`);
        
        // 3. Analyser les références pour trouver des doublons
        const referenceMap = new Map();
        const duplicates = [];
        
        rentBook.paymentHistory.forEach((payment, index) => {
            const ref = payment.reference;
            
            if (referenceMap.has(ref)) {
                duplicates.push({
                    reference: ref,
                    indexes: [referenceMap.get(ref), index],
                    payments: [
                        rentBook.paymentHistory[referenceMap.get(ref)],
                        payment
                    ]
                });
            } else {
                referenceMap.set(ref, index);
            }
        });
        
        console.log(`\nNombre de références uniques: ${referenceMap.size}`);
        console.log(`Nombre de doublons détectés: ${duplicates.length}`);
        
        // 4. Afficher les détails des paiements et doublons
        console.log('\n=== LISTE DES PAIEMENTS ===');
        rentBook.paymentHistory.forEach((payment, index) => {
            console.log(`\nPaiement #${index + 1}:`);
            console.log(`- Date: ${payment.date}`);
            console.log(`- Montant: ${payment.amount}`);
            console.log(`- Méthode: ${payment.paymentMethod}`);
            console.log(`- Statut: ${payment.status}`);
            console.log(`- Référence: ${payment.reference}`);
            console.log(`- Commentaire: ${payment.comment}`);
        });
        
        if (duplicates.length > 0) {
            console.log('\n=== DÉTAIL DES DOUBLONS ===');
            duplicates.forEach((dup, index) => {
                console.log(`\nDoublon #${index + 1} (Référence: ${dup.reference}):`);
                console.log(`Positions dans l'historique: ${dup.indexes.join(', ')}`);
                
                dup.payments.forEach((payment, i) => {
                    console.log(`\n  Paiement ${i + 1}:`);
                    console.log(`  - Date: ${payment.date}`);
                    console.log(`  - Montant: ${payment.amount}`);
                    console.log(`  - Commentaire: ${payment.comment}`);
                });
            });
        }
        
        // 5. Comparer avec les transactions réelles
        console.log('\n=== RECHERCHE DES TRANSACTIONS LIÉES ===');
        
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
        
        // 6. Proposer une solution
        console.log('\n=== CONCLUSION ET SOLUTION PROPOSÉE ===');
        
        if (transactions.length < paymentCount) {
            console.log('Problème: Il y a plus de paiements dans l\'historique que de transactions réelles.');
            
            if (duplicates.length > 0) {
                console.log('Des doublons ont été détectés. La solution recommandée est d\'utiliser le script de nettoyage des doublons.');
                console.log('node scripts/cleanDuplicatePayments.js');
            } else {
                console.log('Aucun doublon avec la même référence n\'a été détecté, mais il y a des paiements supplémentaires.');
                console.log('Ces paiements pourraient avoir été ajoutés manuellement ou par un autre processus.');
            }
        } else if (transactions.length === paymentCount) {
            if (duplicates.length > 0) {
                console.log('Situation étrange: Le nombre de transactions correspond au nombre de paiements, mais il y a des doublons.');
                console.log('Certains paiements légitimes pourraient être manquants. Vérifiez le script de nettoyage et de synchronisation.');
            } else {
                console.log('Le nombre de transactions correspond au nombre de paiements et il n\'y a pas de doublons.');
                console.log('Tout semble correct du point de vue comptable, mais vérifiez les détails de chaque paiement.');
            }
        } else {
            console.log('Il y a plus de transactions que de paiements dans l\'historique.');
            console.log('Certaines transactions ne sont pas reflétées dans l\'historique des paiements.');
            console.log('Utilisez le script de synchronisation des paiements pour mettre à jour l\'historique.');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Erreur lors de la vérification du RentBook:', error);
        process.exit(1);
    }
}
