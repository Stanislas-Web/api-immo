const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const connectDB = require('./config/database');
require('dotenv').config();

const app = express();

// Connect to MongoDB
connectDB();

// Configuration Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Gestion Immobilière',
      version: '1.0.0',
      description: 'API RESTful pour la gestion immobilière avec Node.js et MongoDB',
      contact: {
        name: 'Stanislas Makengo',
        email: 'contact@stanislas.com'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://api-immo.com/api/v1' 
          : 'http://localhost:3000/api/v1',
        description: process.env.NODE_ENV === 'production' ? 'Serveur de production' : 'Serveur de développement'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: [
    './models/*.js',
    './routes/*.js'
  ]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Middleware de sécurité
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(mongoSanitize());
app.use(xss());

// Servir les fichiers statiques du dossier uploads
app.use('/uploads', express.static('uploads'));

// Logger
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limite chaque IP à 100 requêtes par windowMs
});
app.use('/api/v1', limiter);

// Documentation Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "API Immobilière - Documentation",
}));

// Routes
app.use('/api/v1/auth', require('./routes/auth.routes'));
app.use('/api/v1/buildings', require('./routes/building.routes'));
app.use('/api/v1/apartments', require('./routes/apartment.routes'));
app.use('/api/v1/listings', require('./routes/listing.routes'));
app.use('/api/v1/transactions', require('./routes/transaction.routes'));
app.use('/api/v1/messages', require('./routes/message.routes'));

// Route par défaut
app.get('/', (req, res) => {
    res.json({
        message: 'Bienvenue sur l\'API de gestion immobilière',
        version: 'v1',
        documentation: '/api-docs'
    });
});

// Gestion des erreurs 404
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: 'Route non trouvée'
    });
});

// Gestion globale des erreurs
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Erreur interne du serveur',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Gestion des erreurs MongoDB
mongoose.connection.on('error', err => {
    console.error('Erreur MongoDB:', err);
});

// Gestion de la déconnexion MongoDB
mongoose.connection.on('disconnected', () => {
    console.log('MongoDB déconnecté');
});

// Gestion de la fermeture propre
process.on('SIGINT', async () => {
    try {
        await mongoose.connection.close();
        console.log('MongoDB déconnecté proprement');
        process.exit(0);
    } catch (err) {
        console.error('Erreur lors de la fermeture de MongoDB:', err);
        process.exit(1);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
    console.log(`Documentation disponible sur http://localhost:${PORT}/api-docs`);
});

module.exports = app;
