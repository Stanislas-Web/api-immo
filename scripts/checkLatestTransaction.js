/**
 * Script pour vérifier la dernière transaction effectuée pour un RentBook
 * À exécuter avec: node scripts/checkLatestTransaction.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const RentBook = require('../models/rentBook.model');
const Transaction = require('../models/transaction.model');
const connectDB = require('../config/database');

// ID du RentBook concerné
const RENTBOOK_ID = '67ed3a77b12f468537d8de77';

// Se connecter à MongoDB
connectDB()
.then(() => {
    console.log('Connecté à MongoDB pour vérifier les transactions récentes');
    checkTransactions();
})
.catch(err => {
    console.error('Erreur de connexion à MongoDB:', err);
    process.exit(1);
});

async function checkTransactions() {
    try {
        console.log(`\n=== VÉRIFICATION DES TRANSACTIONS POUR LE RENTBOOK ${RENTBOOK_ID} ===`);
        
        // 1. Récupérer le RentBook
        const rentBook = await RentBook.findById(RENTBOOK_ID).lean();
        
        if (!rentBook) {
            console.error('RentBook non trouvé');
            process.exit(1);
        }
        
        console.log(`RentBook trouvé: ${rentBook._id}`);
        console.log(`Appartement: ${rentBook.apartmentId}`);
        console.log(`Locataire: ${rentBook.tenantId}`);
        console.log(`Loyer mensuel: ${rentBook.monthlyRent} CDF`);
        
        console.log(`\nHistorique des paiements (${rentBook.paymentHistory?.length || 0} paiements):`);
        
        if (rentBook.paymentHistory && rentBook.paymentHistory.length > 0) {
            rentBook.paymentHistory.forEach((payment, index) => {
                console.log(`\nPaiement #${index + 1}:`);
                console.log(`- Date: ${payment.date}`);
                console.log(`- Montant: ${payment.amount}`);
                console.log(`- Méthode: ${payment.paymentMethod}`);
                console.log(`- Statut: ${payment.status}`);
                console.log(`- Référence: ${payment.reference}`);
                console.log(`- Commentaire: ${payment.comment}`);
            });
        } else {
            console.log('Aucun paiement dans l\'historique.');
        }
        
        // 2. Récupérer toutes les transactions pour cet appartement et ce locataire
        const transactions = await Transaction.find({
            apartmentId: rentBook.apartmentId,
            tenant: rentBook.tenantId
        }).sort({ createdAt: -1 });
        
        console.log(`\n=== TRANSACTIONS TROUVÉES (${transactions.length}) ===`);
        
        if (transactions.length > 0) {
            transactions.forEach((tx, index) => {
                console.log(`\nTransaction #${index + 1} (${tx._id}):`);
                console.log(`- Créée le: ${tx.createdAt}`);
                console.log(`- Mise à jour le: ${tx.updatedAt}`);
                console.log(`- Montant: ${tx.amount?.value || 'N/A'} ${tx.amount?.currency || ''}`);
                console.log(`- Statut: ${tx.status}`);
                console.log(`- Type: ${tx.type}`);
                console.log(`- Méthode: ${tx.paymentMethod?.type || 'N/A'}`);
                console.log(`- Référence: ${tx.metadata?.receiptNumber || 'N/A'}`);
                
                // Vérifier si cette transaction est déjà dans l'historique des paiements
                if (rentBook.paymentHistory && rentBook.paymentHistory.length > 0) {
                    const found = rentBook.paymentHistory.some(payment => 
                        payment.reference === tx.metadata?.receiptNumber
                    );
                    
                    console.log(`- Dans l'historique des paiements: ${found ? 'OUI' : 'NON'}`);
                }
            });
        } else {
            console.log('Aucune transaction trouvée.');
        }
        
        // 3. Identifier les transactions manquantes dans l'historique
        console.log(`\n=== TRANSACTIONS MANQUANTES DANS L'HISTORIQUE ===`);
        
        const missingTransactions = transactions.filter(tx => {
            // Ne considérer que les transactions complètes
            if (tx.status !== 'complete') {
                return false;
            }
            
            // Vérifier si cette transaction est déjà dans l'historique
            return !(rentBook.paymentHistory || []).some(payment => 
                payment.reference === tx.metadata?.receiptNumber
            );
        });
        
        if (missingTransactions.length > 0) {
            console.log(`Nombre de transactions manquantes: ${missingTransactions.length}`);
            
            missingTransactions.forEach((tx, index) => {
                console.log(`\nTransaction manquante #${index + 1} (${tx._id}):`);
                console.log(`- Date: ${tx.createdAt}`);
                console.log(`- Montant: ${tx.amount?.value || 'N/A'} ${tx.amount?.currency || ''}`);
                console.log(`- Référence: ${tx.metadata?.receiptNumber || 'N/A'}`);
            });
            
            console.log('\nProbable cause: Ces transactions n\'ont pas été correctement enregistrées dans l\'historique des paiements lors de leur vérification.');
        } else {
            console.log('Aucune transaction complète manquante dans l\'historique des paiements.');
        }
        
        // 4. Vérifier les transactions récentes
        console.log(`\n=== DERNIÈRES TRANSACTIONS (3 dernières) ===`);
        
        const recentTransactions = transactions.slice(0, Math.min(3, transactions.length));
        
        if (recentTransactions.length > 0) {
            recentTransactions.forEach((tx, index) => {
                console.log(`\nTransaction récente #${index + 1} (${tx._id}):`);
                console.log(`- Créée le: ${tx.createdAt}`);
                console.log(`- Statut: ${tx.status}`);
                console.log(`- Référence: ${tx.metadata?.receiptNumber || 'N/A'}`);
                console.log(`- Détails du paiement:`, JSON.stringify({
                    type: tx.paymentMethod?.type,
                    provider: tx.paymentMethod?.provider,
                    status: tx.paymentMethod?.status,
                    providerResponse: tx.paymentMethod?.providerResponse
                }, null, 2));
            });
            
            if (recentTransactions.some(tx => tx.status !== 'complete')) {
                console.log('\nATTENTION: Certaines transactions récentes ne sont pas en statut "complete".');
                console.log('Une transaction doit être en statut "complete" pour être ajoutée à l\'historique des paiements.');
            }
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Erreur lors de la vérification des transactions:', error);
        process.exit(1);
    }
}
