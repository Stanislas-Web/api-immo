const mongoose = require('mongoose');
const UtilityBill = require('../models/utility-bill.model');
const Apartment = require('../models/apartment.model');
const Building = require('../models/building.model');
const User = require('../models/user.model');
const Transaction = require('../models/transaction.model');
const axios = require('axios');

// Configuration FlexPay (identique à celle du payment.controller.js)
const FLEXPAY_CONFIG = {
  baseURL: 'https://backend.flexpay.cd/api/rest/v1',
  merchant: 'DIGITALJOURNEY',
  token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJcL2xvZ2luIiwicm9sZXMiOlsiTUVSQ0hBTlQiXSwiZXhwIjoxODA1OTg0NzU1LCJzdWIiOiIwMWRmMTkxNTdiNzA3NTY2NWY0YmJhNTBlYmU3NTMyZiJ9.z3d6avQpsKbAMAdvnUAeNsjgqnr_K4-O05CkeFqVXng'
};

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

/**
 * Récupérer toutes les factures d'utilité pour un appartement spécifique
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
exports.getUtilityBillsByApartment = async (req, res) => {
  try {
    const { apartmentId } = req.params;

    // Vérifier si l'appartement existe
    const apartment = await Apartment.findById(apartmentId);
    if (!apartment) {
      return res.status(404).json({ message: "Appartement non trouvé" });
    }

    // Rechercher toutes les factures qui contiennent cet appartement dans leurs distributionDetails
    const utilityBills = await UtilityBill.find({
      'distributionDetails.apartmentId': apartmentId
    }).populate('buildingId', 'name address');

    // Si aucune facture n'est trouvée
    if (utilityBills.length === 0) {
      return res.status(200).json({ 
        message: "Aucune facture d'utilité trouvée pour cet appartement",
        utilityBills: []
      });
    }

    // Formater les résultats pour n'inclure que les détails pertinents pour cet appartement
    const formattedBills = utilityBills.map(bill => {
      // Trouver les détails spécifiques à cet appartement
      const apartmentDetails = bill.distributionDetails.find(
        detail => detail.apartmentId.toString() === apartmentId
      );

      return {
        billId: bill._id,
        buildingName: bill.buildingId ? bill.buildingId.name : 'Non spécifié',
        buildingAddress: bill.buildingId ? bill.buildingId.address : 'Non spécifié',
        type: bill.type,
        totalAmount: bill.amount,
        apartmentAmount: apartmentDetails ? apartmentDetails.amount : 0,
        isPaid: apartmentDetails ? apartmentDetails.isPaid : false,
        billingDate: bill.billingDate,
        dueDate: bill.dueDate
      };
    });

    res.status(200).json({
      message: "Factures d'utilité récupérées avec succès",
      count: utilityBills.length,
      utilityBills: formattedBills
    });
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la récupération des factures d'utilité",
      error: error.message
    });
  }
};

/**
 * Marquer une facture d'utilité comme payée pour un appartement spécifique
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
exports.markUtilityBillAsPaidForApartment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { billId, apartmentId } = req.params;

    // Vérifier si la facture existe
    const utilityBill = await UtilityBill.findById(billId);
    if (!utilityBill) {
      return res.status(404).json({ message: "Facture non trouvée" });
    }

    // Vérifier si l'appartement fait partie de la distribution
    const apartmentDetailIndex = utilityBill.distributionDetails.findIndex(
      detail => detail.apartmentId.toString() === apartmentId
    );

    if (apartmentDetailIndex === -1) {
      return res.status(404).json({ message: "Cet appartement n'est pas concerné par cette facture" });
    }

    // Marquer comme payé pour cet appartement
    utilityBill.distributionDetails[apartmentDetailIndex].isPaid = true;

    // Vérifier si tous les appartements ont payé
    const allPaid = utilityBill.distributionDetails.every(detail => detail.isPaid);
    if (allPaid) {
      utilityBill.isPaid = true;
    }

    await utilityBill.save({ session });
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: "Facture marquée comme payée pour cet appartement",
      isPaid: utilityBill.distributionDetails[apartmentDetailIndex].isPaid,
      billFullyPaid: utilityBill.isPaid
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({
      message: "Erreur lors du marquage de la facture comme payée",
      error: error.message
    });
  }
};

/**
 * Initier le paiement d'une facture d'utilité
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
exports.initiateUtilityBillPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Récupérer les données du corps de la requête
    const { utilityBillId, phone, amount, devise = 'CDF', metadata = {} } = req.body;

    // Validation des données requises
    if (!utilityBillId || !phone || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Les champs utilityBillId, phone et amount sont requis'
      });
    }

    // Recherche de la facture d'utilité
    const utilityBill = await UtilityBill.findById(utilityBillId);
    if (!utilityBill) {
      return res.status(404).json({
        success: false,
        message: 'Facture d\'utilité non trouvée'
      });
    }

    // Vérifier si la facture est déjà payée
    if (utilityBill.isPaid) {
      return res.status(400).json({
        success: false,
        message: 'Cette facture a déjà été payée'
      });
    }

    // Récupérer les informations du bâtiment et du propriétaire
    const building = await Building.findById(utilityBill.buildingId).populate('owner');
    if (!building) {
      return res.status(404).json({
        success: false,
        message: 'Bâtiment non trouvé'
      });
    }

    const landlord = building.owner;
    if (!landlord) {
      return res.status(404).json({
        success: false,
        message: 'Propriétaire non trouvé'
      });
    }

    // Récupérer les informations du locataire 
    const tenant = req.user;
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Locataire non trouvé'
      });
    }

    // Récupérer l'appartement du locataire dans ce bâtiment
    const apartment = await Apartment.findOne({
      buildingId: building._id,
      currentTenant: tenant._id
    });

    if (!apartment) {
      return res.status(404).json({
        success: false,
        message: 'Appartement non trouvé pour ce locataire dans ce bâtiment'
      });
    }

    // Générer un numéro de référence unique pour la transaction
    const reference = `UTIL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Créer un enregistrement de transaction
    const transaction = new Transaction({
      apartmentId: apartment._id,
      buildingId: building._id,
      landlord: landlord._id,
      tenant: tenant._id,
      amount: {
        value: amount,
        currency: devise
      },
      type: 'facture', // Utiliser 'facture' pour les factures d'utilité
      status: 'en_attente',
      paymentMethod: {
        type: 'mobile_money',
        provider: 'flexpay',
        status: 'pending'
      },
      createdBy: req.user._id,
      metadata: {
        ...metadata,
        utilityBillId: utilityBill._id,
        isUtilityPayment: true,
        receiptNumber: reference,
        billType: utilityBill.type,
        billMonth: utilityBill.month,
        billYear: utilityBill.year
      }
    });

    await transaction.save({ session });

    // Créer les données pour la requête FlexPay
    const baseUrl = process.env.API_URL || 'http://localhost:8000';
    const callbackUrl = `${baseUrl}/api/v1/transactions/check/${transaction._id}`;
    const cancelUrl = `${baseUrl}/cancel`;
    const returnUrl = `${baseUrl}/return`;

    // Obtenir le token d'authentification pour FlexPay
    const token = FLEXPAY_CONFIG.token;

    // Préparer les données pour FlexPay
    const flexPayData = {
      merchant: FLEXPAY_CONFIG.merchant,
      type: "1", // 1 pour paiement mobile
      amount: amount.toString(),
      currency: devise,
      phone,
      reference,
      callbackUrl,
      cancelUrl,
      returnUrl,
      description: `Paiement facture ${utilityBill.type} - ${utilityBill.month}/${utilityBill.year}`
    };

    console.log('Données envoyées à FlexPay:', JSON.stringify(flexPayData));

    // Faire la requête à FlexPay
    const flexPayResponse = await axios.post(
      `${FLEXPAY_CONFIG.baseURL}/paymentService`,
      flexPayData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Réponse de FlexPay:', JSON.stringify(flexPayResponse.data));

    // Mettre à jour la transaction avec la réponse de FlexPay
    transaction.paymentMethod.providerResponse = flexPayResponse.data;
    await transaction.save({ session });

    // Confirmer la transaction
    await session.commitTransaction();
    session.endSession();

    // Planifier la vérification automatique après 5 minutes
    const orderNumber = flexPayResponse.data.orderNumber;
    setTimeout(() => {
      verifyUtilityPaymentStatus(orderNumber, utilityBill._id);
    }, 5 * 60 * 1000);

    // Retourner la réponse
    return res.status(200).json({
      success: true,
      message: 'Paiement initié avec succès',
      data: {
        transaction: {
          _id: transaction._id,
          reference,
          amount,
          devise,
          status: transaction.status
        },
        paymentData: flexPayResponse.data
      }
    });

  } catch (error) {
    // En cas d'erreur, annuler la transaction
    await session.abortTransaction();
    session.endSession();

    console.error('Erreur lors de l\'initiation du paiement de la facture:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'initiation du paiement',
      error: error.message
    });
  }
};

/**
 * Fonction utilitaire pour vérifier le statut d'un paiement de facture d'utilité
 * @param {String} orderNumber - Numéro de commande FlexPay
 * @param {String} utilityBillId - ID de la facture d'utilité
 */
