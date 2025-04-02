/**
 * Script pour ajouter la dernière transaction manquante à l'historique des paiements
 * À exécuter avec: node scripts/addLatestPayment.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const RentBook = require('../models/rentBook.model');
const Transaction = require('../models/transaction.model');
const connectDB = require('../config/database');

// ID du RentBook à réparer
const RENTBOOK_ID = '67ed3a77b12f468537d8de77';
// ID de la transaction manquante
const TRANSACTION_ID = '67ed47d217aa845aef0f1cc5';

// Se connecter à MongoDB
connectDB()
.then(() => {
    console.log('Connecté à MongoDB pour ajouter le paiement manquant');
    addLatestPayment();
})
.catch(err => {
    console.error('Erreur de connexion à MongoDB:', err);
    process.exit(1);
});

async function addLatestPayment() {
    try {
        console.log(`\n=== AJOUT DU PAIEMENT MANQUANT POUR LE RENTBOOK ${RENTBOOK_ID} ===`);
        
        // 1. Récupérer le RentBook
        const rentBook = await RentBook.findById(RENTBOOK_ID);
        
        if (!rentBook) {
            console.error('RentBook non trouvé');
            process.exit(1);
        }
        
        console.log(`RentBook trouvé: ${rentBook._id}`);
        console.log(`Nombre initial de paiements: ${rentBook.paymentHistory.length}`);
        
        // 2. Récupérer la transaction manquante
        const transaction = await Transaction.findById(TRANSACTION_ID);
        
        if (!transaction) {
            console.error('Transaction non trouvée');
            process.exit(1);
        }
        
        console.log(`\nTransaction trouvée: ${transaction._id}`);
        console.log(`- Date: ${transaction.createdAt}`);
        console.log(`- Montant: ${transaction.amount?.value || 'N/A'} ${transaction.amount?.currency || ''}`);
        console.log(`- Statut: ${transaction.status}`);
        console.log(`- Référence: ${transaction.metadata?.receiptNumber || 'N/A'}`);
        
        // 3. Vérifier si cette transaction est déjà dans l'historique
        const receiptNumber = transaction.metadata?.receiptNumber || `TRANS-${transaction._id.toString().substr(-6)}`;
        const paymentExists = rentBook.paymentHistory.some(
            payment => payment.reference === receiptNumber
        );
        
        if (paymentExists) {
            console.log('\nCe paiement existe déjà dans l\'historique. Aucune action nécessaire.');
            process.exit(0);
        }
        
        // 4. Déterminer le statut du paiement
        let status = 'payé';
        const txStatus = transaction.paymentMethod?.providerResponse?.transaction?.status;
        
        if (txStatus === '1') {
            status = 'impayé';
            console.log('Transaction marquée comme impayée selon le provider');
        } else if (transaction.amount && transaction.amount.value < rentBook.monthlyRent) {
            status = 'partiel';
            console.log('Paiement partiel détecté');
        }
        
        // 5. Créer l'objet du nouveau paiement
        const newPayment = {
            date: transaction.updatedAt || transaction.createdAt,
            amount: transaction.amount?.value || 0,
            paymentMethod: transaction.paymentMethod?.type || 'mobile_money',
            status: status,
            reference: receiptNumber,
            comment: `Paiement via ${transaction.paymentMethod?.type || 'mobile_money'} - Transaction vérifiée #${receiptNumber}`
        };
        
        console.log('\nAjout du paiement à l\'historique:');
        console.log(`- Date: ${newPayment.date}`);
        console.log(`- Montant: ${newPayment.amount}`);
        console.log(`- Méthode: ${newPayment.paymentMethod}`);
        console.log(`- Statut: ${newPayment.status}`);
        console.log(`- Référence: ${newPayment.reference}`);
        
        // 6. Ajouter le paiement à l'historique
        rentBook.paymentHistory.push(newPayment);
        rentBook.markModified('paymentHistory');
        await rentBook.save();
        
        // 7. Vérification finale
        const updatedRentBook = await RentBook.findById(RENTBOOK_ID);
        
        console.log(`\n=== VÉRIFICATION FINALE ===`);
        console.log(`Nombre initial de paiements: ${rentBook.paymentHistory.length - 1}`);
        console.log(`Nombre de paiements après mise à jour: ${updatedRentBook.paymentHistory.length}`);
        
        const addedPayment = updatedRentBook.paymentHistory.find(payment => payment.reference === receiptNumber);
        if (addedPayment) {
            console.log('\nPaiement ajouté avec succès!');
        } else {
            console.log('\nERREUR: Le paiement n\'a pas été correctement ajouté.');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Erreur lors de l\'ajout du paiement:', error);
        process.exit(1);
    }
}
