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
        url: 'http://localhost:8000',
        description:'Serveur de développement'
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
    './routes/*.js',
    './controllers/*.js'
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
// app.use('/uploads', express.static('uploads'));
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
  customSiteTitle: "API Immobilière - Documentation"
}));

// Routes
app.use('/api/v1/auth', require('./routes/auth.routes'));
app.use('/api/v1/buildings', require('./routes/building.routes'));
app.use('/api/v1/apartments', require('./routes/apartment.routes'));
app.use('/api/v1/listings', require('./routes/listing.routes'));
app.use('/api/v1/transactions', require('./routes/transaction.routes'));
app.use('/api/v1/messages', require('./routes/message.routes'));
app.use('/api/v1/rentbooks', require('./routes/rentBook.routes'));
app.use('/api/v1/users', require('./routes/user.routes'));

// Route par défaut
app.get('/', (req, res) => {
    res.json({
        message: 'Bienvenue sur l\'API de gestion immobilière',
        version: 'v1',
        documentation: '/api-docs'
    });
});

// Gestion des routes non trouvées
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route non trouvée',
        path: req.path
    });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
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

module.exports = app;
