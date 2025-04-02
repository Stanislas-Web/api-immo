/**
 * Script de réparation complète pour tous les RentBooks
 * Ce script corrige tous les historiques de paiement manquants ou vides
 * 
 * À exécuter avec: node scripts/repairAllRentBooks.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const RentBook = require('../models/rentBook.model');
const Transaction = require('../models/transaction.model');
const connectDB = require('../config/database');

// Se connecter à MongoDB
connectDB()
.then(() => {
    console.log('Connecté à MongoDB pour la réparation des RentBooks');
    repairAllRentBooks();
})
.catch(err => {
    console.error('Erreur de connexion à MongoDB:', err);
    process.exit(1);
});

async function repairAllRentBooks() {
    try {
        console.log('=== DÉBUT DE LA RÉPARATION DE TOUS LES RENTBOOKS ===');
        
        // 1. Récupérer tous les RentBooks
        const allRentBooks = await RentBook.find({});
        console.log(`Nombre total de RentBooks à vérifier: ${allRentBooks.length}`);
        
        let reparedCount = 0;
        let alreadyOkCount = 0;
        let failedCount = 0;
        
        // 2. Traiter chaque RentBook
        for (const rentBook of allRentBooks) {
            try {
                let isModified = false;
                
                // Vérifier si l'historique de paiement existe
                if (!rentBook.paymentHistory) {
                    console.log(`RentBook ${rentBook._id}: paymentHistory était null/undefined, initialisation...`);
                    rentBook.paymentHistory = [];
                    isModified = true;
                }
                
                // Vérifier si l'historique est vide
                if (Array.isArray(rentBook.paymentHistory) && rentBook.paymentHistory.length === 0) {
                    console.log(`RentBook ${rentBook._id}: paymentHistory était vide, ajout d'un paiement initial...`);
                    
                    // Rechercher d'abord des transactions existantes
                    const relatedTransactions = await Transaction.find({
                        apartmentId: rentBook.apartmentId,
                        tenant: rentBook.tenantId,
                        status: 'complete'
                    }).sort({ createdAt: -1 }).limit(1);
                    
                    if (relatedTransactions && relatedTransactions.length > 0) {
                        // Utiliser les données de la transaction la plus récente
                        const latestTransaction = relatedTransactions[0];
                        console.log(`  Utilisation des données de la transaction ${latestTransaction._id}`);
                        
                        rentBook.paymentHistory.push({
                            date: latestTransaction.createdAt || new Date(),
                            amount: latestTransaction.amount?.value || rentBook.monthlyRent || 0,
                            paymentMethod: latestTransaction.paymentMethod?.type || 'espèces',
                            status: latestTransaction.amount?.value >= rentBook.monthlyRent ? 'payé' : 'partiel',
                            reference: latestTransaction.metadata?.receiptNumber || `TRANS-${latestTransaction._id.toString().substr(-6)}`,
                            comment: 'Paiement reconstitué à partir des transactions par le script de réparation'
                        });
                    } else {
                        // Créer un paiement par défaut
                        console.log(`  Aucune transaction trouvée, création d'un paiement par défaut`);
                        
                        rentBook.paymentHistory.push({
                            date: rentBook.startDate || new Date(),
                            amount: rentBook.monthlyRent || 0,
                            paymentMethod: 'espèces',
                            status: 'payé',
                            reference: `REPAIR-${rentBook._id.toString().substr(-6)}`,
                            comment: 'Paiement initial généré par le script de réparation'
                        });
                    }
                    
                    isModified = true;
                }
                
                // 3. Sauvegarder les modifications si nécessaire
                if (isModified) {
                    rentBook.markModified('paymentHistory');
                    await rentBook.save();
                    console.log(`RentBook ${rentBook._id}: réparé avec succès`);
                    reparedCount++;
                } else {
                    console.log(`RentBook ${rentBook._id}: déjà correctement formaté`);
                    alreadyOkCount++;
                }
            } catch (error) {
                console.error(`Erreur lors de la réparation du RentBook ${rentBook._id}:`, error);
                failedCount++;
            }
        }
        
        // 4. Afficher le résumé
        console.log('\n=== RÉSUMÉ DE LA RÉPARATION ===');
        console.log(`Total des RentBooks vérifiés: ${allRentBooks.length}`);
        console.log(`RentBooks déjà correctement formatés: ${alreadyOkCount}`);
        console.log(`RentBooks réparés avec succès: ${reparedCount}`);
        console.log(`RentBooks non réparés (erreurs): ${failedCount}`);
        
        // 5. Vérifier si des RentBooks ont encore un historique vide
        const remainingIssues = await RentBook.countDocuments({ 
            $or: [
                { paymentHistory: { $exists: false } },
                { paymentHistory: null },
                { paymentHistory: { $size: 0 } }
            ]
        });
        
        console.log(`\nRentBooks restants avec historique vide ou null: ${remainingIssues}`);
        
        if (remainingIssues > 0) {
            console.log('\nATTENTION: Certains RentBooks n\'ont pas pu être réparés.');
            console.log('Vérifiez les erreurs ci-dessus pour plus de détails.');
        } else {
            console.log('\nSUCCÈS: Tous les RentBooks ont maintenant un historique de paiement valide!');
        }
        
        // Terminer
        console.log('\nRéparation terminée.');
        process.exit(0);
    } catch (error) {
        console.error('Erreur générale lors de la réparation:', error);
        process.exit(1);
    }
}
