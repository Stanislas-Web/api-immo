const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Créer les dossiers de destination s'ils n'existent pas
const createDestinationDirectories = () => {
    const directories = ['uploads', 'uploads/apartments', 'uploads/buildings'];
    
    directories.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
};

// Créer les dossiers nécessaires
createDestinationDirectories();

// Filtre pour n'accepter que les images
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Le fichier doit être une image'), false);
    }
};

// Configuration pour les limites
const limits = {
    fileSize: 5 * 1024 * 1024, // Limite la taille à 5MB
    files: 10 // Limite le nombre de fichiers à 10
};

// Configuration du stockage pour les appartements
const apartmentStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/apartments');
    },
    filename: (req, file, cb) => {
        // Génère un nom de fichier unique avec timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Configuration du stockage pour les bâtiments
const buildingStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/buildings');
    },
    filename: (req, file, cb) => {
        // Génère un nom de fichier unique avec timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Configuration de multer pour les appartements
const apartmentUpload = multer({
    storage: apartmentStorage,
    fileFilter: fileFilter,
    limits: limits
});

// Configuration de multer pour les bâtiments
const buildingUpload = multer({
    storage: buildingStorage,
    fileFilter: fileFilter,
    limits: limits
});

module.exports = {
    apartment: apartmentUpload,
    building: buildingUpload
};
