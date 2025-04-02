/**
 * Script pour tester le nouveau workflow des paiements
 * À exécuter avec: node scripts/testPaymentWorkflow.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const RentBook = require('../models/rentBook.model');
const Transaction = require('../models/transaction.model');
const Apartment = require('../models/apartment.model');
const connectDB = require('../config/database');

// ID du RentBook de test
const RENTBOOK_ID = '67ed3a77b12f468537d8de77';

// Se connecter à MongoDB
connectDB()
.then(() => {
    console.log('Connecté à MongoDB pour le test du workflow de paiement');
    runTest();
})
.catch(err => {
    console.error('Erreur de connexion à MongoDB:', err);
    process.exit(1);
});

async function generateReceiptNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000);
    return `REC-${year}${month}${day}-${random}`;
}

async function runTest() {
    try {
        console.log(`\n=== DÉBUT DU TEST DE WORKFLOW DE PAIEMENT ===`);
        
        // 1. Récupérer le RentBook pour le test
        const rentBook = await RentBook.findById(RENTBOOK_ID);
        if (!rentBook) {
            console.error('RentBook de test non trouvé');
            process.exit(1);
        }
        
        // Afficher l'information sur le RentBook
        console.log(`RentBook trouvé: ${rentBook._id}`);
        console.log(`Appartement: ${rentBook.apartmentId}`);
        console.log(`Locataire: ${rentBook.tenantId}`);
        console.log(`État initial de l'historique des paiements: ${rentBook.paymentHistory.length} paiements`);
        
        // 2. Créer une nouvelle transaction
        console.log(`\n=== ÉTAPE 1: CRÉATION D'UNE NOUVELLE TRANSACTION ===`);
        
        const receiptNumber = await generateReceiptNumber();
        console.log(`Numéro de reçu généré: ${receiptNumber}`);
        
        const transaction = new Transaction({
            type: 'loyer',
            amount: {
                value: rentBook.monthlyRent,
                currency: 'CDF'
            },
            apartmentId: rentBook.apartmentId,
            tenant: rentBook.tenantId,
            // Simuler un propriétaire
            landlord: new mongoose.Types.ObjectId('67b33d286ad7e80edc2b7af3'), // Remplacer par un vrai ID
            paymentMethod: {
                type: 'mobile_money',
                provider: 'flexpay',
                status: 'pending',
                providerResponse: {
                    orderNumber: 'TEST-' + Date.now(),
                    message: 'En attente de vérification'
                }
            },
            metadata: {
                receiptNumber: receiptNumber
            }
        });
        
        await transaction.save();
        console.log(`Transaction créée avec succès: ${transaction._id}`);
        console.log(`Status: ${transaction.status}`);
        
        // 3. Vérifier l'historique des paiements (devrait être inchangé)
        console.log(`\n=== ÉTAPE 2: VÉRIFICATION DE L'HISTORIQUE DES PAIEMENTS APRÈS CRÉATION ===`);
        
        const rentBookAfterCreate = await RentBook.findById(RENTBOOK_ID);
        console.log(`Nombre de paiements après création: ${rentBookAfterCreate.paymentHistory.length}`);
        
        if (rentBookAfterCreate.paymentHistory.length === rentBook.paymentHistory.length) {
            console.log('✅ TEST RÉUSSI: L\'historique des paiements n\'a pas été modifié à la création');
        } else {
            console.log('❌ TEST ÉCHOUÉ: L\'historique des paiements a été modifié à la création');
        }
        
        // 4. Simuler la vérification de la transaction (comme si FlexPay confirmait)
        console.log(`\n=== ÉTAPE 3: SIMULATION DE LA VÉRIFICATION DE LA TRANSACTION ===`);
        
        // Mettre à jour la transaction comme si elle était vérifiée et complétée
        transaction.status = 'complete';
        transaction.paymentMethod.status = 'completed';
        transaction.paymentMethod.providerResponse = {
            ...transaction.paymentMethod.providerResponse,
            code: '0',
            message: 'Paiement réussi'
        };
        
        await transaction.save();
        console.log(`Transaction mise à jour avec statut: ${transaction.status}`);
        
        // 5. Mettre à jour manuellement le RentBook (simulation de ce que fait checkTransaction)
        let rentBookToUpdate = await RentBook.findOne({
            apartmentId: transaction.apartmentId,
            tenantId: transaction.tenant,
            status: 'actif'
        });
        
        if (!rentBookToUpdate) {
            rentBookToUpdate = await RentBook.findOne({
                apartmentId: transaction.apartmentId,
                status: 'actif'
            });
        }
        
        if (rentBookToUpdate) {
            // Déterminer le statut du paiement
            let status = 'payé';
            if (transaction.amount && transaction.amount.value < rentBookToUpdate.monthlyRent) {
                status = 'partiel';
            }
            
            // Créer l'objet du nouveau paiement
            const newPayment = {
                date: new Date(),
                amount: transaction.amount?.value || 0,
                paymentMethod: transaction.paymentMethod?.type || 'mobile_money',
                status: status,
                reference: receiptNumber,
                comment: `Paiement via ${transaction.paymentMethod?.type || 'mobile_money'} - Transaction vérifiée #${receiptNumber}`
            };
            
            // S'assurer que paymentHistory existe
            if (!rentBookToUpdate.paymentHistory) {
                rentBookToUpdate.paymentHistory = [];
            }
            
            // Vérifier si un paiement avec cette référence existe déjà
            const paymentExists = rentBookToUpdate.paymentHistory.some(
                payment => payment.reference === receiptNumber
            );
            
            // Ajouter le paiement uniquement s'il n'existe pas déjà
            if (!paymentExists) {
                rentBookToUpdate.paymentHistory.push(newPayment);
                rentBookToUpdate.markModified('paymentHistory');
                await rentBookToUpdate.save();
                console.log('✅ Paiement ajouté à l\'historique avec succès');
            } else {
                console.log('❌ Ce paiement existe déjà dans l\'historique');
            }
        } else {
            console.error('Aucun RentBook trouvé pour cette transaction');
        }
        
        // 6. Vérifier l'historique des paiements final
        console.log(`\n=== ÉTAPE 4: VÉRIFICATION FINALE DE L'HISTORIQUE DES PAIEMENTS ===`);
        
        const rentBookFinal = await RentBook.findById(RENTBOOK_ID);
        console.log(`Nombre de paiements après vérification: ${rentBookFinal.paymentHistory.length}`);
        
        if (rentBookFinal.paymentHistory.length > rentBook.paymentHistory.length) {
            console.log('✅ TEST RÉUSSI: L\'historique des paiements a été mis à jour après la vérification');
            
            // Afficher les détails du nouveau paiement
            const latestPayment = rentBookFinal.paymentHistory[rentBookFinal.paymentHistory.length - 1];
            console.log('\nDétails du nouveau paiement:');
            console.log(`- Date: ${latestPayment.date}`);
            console.log(`- Montant: ${latestPayment.amount}`);
            console.log(`- Méthode: ${latestPayment.paymentMethod}`);
            console.log(`- Statut: ${latestPayment.status}`);
            console.log(`- Référence: ${latestPayment.reference}`);
            console.log(`- Commentaire: ${latestPayment.comment}`);
        } else {
            console.log('❌ TEST ÉCHOUÉ: L\'historique des paiements n\'a pas été mis à jour après la vérification');
        }
        
        console.log(`\n=== TEST TERMINÉ ===`);
        process.exit(0);
    } catch (error) {
        console.error('Erreur lors du test:', error);
        process.exit(1);
    }
}
