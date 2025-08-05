const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const cookieParser = require('cookie-parser');

// Existing routes (still using single database)
const dailyReportRoutes = require('./src/routes/dailyReportRoutes');
const materialRoutes = require('./src/routes/materialRoutes');
const receivedRoutes = require('./src/routes/receivedRoutes');
const totalPriceRoutes = require('./src/routes/totalPriceRoutes');
const authRoutes = require('./src/routes/authRoutes');

// New user-specific database routes (ensures data goes to user's database folder)
const userAllRoutes = require('./src/routes/userAllRoutes');
const adminDatabaseRoutes = require('./src/routes/adminDatabaseRoutes');
const adminSiteRoutes = require('./src/routes/adminSiteRoutes');

// New site-based database routes
const siteAdminRoutes = require('./src/routes/siteAdminRoutes');

const { connectToMongo } = require('./src/db/mongo'); //optional
const { connectToMongoose } = require('./src/db/mongoose');
const { default: helmet } = require('helmet');
const { authenticate, authorize } = require('./src/middleware/auth');

const app = express();
const port = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());

app.use((req, res, next) => {
    res.setHeader('Cache-control', 'no-cache, no-store');
    next();
})

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'Public')));
app.use(cookieParser());

// Serve login page
app.get('/login', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'Public', 'html', 'login.html'));
});

// Serve register page
app.get('/register', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'Public', 'html', 'register.html'));
});

// Serve admin site total price management page
app.get('/admin-site-totalprice', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'Public', 'html', 'admin-site-totalprice.html'));
});

// Default route serves login page instead of index.html to force authentication
app.get('/', (req, res) => {
    res.redirect('/login');
});

// Serve index.html after authentication (client-side will handle redirection if not authenticated)
app.get('/index', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'Public', 'html', 'index.html'));
});

// Authentication routes
app.use('/api/auth', authRoutes);

// ===== USER-SPECIFIC DATABASE ROUTES (NEW) =====
// These routes ensure ALL user data is saved to their individual database folders
// Re-enabled temporarily for frontend compatibility
app.use('/api/user', userAllRoutes);

// ===== ADMIN DATABASE MANAGEMENT ROUTES =====
// Temporarily disabled to prevent conflicts with new site-based system
// app.use('/api/admin', adminDatabaseRoutes);

// ===== ADMIN SITE ROUTES (NEW) =====
// These routes allow site admins to fetch all user data from their site at once
app.use('/api/admin', adminSiteRoutes);

// ===== SITE ADMIN ROUTES (NEW) =====
// These routes manage site-based database structure
app.use('/api/site-admin', siteAdminRoutes);

// ===== EXISTING ROUTES (still using single database) =====
// These routes still use the old single database system
// Temporarily disabled to prevent conflicts with new site-based system
// app.use('/material-submit', authenticate, materialRoutes);
// app.use('/daily-reports', authenticate, dailyReportRoutes);
// app.use('/received', authenticate, receivedRoutes);
// app.use('/total-price', authenticate, authorize('admin'), totalPriceRoutes);

app.use((err, _, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
    next();
});


(async () => {
    try {
        // Connect to MongoDB
        await connectToMongo();
        console.log('✅ Connected to MongoDB');

        await connectToMongoose();
        console.log('✅ Connected to Mongoose');

        // Verify database connection is working
        const mongoose = require('mongoose');
        if (mongoose.connection.readyState === 1) {
            console.log('✅ Database connection verified');
        } else {
            throw new Error('Database connection not ready');
        }

        app.listen(port, () => {
            console.log(`🚀 Server running on http://localhost:${port}`);
        });
    } catch (error) {
        console.error('❌ Failed to connect to the databases:', error);
        process.exit(1);
    }
})();
