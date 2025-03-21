const Tax = require('../models/tax.model');
const Apartment = require('../models/apartment.model');

exports.createTax = async (req, res) => {
    try {
        // Vérifier si l'appartement existe
        const apartment = await Apartment.findById(req.body.apartmentId);
        if (!apartment) {
            return res.status(404).json({
                success: false,
                message: 'Appartement non trouvé'
            });
        }

        // Vérifier si l'appartement est soumis à une taxe
        if (!apartment.taxe) {
            return res.status(400).json({
                success: false,
                message: 'Cet appartement n\'est pas soumis à une taxe'
            });
        }

        const tax = new Tax(req.body);
        await tax.save();

        res.status(201).json({
            success: true,
            data: tax
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création de la taxe',
            error: error.message
        });
    }
};

exports.getAllTaxes = async (req, res) => {
    try {
        const query = {};

        // Filtres
        if (req.query.apartmentId) query.apartmentId = req.query.apartmentId;
        if (req.query.status) query.status = req.query.status;

        const taxes = await Tax.find(query)
            .populate('apartmentId', 'number type')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: taxes.length,
            data: taxes
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des taxes',
            error: error.message
        });
    }
};

exports.getTaxById = async (req, res) => {
    try {
        const tax = await Tax.findById(req.params.id)
            .populate('apartmentId', 'number type');

        if (!tax) {
            return res.status(404).json({
                success: false,
                message: 'Taxe non trouvée'
            });
        }

        res.status(200).json({
            success: true,
            data: tax
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de la taxe',
            error: error.message
        });
    }
};

exports.updateTax = async (req, res) => {
    try {
        const tax = await Tax.findById(req.params.id);

        if (!tax) {
            return res.status(404).json({
                success: false,
                message: 'Taxe non trouvée'
            });
        }

        // Si le statut est mis à jour à "paid", ajouter la date de paiement
        if (req.body.status === 'paid' && tax.status !== 'paid') {
            req.body.paymentDate = new Date();
        }

        const updatedTax = await Tax.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('apartmentId', 'number type');

        res.status(200).json({
            success: true,
            data: updatedTax
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour de la taxe',
            error: error.message
        });
    }
};

exports.deleteTax = async (req, res) => {
    try {
        const tax = await Tax.findById(req.params.id);

        if (!tax) {
            return res.status(404).json({
                success: false,
                message: 'Taxe non trouvée'
            });
        }

        await tax.remove();

        res.status(200).json({
            success: true,
            message: 'Taxe supprimée avec succès'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression de la taxe',
            error: error.message
        });
    }
};

exports.getTaxesByApartment = async (req, res) => {
    try {
        const { apartmentId } = req.params;

        // Vérifier si l'appartement existe
        const apartment = await Apartment.findById(apartmentId);
        if (!apartment) {
            return res.status(404).json({
                success: false,
                message: 'Appartement non trouvé'
            });
        }

        // Récupérer toutes les taxes de l'appartement
        const taxes = await Tax.find({ apartmentId })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: taxes.length,
            data: taxes
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des taxes',
            error: error.message
        });
    }
};
