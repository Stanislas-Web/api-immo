const UtilityBill = require('../models/utility-bill.model');
const Apartment = require('../models/apartment.model');
const Building = require('../models/building.model');
const mongoose = require('mongoose');

/**
 * Créer une nouvelle facture d'eau ou d'électricité et répartir les coûts
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
exports.createUtilityBill = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { buildingId, type, amount } = req.body;

    // Vérifier si l'immeuble existe
    const building = await Building.findById(buildingId);
    if (!building) {
      return res.status(404).json({ message: "Immeuble non trouvé" });
    }

    // Récupérer tous les appartements loués de l'immeuble
    const apartments = await Apartment.find({ buildingId, status: 'loué' });
    
    if (apartments.length === 0) {
      return res.status(400).json({ message: "Aucun appartement loué dans cet immeuble" });
    }

    // Filtrer les appartements selon le type de facture (eau ou électricité)
    const eligibleApartments = apartments.filter(apt => {
      // Vérifier si features existe et est un objet
      if (!apt.features || typeof apt.features !== 'object') {
        return true; // Si pas de features, on considère que les utilités ne sont pas incluses
      }
      
      if (type === 'eau') {
        return apt.features.water !== true; // Exclure les appartements où l'eau est explicitement incluse
      } else if (type === 'electricite') {
        return apt.features.electricity !== true; // Exclure les appartements où l'électricité est explicitement incluse
      }
      return true;
    });

    if (eligibleApartments.length === 0) {
      return res.status(400).json({ 
        message: `Tous les appartements loués ont déjà ${type === 'eau' ? "l'eau" : "l'électricité"} incluse dans leurs caractéristiques` 
      });
    }

    // Calculer le montant par appartement
    const amountPerApartment = amount.value / eligibleApartments.length;

    // Créer les détails de distribution
    const distributionDetails = eligibleApartments.map(apt => ({
      apartmentId: apt._id,
      amount: amountPerApartment,
      isPaid: false
    }));

    // Calculer automatiquement les dates
    const billingDate = new Date(); // Date actuelle
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7); // Date actuelle + 7 jours

    // Créer la facture
    const utilityBill = new UtilityBill({
      buildingId,
      type,
      amount: {
        value: amount.value,
        currency: amount.currency || 'CDF'
      },
      billingDate,
      dueDate,
      isPaid: false,
      distributionDetails
    });

    await utilityBill.save({ session });
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      message: "Facture créée et coûts répartis avec succès",
      utilityBill
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({
      message: "Erreur lors de la création de la facture",
      error: error.message
    });
  }
};

/**
 * Récupérer toutes les factures
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
exports.getAllUtilityBills = async (req, res) => {
  try {
    const utilityBills = await UtilityBill.find()
      .populate('buildingId', 'name address')
      .populate('distributionDetails.apartmentId', 'number type');
    
    res.status(200).json(utilityBills);
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la récupération des factures",
      error: error.message
    });
  }
};

/**
 * Récupérer une facture par son ID
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
exports.getUtilityBillById = async (req, res) => {
  try {
    const utilityBill = await UtilityBill.findById(req.params.id)
      .populate('buildingId', 'name address')
      .populate('distributionDetails.apartmentId', 'number type');
    
    if (!utilityBill) {
      return res.status(404).json({ message: "Facture non trouvée" });
    }
    
    res.status(200).json(utilityBill);
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la récupération de la facture",
      error: error.message
    });
  }
};

/**
 * Récupérer les factures par immeuble
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
exports.getUtilityBillsByBuilding = async (req, res) => {
  try {
    const { buildingId } = req.params;
    
    const utilityBills = await UtilityBill.find({ buildingId })
      .populate('buildingId', 'name address')
      .populate('distributionDetails.apartmentId', 'number type');
    
    res.status(200).json(utilityBills);
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la récupération des factures",
      error: error.message
    });
  }
};

/**
 * Marquer une facture comme payée
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
exports.markUtilityBillAsPaid = async (req, res) => {
  try {
    const utilityBill = await UtilityBill.findById(req.params.id);
    
    if (!utilityBill) {
      return res.status(404).json({ message: "Facture non trouvée" });
    }
    
    utilityBill.isPaid = true;
    utilityBill.paidDate = new Date();
    
    await utilityBill.save();
    
    res.status(200).json({
      message: "Facture marquée comme payée",
      utilityBill
    });
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la mise à jour de la facture",
      error: error.message
    });
  }
};

/**
 * Marquer le paiement d'un appartement pour une facture
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
exports.markApartmentPayment = async (req, res) => {
  try {
    const { id, apartmentId } = req.params;
    
    const utilityBill = await UtilityBill.findById(id);
    
    if (!utilityBill) {
      return res.status(404).json({ message: "Facture non trouvée" });
    }
    
    const distributionDetail = utilityBill.distributionDetails.find(
      detail => detail.apartmentId.toString() === apartmentId
    );
    
    if (!distributionDetail) {
      return res.status(404).json({ message: "Appartement non trouvé dans cette facture" });
    }
    
    distributionDetail.isPaid = true;
    
    // Vérifier si tous les appartements ont payé
    const allPaid = utilityBill.distributionDetails.every(detail => detail.isPaid);
    
    if (allPaid) {
      utilityBill.isPaid = true;
      utilityBill.paidDate = new Date();
    }
    
    await utilityBill.save();
    
    res.status(200).json({
      message: "Paiement de l'appartement enregistré",
      utilityBill
    });
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la mise à jour du paiement",
      error: error.message
    });
  }
};

/**
 * Supprimer une facture
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
exports.deleteUtilityBill = async (req, res) => {
  try {
    const utilityBill = await UtilityBill.findByIdAndDelete(req.params.id);
    
    if (!utilityBill) {
      return res.status(404).json({ message: "Facture non trouvée" });
    }
    
    res.status(200).json({
      message: "Facture supprimée avec succès"
    });
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la suppression de la facture",
      error: error.message
    });
  }
};
