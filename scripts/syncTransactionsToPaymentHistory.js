/**
 * Script de synchronisation automatique qui vérifie toutes les transactions complètes
 * et s'assure qu'elles sont présentes dans l'historique des paiements des RentBooks.
 * 
 * À exécuter avec: node scripts/syncTransactionsToPaymentHistory.js
 * Peut être programmé pour s'exécuter périodiquement via cron ou un autre planificateur.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const RentBook = require('../models/rentBook.model');
const Transaction = require('../models/transaction.model');
const connectDB = require('../config/database');

// Nombre maximal de jours à vérifier (pour limiter les performances)
const MAX_DAYS_TO_CHECK = 30;

// Se connecter à MongoDB
connectDB()
.then(() => {
    console.log('Connecté à MongoDB pour la synchronisation des transactions');
    syncTransactions();
})
.catch(err => {
    console.error('Erreur de connexion à MongoDB:', err);
    process.exit(1);
});

async function syncTransactions() {
    try {
        console.log(`\n=== SYNCHRONISATION DES TRANSACTIONS AVEC L'HISTORIQUE DES PAIEMENTS ===`);
        console.log(`Date d'exécution: ${new Date().toISOString()}`);
        
        // 1. Définir la période à vérifier (ex: les 30 derniers jours)
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - MAX_DAYS_TO_CHECK);
        
        console.log(`Période vérifiée: depuis ${startDate.toISOString()}`);
        
        // 2. Récupérer toutes les transactions complètes récentes
        const transactions = await Transaction.find({
            status: 'complete',
            updatedAt: { $gte: startDate }
        }).sort({ createdAt: -1 });
        
        console.log(`\nTransactions complètes trouvées: ${transactions.length}`);
        
        if (transactions.length === 0) {
            console.log('Aucune transaction à synchroniser.');
            process.exit(0);
        }
        
        // 3. Parcourir les transactions et vérifier/mettre à jour les paiements
        let addedCount = 0;
        let alreadyExistsCount = 0;
        let errorCount = 0;
        
        console.log('\nVérification et mise à jour des paiements:');
        
        for (const transaction of transactions) {
            if (transaction.type !== 'loyer') {
                console.log(`Transaction ${transaction._id} ignorée (type: ${transaction.type})`);
                continue;
            }
            
            try {
                // Trouver le RentBook correspondant
                let rentBook = await RentBook.findOne({
                    apartmentId: transaction.apartmentId,
                    tenantId: transaction.tenant,
                    status: 'actif'
                });
                
                if (!rentBook) {
                    // Deuxième tentative avec seulement l'ID de l'appartement
                    rentBook = await RentBook.findOne({
                        apartmentId: transaction.apartmentId,
                        status: 'actif'
                    });
                }
                
                if (!rentBook) {
                    console.log(`❌ Aucun RentBook trouvé pour la transaction ${transaction._id} (appartement: ${transaction.apartmentId})`);
                    errorCount++;
                    continue;
                }
                
                // Vérifier si le paiement existe déjà
                const receiptNumber = transaction.metadata?.receiptNumber || `TRANS-${transaction._id.toString().substr(-6)}`;
                const paymentExists = rentBook.paymentHistory.some(
                    payment => payment.reference === receiptNumber
                );
                
                if (paymentExists) {
                    console.log(`↩️ Le paiement pour la transaction ${transaction._id} existe déjà (référence: ${receiptNumber})`);
                    alreadyExistsCount++;
                    continue;
                }
                
                // Déterminer le statut du paiement
                let status = 'payé';
                const txStatus = transaction.paymentMethod?.providerResponse?.transaction?.status;
                
                if (txStatus === '1') {
                    status = 'impayé';
                } else if (transaction.amount && transaction.amount.value < rentBook.monthlyRent) {
                    status = 'partiel';
                }
                
                // Créer le paiement
                const newPayment = {
                    date: transaction.updatedAt || transaction.createdAt,
                    amount: transaction.amount?.value || 0,
                    paymentMethod: transaction.paymentMethod?.type || 'mobile_money',
                    status: status,
                    reference: receiptNumber,
                    comment: `Paiement via ${transaction.paymentMethod?.type || 'mobile_money'} - Ajouté par script de synchronisation #${receiptNumber}`
                };
                
                // Ajouter le paiement et sauvegarder
                rentBook.paymentHistory.push(newPayment);
                rentBook.markModified('paymentHistory');
                await rentBook.save();
                
                console.log(`✅ Paiement ajouté pour la transaction ${transaction._id} (RentBook: ${rentBook._id}, référence: ${receiptNumber})`);
                addedCount++;
            } catch (error) {
                console.error(`❌ Erreur lors du traitement de la transaction ${transaction._id}:`, error.message);
                errorCount++;
            }
        }
        
        // 4. Afficher un résumé des résultats
        console.log(`\n=== RÉSUMÉ DE LA SYNCHRONISATION ===`);
        console.log(`Transactions vérifiées: ${transactions.length}`);
        console.log(`Paiements ajoutés: ${addedCount}`);
        console.log(`Paiements déjà existants: ${alreadyExistsCount}`);
        console.log(`Erreurs rencontrées: ${errorCount}`);
        
        console.log('\nSynchronisation terminée avec succès!');
        process.exit(0);
    } catch (error) {
        console.error('Erreur lors de la synchronisation des transactions:', error);
        process.exit(1);
    }
}
