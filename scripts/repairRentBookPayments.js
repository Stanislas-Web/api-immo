/**
 * Script pour réparer l'historique des paiements d'un RentBook en ajoutant les transactions manquantes
 * À exécuter avec: node scripts/repairRentBookPayments.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const RentBook = require('../models/rentBook.model');
const Transaction = require('../models/transaction.model');
const connectDB = require('../config/database');

// ID du RentBook à réparer
const RENTBOOK_ID = '67ed3a77b12f468537d8de77';

// Se connecter à MongoDB
connectDB()
.then(() => {
    console.log('Connecté à MongoDB pour la réparation des paiements');
    repairPayments();
})
.catch(err => {
    console.error('Erreur de connexion à MongoDB:', err);
    process.exit(1);
});

async function repairPayments() {
    try {
        console.log(`\n=== RÉPARATION DES PAIEMENTS POUR LE RENTBOOK ${RENTBOOK_ID} ===`);
        
        // 1. Récupérer le RentBook
        const rentBook = await RentBook.findById(RENTBOOK_ID);
        
        if (!rentBook) {
            console.error('RentBook non trouvé');
            process.exit(1);
        }
        
        console.log(`RentBook trouvé: ${rentBook._id}`);
        console.log(`Nombre initial de paiements: ${rentBook.paymentHistory.length}`);
        
        // 2. Récupérer toutes les transactions complètes pour cet appartement/locataire
        const transactions = await Transaction.find({
            apartmentId: rentBook.apartmentId,
            tenant: rentBook.tenantId,
            status: 'complete'
        }).sort({ createdAt: -1 });
        
        console.log(`\nTransactions complètes trouvées: ${transactions.length}`);
        
        // 3. Identifier les transactions manquantes dans l'historique
        const existingReferences = new Set(
            rentBook.paymentHistory.map(payment => payment.reference)
        );
        
        const missingTransactions = transactions.filter(tx => 
            !existingReferences.has(tx.metadata?.receiptNumber)
        );
        
        console.log(`Transactions manquantes: ${missingTransactions.length}`);
        
        if (missingTransactions.length === 0) {
            console.log('\nAucune transaction manquante à ajouter.');
            process.exit(0);
        }
        
        // 4. Ajouter les paiements manquants
        console.log('\nAjout des paiements manquants:');
        
        for (const tx of missingTransactions) {
            // Déterminer le statut du paiement
            let status = 'payé';
            if (tx.amount && tx.amount.value < rentBook.monthlyRent) {
                status = 'partiel';
            }
            
            // Vérifier si le paiement a réussi selon la réponse du provider
            if (tx.paymentMethod?.providerResponse?.transaction?.status === '1') {
                status = 'impayé';
            }
            
            // Créer l'objet du nouveau paiement
            const receiptNumber = tx.metadata?.receiptNumber || `TRANS-${tx._id.toString().substr(-6)}`;
            const newPayment = {
                date: tx.updatedAt || tx.createdAt,
                amount: tx.amount?.value || 0,
                paymentMethod: tx.paymentMethod?.type || 'mobile_money',
                status: status,
                reference: receiptNumber,
                comment: `Paiement via ${tx.paymentMethod?.type || 'mobile_money'} - Transaction vérifiée #${receiptNumber}`
            };
            
            // Ajouter le paiement à l'historique
            rentBook.paymentHistory.push(newPayment);
            console.log(`- Ajout du paiement avec référence: ${receiptNumber}`);
        }
        
        // 5. Sauvegarder les modifications
        rentBook.markModified('paymentHistory');
        await rentBook.save();
        
        // 6. Vérification finale
        const updatedRentBook = await RentBook.findById(RENTBOOK_ID);
        
        console.log(`\n=== VÉRIFICATION FINALE ===`);
        console.log(`Nombre initial de paiements: ${rentBook.paymentHistory.length - missingTransactions.length}`);
        console.log(`Nombre de paiements après réparation: ${updatedRentBook.paymentHistory.length}`);
        console.log(`Nombre de paiements ajoutés: ${missingTransactions.length}`);
        
        console.log('\nHistorique des paiements mis à jour:');
        updatedRentBook.paymentHistory.forEach((payment, index) => {
            console.log(`\nPaiement #${index + 1}:`);
            console.log(`- Date: ${payment.date}`);
            console.log(`- Montant: ${payment.amount}`);
            console.log(`- Méthode: ${payment.paymentMethod}`);
            console.log(`- Statut: ${payment.status}`);
            console.log(`- Référence: ${payment.reference}`);
        });
        
        console.log('\nRéparation terminée avec succès!');
        process.exit(0);
    } catch (error) {
        console.error('Erreur lors de la réparation des paiements:', error);
        process.exit(1);
    }
}
