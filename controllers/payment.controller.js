const axios = require('axios');
const Transaction = require('../models/transaction.model');
const RentBook = require('../models/rentBook.model');
const { generateReceiptNumber } = require('../utils/receiptGenerator');
const path = require('path');

const FLEXPAY_CONFIG = {
  baseURL: 'https://backend.flexpay.cd/api/rest/v1',
  merchant: 'DIGITALJOURNEY',
  token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJcL2xvZ2luIiwicm9sZXMiOlsiTUVSQ0hBTlQiXSwiZXhwIjoxODA1OTg0NzU1LCJzdWIiOiIwMWRmMTkxNTdiNzA3NTY2NWY0YmJhNTBlYmU3NTMyZiJ9.z3d6avQpsKbAMAdvnUAeNsjgqnr_K4-O05CkeFqVXng'
};

const initiatePayment = async (req, res) => {
  try {
    const { 
      rentBookId,
      type,
      amount,
      phone,
      devise = 'CDF', 
      metadata
    } = req.body;

    // Trouver le carnet de loyer
    const rentBook = await RentBook.findById(rentBookId);
    if (!rentBook) {
      return res.status(404).json({ message: 'Carnet de loyer introuvable' });
    }

    const paymentDate = new Date();

    // Créer une nouvelle transaction avec un numéro de reçu unique
    const transactionMetadata = {
      ...metadata,
      receiptNumber: metadata?.receiptNumber || generateReceiptNumber()
    };
    
    const transaction = new Transaction({
      apartmentId: rentBook.apartmentId,
      tenant: rentBook.tenantId,
      landlord: rentBook.ownerId,
      type,
      amount: {
        value: amount,
        currency: devise 
      },
      paymentDate,
      metadata: transactionMetadata,
      status: 'en_attente',
      paymentMethod: {
        type: 'mobile_money',
        provider: 'flexpay',
        phone,
        status: 'pending'
      }
    });

    await transaction.save();

    // Prepare FlexPay request
    // Format de référence: T{3 premiers caractères de transaction ID}R{3 premiers caractères de rentBook ID}_{timestamp court}
    const transactionIdShort = transaction._id.toString().substring(0, 3);
    const rentBookIdShort = rentBook._id.toString().substring(0, 3);
    
    // Créer un timestamp court basé sur l'heure et les secondes
    const now = new Date();
    const timeStamp = `${now.getHours()}${now.getMinutes()}${now.getSeconds()}`;
    
    // Combiner les éléments pour créer une référence unique
    const reference = `T${transactionIdShort}R${rentBookIdShort}_${timeStamp}`.substring(0, 49);
    
    const paymentData = {
      merchant: FLEXPAY_CONFIG.merchant,
      type: "1",
      phone,
      reference,
      amount: amount.toString(),
      currency: devise,
      callbackUrl: `http://68.183.30.146:8000/api/v1/payments/callback`
    };

    // Call FlexPay API
    const response = await axios({
      method: 'post',
      url: `${FLEXPAY_CONFIG.baseURL}/paymentService`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FLEXPAY_CONFIG.token}`
      },
      data: paymentData
    });

    // Assurer que la référence est toujours valide (max 50 caractères)
    // FlexPay pourrait potentiellement renvoyer sa propre référence
    let finalReference = reference;
    if (response.data && response.data.reference) {
      finalReference = response.data.reference.toString().substring(0, 49);
    }

    // Update transaction with payment reference
    transaction.paymentMethod.reference = finalReference;
    transaction.paymentMethod.providerResponse = response.data;
    await transaction.save();

    // Add pending payment to rent book history
    rentBook.paymentHistory.push({
      date: paymentDate,
      amount: amount,
      paymentMethod: 'mobile_money',
      transactionId: transaction._id,
      status: 'pending',
      reference: finalReference,
      type
    });
    await rentBook.save();

    res.json({
      message: 'Paiement initié avec succès',
      data: {
        transaction: transaction,
        rentBook: {
          id: rentBook._id,
          apartment: rentBook.apartmentId,
          tenant: rentBook.tenantId,
          owner: rentBook.ownerId
        },
        flexPayResponse: response.data
      }
    });

  } catch (error) {
    console.error('Erreur d\'initiation du paiement:', error);
    res.status(500).json({
      message: 'Échec de l\'initiation du paiement',
      error: error.message
    });
  }
};

const handleCallback = async (req, res) => {
  try {
    const {
      code,
      reference,
      provider_reference,
      orderNumber,
      amount,
      amountCustomer,
      phone,
      currency,
      createdAt,
      channel
    } = req.body;

    // Vérifier si la transaction existe
    const transaction = await Transaction.findOne({
      'paymentMethod.reference': reference
    });

    if (!transaction) {
      return res.status(404).json({ 
        success: false,
        message: 'Transaction introuvable',
        reference
      });
    }

    // Mettre à jour le statut de la transaction en fonction du code
    const isSuccessful = code === 0;
    transaction.paymentMethod.status = isSuccessful ? 'completed' : 'failed';
    transaction.status = isSuccessful ? 'complete' : 'echoue';
    transaction.paymentMethod.providerResponse = {
      ...req.body,
      provider_reference,
      orderNumber,
      amountCustomer,
      channel,
      processedAt: createdAt
    };
    await transaction.save();

    // Mettre à jour l'historique des paiements dans le carnet de loyer
    const rentBook = await RentBook.findOne({
      'paymentHistory.reference': reference
    });

    if (rentBook) {
      const paymentIndex = rentBook.paymentHistory.findIndex(p => p.reference === reference);
      if (paymentIndex !== -1) {
        rentBook.paymentHistory[paymentIndex].status = isSuccessful ? 'payé' : 'impayé';
        await rentBook.save();
      }
    }

    // Répondre avec succès
    res.status(200).json({
      success: true,
      message: isSuccessful ? 'Paiement traité avec succès' : 'Échec du paiement',
      data: {
        transactionId: transaction._id,
        reference,
        status: transaction.status,
        amount,
        currency
      }
    });

  } catch (error) {
    console.error('Erreur de traitement du callback:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du traitement du callback',
      error: error.message
    });
  }
};

const getUserTransactions = async (req, res) => {
  try {
    const userId = req.user._id; // Obtenu du middleware auth
    const { status, type, startDate, endDate, page = 1, limit = 10 } = req.query;

    // Construire le filtre de base
    let filter = {
      $or: [
        { tenant: userId },     // Transactions où l'utilisateur est locataire
        { landlord: userId }    // Transactions où l'utilisateur est propriétaire
      ]
    };

    // Ajouter des filtres optionnels
    if (status) {
      filter.status = status;
    }
    if (type) {
      filter.type = type;
    }
    if (startDate || endDate) {
      filter.paymentDate = {};
      if (startDate) {
        filter.paymentDate.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.paymentDate.$lte = new Date(endDate);
      }
    }

    // Calculer le nombre total pour la pagination
    const total = await Transaction.countDocuments(filter);

    // Calculer les sommes des loyers par devise
    const aggregationResult = await Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            currency: '$amount.currency',
            type: '$type'
          },
          total: { $sum: '$amount.value' }
        }
      }
    ]);

    // Initialiser les sommes à 0
    let sommeLoyerUSD = 0;
    let sommeLoyerCDF = 0;
    let sommeFactureUSD = 0;
    let sommeFactureCDF = 0;

    // Assigner les sommes selon la devise et le type
    aggregationResult.forEach(result => {
      if (result._id.currency === 'USD') {
        if (result._id.type === 'loyer') {
          sommeLoyerUSD = result.total;
        } else if (result._id.type === 'facture') {
          sommeFactureUSD = result.total;
        }
      } else if (result._id.currency === 'CDF') {
        if (result._id.type === 'loyer') {
          sommeLoyerCDF = result.total;
        } else if (result._id.type === 'facture') {
          sommeFactureCDF = result.total;
        }
      }
    });

    // Récupérer les transactions avec pagination
    const transactions = await Transaction.find(filter)
      .sort({ paymentDate: -1 }) // Tri par date décroissante
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('apartmentId', 'title address') // Informations basiques de l'appartement
      .populate('tenant', 'firstName lastName phone email') // Informations du locataire
      .populate('landlord', 'firstName lastName phone email'); // Informations du propriétaire

    res.status(200).json({
      success: true,
      message: 'Transactions récupérées avec succès',
      data: {
        transactions,
        sommeLoyerUSD,
        sommeLoyerCDF,
        sommeFactureUSD,
        sommeFactureCDF,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des transactions',
      error: error.message
    });
  }
};

// Simple endpoints pour accéder aux pages HTML
const getSuccessPage = (req, res) => {
  return res.sendFile(path.join(__dirname, '/success.html'));
};

const getErrorPage = (req, res) => {
  return res.sendFile(path.join(__dirname, '/error.html'));
};

module.exports = {
  initiatePayment,
  handleCallback,
  getUserTransactions,
  getSuccessPage,
  getErrorPage
};
