/**
 * Script pour nettoyer les paiements dupliqués dans un RentBook
 * À exécuter avec: node scripts/cleanDuplicatePayments.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const RentBook = require('../models/rentBook.model');
const Transaction = require('../models/transaction.model');
const connectDB = require('../config/database');

// ID du RentBook à nettoyer
const RENTBOOK_ID = '67ed3a77b12f468537d8de77';

// Se connecter à MongoDB
connectDB()
.then(() => {
    console.log('Connecté à MongoDB pour le nettoyage des paiements dupliqués');
    cleanDuplicates();
})
.catch(err => {
    console.error('Erreur de connexion à MongoDB:', err);
    process.exit(1);
});

async function cleanDuplicates() {
    try {
        console.log(`\n=== NETTOYAGE DES PAIEMENTS DUPLIQUÉS POUR LE RENTBOOK ${RENTBOOK_ID} ===`);
        
        // 1. Récupérer le RentBook
        const rentBook = await RentBook.findById(RENTBOOK_ID);
        
        if (!rentBook) {
            console.log('RentBook non trouvé!');
            process.exit(1);
        }
        
        console.log(`RentBook trouvé: ${rentBook._id}`);
        console.log(`Nombre initial de paiements: ${rentBook.paymentHistory ? rentBook.paymentHistory.length : 0}`);
        
        // 2. S'assurer que l'historique est un tableau
        if (!rentBook.paymentHistory || !Array.isArray(rentBook.paymentHistory)) {
            console.log('L\'historique des paiements n\'existe pas ou n\'est pas un tableau');
            rentBook.paymentHistory = [];
            console.log('Initialisation d\'un tableau vide pour l\'historique');
        }
        
        if (rentBook.paymentHistory.length === 0) {
            console.log('L\'historique des paiements est vide, rien à nettoyer');
            process.exit(0);
        }
        
        // 3. Récupérer les transactions existantes pour les conserver
        const transactions = await Transaction.find({
            apartmentId: rentBook.apartmentId,
            tenant: rentBook.tenantId,
            status: 'complete'
        }).sort({ createdAt: -1 });
        
        console.log(`\nTransactions trouvées: ${transactions.length}`);
        
        // Ensemble des références à conserver
        const transactionRefs = new Set(
            transactions.map(tx => tx.metadata?.receiptNumber || `TRANS-${tx._id.toString().substr(-6)}`)
        );
        
        console.log(`Références de transactions à conserver: ${Array.from(transactionRefs).join(', ')}`);
        
        // 4. Créer un nouvel historique de paiements sans doublons
        const uniqueReferences = new Set();
        const newPaymentHistory = [];
        
        // D'abord les paiements liés aux transactions réelles
        rentBook.paymentHistory.forEach(payment => {
            const ref = payment.reference;
            
            // Si c'est une référence de transaction ou si c'est un paiement initial unique
            if (transactionRefs.has(ref) || (ref.startsWith('INIT-') && !uniqueReferences.has(ref))) {
                uniqueReferences.add(ref);
                newPaymentHistory.push(payment);
            }
        });
        
        // 5. Mettre à jour le RentBook
        console.log(`\nNouvel historique de paiements:`);
        console.log(`- Nombre initial: ${rentBook.paymentHistory.length}`);
        console.log(`- Nombre après nettoyage: ${newPaymentHistory.length}`);
        console.log(`- Paiements supprimés: ${rentBook.paymentHistory.length - newPaymentHistory.length}`);
        
        // Remplacer l'historique
        rentBook.paymentHistory = newPaymentHistory;
        rentBook.markModified('paymentHistory');
        
        // Sauvegarder les modifications
        await rentBook.save();
        console.log('\nRentBook sauvegardé avec succès!');
        
        // 6. Vérification finale
        const updatedRentBook = await RentBook.findById(RENTBOOK_ID).lean();
        
        console.log(`\n=== VÉRIFICATION FINALE ===`);
        console.log(`Nombre de paiements après sauvegarde: ${updatedRentBook.paymentHistory.length}`);
        
        updatedRentBook.paymentHistory.forEach((payment, index) => {
            console.log(`\nPaiement #${index + 1}:`);
            console.log(`- Date: ${payment.date}`);
            console.log(`- Montant: ${payment.amount}`);
            console.log(`- Méthode: ${payment.paymentMethod}`);
            console.log(`- Référence: ${payment.reference}`);
        });
        
        console.log('\nNettoyage terminé avec succès!');
        process.exit(0);
    } catch (error) {
        console.error('Erreur lors du nettoyage des paiements:', error);
        process.exit(1);
    }
}
