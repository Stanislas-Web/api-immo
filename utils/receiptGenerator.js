/**
 * Utilitaire pour générer des numéros de reçu uniques
 */

/**
 * Génère un numéro de reçu unique basé sur la date actuelle et un identifiant aléatoire
 * Format: REC-YYYYMMDD-XXXX où XXXX est un nombre aléatoire à 4 chiffres
 * @returns {string} Le numéro de reçu généré
 */
const generateReceiptNumber = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000); // Nombre aléatoire à 4 chiffres
  
  return `REC-${year}${month}${day}-${random}`;
};

module.exports = {
  generateReceiptNumber
};