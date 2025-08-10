require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const { connectToMongo } = require('./src/db/mongo');
const { connectToMongoose } = require('./src/db/mongoose');
const logger = require('./src/utils/logger');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const settingsRoutes = require('./src/routes/settingsRoutes');
const userAllRoutes = require('./src/routes/userAllRoutes');
const adminSiteRoutes = require('./src/routes/adminSiteRoutes');
const managerRoutes = require('./src/routes/managerRoutes');

// Import middleware (none directly used here)

const app = express();
const port = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            baseUri: ["'self'"],
            fontSrc: ["'self'", 'https:', 'data:'],
            formAction: ["'self'"],
            frameAncestors: ["'self'"],
            imgSrc: ["'self'", 'data:'],
            objectSrc: ["'none'"],
            scriptSrc: ["'self'"],
            scriptSrcAttr: ["'none'"],
            styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
            upgradeInsecureRequests: []
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'same-origin' },
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    ieNoOpen: true,
    noSniff: true,
    permittedCrossDomainPolicies: { permittedPolicies: 'none' },
    referrerPolicy: { policy: 'no-referrer' },
    xssFilter: true
}));

// CORS configuration (tighten origins; allow manager dashboard from same host)
const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
    : (process.env.NODE_ENV === 'production'
        ? ['https://yourdomain.com']
        : ['http://localhost:3000', 'http://127.0.0.1:3000']);

app.use(cors({
    origin: function(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Site', 'X-Company']
}));

// Basic rate limiting
const baseLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false
});
app.use(baseLimiter);

// Tighter limits for auth endpoints
const authLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false
});

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'Public')));
app.use(cookieParser());

// Serve login page
app.get('/login', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'Public', 'html', 'login', 'index.html'));
});

// Serve register page
app.get('/register', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'Public', 'html', 'register', 'index.html'));
});

// Serve manager login page
app.get('/manager-login', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'Public', 'html', 'manager', 'login.html'));
});

// Serve manager dashboard page
app.get('/manager-dashboard', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'Public', 'html', 'manager', 'dashboard.html'));
});

// Serve manager create user page
app.get('/manager-create-user', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'Public', 'html', 'manager', 'create-user.html'));
});

// Manager materials popup page
app.get('/manager-materials', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'Public', 'html', 'manager', 'materials.html'));
});

// Serve settings page
app.get('/settings', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'Public', 'html', 'settings.html'));
});

// Default route serves login page instead of index.html to force authentication
app.get('/', (req, res) => {
    res.redirect('/login');
});

// Serve index.html after authentication (client-side will handle redirection if not authenticated)
app.get('/index', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'Public', 'html', 'index.html'));
});

// Authentication routes (with stricter rate limit)
app.use('/api/auth', authLimiter, authRoutes);

// ===== SETTINGS ROUTES =====
// These routes provide company and site details for users and admins
app.use('/api/settings', settingsRoutes);

// ===== USER-SPECIFIC DATABASE ROUTES (NEW) =====
// These routes ensure ALL user data is saved to their individual database folders
// Re-enabled temporarily for frontend compatibility
app.use('/api/user', userAllRoutes);

// ===== MANAGER ROUTES =====
// These routes provide manager access to site total price management
app.use('/api/manager', managerRoutes);

// ===== ADMIN DATABASE MANAGEMENT ROUTES =====
// Temporarily disabled to prevent conflicts with new site-based system
// app.use('/api/admin', adminDatabaseRoutes);

// ===== ADMIN SITE ROUTES (NEW) =====
// These routes allow site admins to fetch all user data from their site at once
app.use('/api/admin', adminSiteRoutes);

// ===== EXISTING ROUTES (still using single database) =====
// These routes still use the old single database system
// Temporarily disabled to prevent conflicts with new site-based system
// app.use('/material-submit', authenticate, materialRoutes);
// app.use('/daily-reports', authenticate, dailyReportRoutes);
// app.use('/received', authenticate, receivedRoutes);
// app.use('/total-price', authenticate, authorize('admin'), totalPriceRoutes);

// Central error handler with safer messages
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    const status = err.statusCode || 500;
    const isProd = process.env.NODE_ENV === 'production';
    logger.error({ err, status, path: req.path, method: req.method }, 'Request error');
    res.status(status).json({
        message: status === 500 ? 'Internal Server Error' : err.message || 'Request failed',
        ...(isProd ? {} : { error: err.message, stack: err.stack })
    });
});


(async () => {
    try {
        // Connect to MongoDB
        await connectToMongo();
            logger.info('Connected to MongoDB');

        await connectToMongoose();

        // Verify database connection is working
        const mongoose = require('mongoose');
        if (mongoose.connection.readyState === 1) {
            void 0;
        } else {
            throw new Error('Database connection not ready');
        }

        app.listen(port, () => {
            logger.info({ port }, 'Server running');
        });
    } catch (error) {
        logger.error({ err: error }, 'Failed to connect to the databases');
        process.exit(1);
    }
})();
