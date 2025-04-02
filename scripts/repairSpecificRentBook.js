/**
 * Script pour réparer spécifiquement un RentBook problématique
 * Ce script ajoute tous les paiements manquants d'après les transactions existantes
 * 
 * À exécuter avec: node scripts/repairSpecificRentBook.js
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
    console.log('Connecté à MongoDB pour la réparation du RentBook problématique');
    repairRentBook();
})
.catch(err => {
    console.error('Erreur de connexion à MongoDB:', err);
    process.exit(1);
});

async function repairRentBook() {
    try {
        console.log(`\n=== DÉBUT DE LA RÉPARATION DU RENTBOOK ${PROBLEMATIC_RENTBOOK_ID} ===\n`);
        
        // 1. Récupérer le RentBook
        const rentBook = await RentBook.findById(PROBLEMATIC_RENTBOOK_ID);
        
        if (!rentBook) {
            console.log('RentBook non trouvé!');
            process.exit(1);
        }
        
        console.log('RentBook trouvé:');
        console.log(`- Appartement: ${rentBook.apartmentId}`);
        console.log(`- Locataire: ${rentBook.tenantId}`);
        console.log(`- Loyer mensuel: ${rentBook.monthlyRent}`);
        console.log(`- Nombre de paiements actuels: ${rentBook.paymentHistory ? rentBook.paymentHistory.length : 0}\n`);
        
        // 2. Récupérer toutes les transactions associées
        const transactions = await Transaction.find({
            apartmentId: rentBook.apartmentId,
            tenant: rentBook.tenantId,
            status: 'complete',
            type: 'loyer'
        }).sort({ createdAt: -1 });
        
        console.log(`Nombre de transactions trouvées: ${transactions.length}\n`);
        
        // 3. S'assurer que paymentHistory est initialisé
        if (!rentBook.paymentHistory) {
            console.log('Initialisation de paymentHistory comme un tableau vide');
            rentBook.paymentHistory = [];
        }
        
        // 4. Créer un ensemble des références déjà présentes dans l'historique
        const existingReferences = new Set(
            rentBook.paymentHistory.map(payment => payment.reference)
        );
        
        console.log(`Références déjà présentes: ${existingReferences.size}`);
        existingReferences.forEach(ref => console.log(`- ${ref}`));
        
        // 5. Ajouter chaque transaction manquante à l'historique
        let addedCount = 0;
        
        for (const transaction of transactions) {
            const receiptNumber = transaction.metadata?.receiptNumber || `TRANS-${transaction._id.toString().substr(-6)}`;
            
            // Vérifier si cette transaction est déjà dans l'historique
            if (!existingReferences.has(receiptNumber)) {
                console.log(`\nAjout du paiement avec référence: ${receiptNumber}`);
                
                // Déterminer le statut du paiement
                let status = 'payé';
                if (transaction.amount && transaction.amount.value < rentBook.monthlyRent) {
                    status = 'partiel';
                }
                
                // Créer le nouveau paiement
                const newPayment = {
                    date: transaction.createdAt || new Date(),
                    amount: transaction.amount?.value || 0,
                    paymentMethod: transaction.paymentMethod?.type || 'mobile_money',
                    status: status,
                    reference: receiptNumber,
                    comment: `Paiement via ${transaction.paymentMethod?.type || 'mobile_money'} - Ajouté par script de réparation #${receiptNumber}`
                };
                
                // Ajouter à l'historique
                rentBook.paymentHistory.push(newPayment);
                addedCount++;
            } else {
                console.log(`Paiement avec référence ${receiptNumber} déjà présent`);
            }
        }
        
        // 6. Sauvegarder les modifications
        if (addedCount > 0) {
            console.log(`\nAjout de ${addedCount} nouveaux paiements à l'historique`);
            rentBook.markModified('paymentHistory');
            await rentBook.save();
            console.log(`RentBook sauvegardé avec succès`);
        } else {
            console.log(`\nAucun nouveau paiement à ajouter`);
        }
        
        // 7. Vérifier l'état final
        const updatedRentBook = await RentBook.findById(PROBLEMATIC_RENTBOOK_ID).lean();
        
        console.log(`\n=== ÉTAT FINAL DU RENTBOOK ===`);
        console.log(`Nombre de paiements: ${updatedRentBook.paymentHistory.length}`);
        console.log(`\nListe des références de paiement:`);
        updatedRentBook.paymentHistory.forEach((payment, index) => {
            console.log(`${index + 1}. ${payment.reference} (${payment.date.toISOString().split('T')[0]})`);
        });
        
        console.log('\nRéparation terminée avec succès!');
        process.exit(0);
    } catch (error) {
        console.error('Erreur lors de la réparation du RentBook:', error);
        process.exit(1);
    }
}