const verifyUtilityPaymentStatus = async (orderNumber, utilityBillId) => {
  try {
    console.log(`Vérification automatique du paiement de facture pour orderNumber: ${orderNumber}`);
    const response = await axios.get(`${FLEXPAY_CONFIG.baseURL}/check/${orderNumber}`, {
      headers: {
        'Authorization': `Bearer ${FLEXPAY_CONFIG.token}`
      }
    });

    console.log('Réponse de la vérification du paiement:', JSON.stringify(response.data));
    const flexPayResponse = response.data;

    // Si le paiement est réussi (code = 0)
    if (flexPayResponse.code === '0') {
      console.log('Paiement confirmé avec succès (code 0)');
      
      // Trouver la transaction liée à ce paiement
      const transaction = await Transaction.findOne({
        'paymentMethod.providerResponse.orderNumber': orderNumber
      });
      
      if (!transaction) {
        console.error('Transaction non trouvée pour orderNumber:', orderNumber);
        return {
          success: false,
          message: 'Transaction non trouvée',
          data: null
        };
      }

      console.log('Transaction trouvée, mise à jour du statut...');
      transaction.status = 'complete';
      transaction.paymentMethod.status = 'completed';
      transaction.paymentMethod.providerResponse = flexPayResponse;

      await transaction.save();
      console.log('Transaction mise à jour avec succès');

      // Marquer la facture d'utilité comme payée UNIQUEMENT si le paiement est réussi
      const utilityBill = await UtilityBill.findById(utilityBillId);
      if (utilityBill && !utilityBill.isPaid) {
        utilityBill.isPaid = true;
        utilityBill.paidDate = new Date();
        await utilityBill.save();
        console.log(`Facture d'utilité ${utilityBillId} marquée comme payée suite à un paiement réussi`);
      }

      return {
        success: true,
        message: 'Transaction complétée avec succès',
        data: transaction
      };
    } else {
      console.log(`Paiement non complété. Code: ${flexPayResponse.code}, Message: ${flexPayResponse.message}`);
      
      // Mettre à jour la transaction pour refléter l'échec
      const transaction = await Transaction.findOne({
        'paymentMethod.providerResponse.orderNumber': orderNumber
      });
      
      if (transaction) {
        transaction.status = 'echoue';
        transaction.paymentMethod.status = 'failed';
        transaction.paymentMethod.providerResponse = flexPayResponse;
        await transaction.save();
        console.log(`Transaction ${transaction._id} marquée comme échouée`);
      }

      return {
        success: false,
        message: 'La transaction est en attente ou a échoué',
        data: {
          status: flexPayResponse.code,
          message: flexPayResponse.message
        }
      };
    }
  } catch (error) {
    console.error('Erreur lors de la vérification du paiement:', error);
    return {
      success: false,
      message: 'Erreur lors de la vérification du paiement',
      error: error.message
    };
  }
};
