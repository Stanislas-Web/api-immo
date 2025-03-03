const multer = require('multer');

// Utiliser le stockage en mémoire au lieu du disque
const storage = multer.memoryStorage();

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

// Configuration de multer avec stockage en mémoire
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: limits
});

module.exports = {
    apartment: upload,
    building: upload
};
