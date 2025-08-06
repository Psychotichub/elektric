const express = require('express');
const router = express.Router();
const monthlyReportController = require('../controllers/monthlyReportController');
const { saveMonthlyReport } = monthlyReportController;
const { authenticate, requireSiteAccess } = require('../middleware/auth');

// Apply authentication and site access middleware to all routes
router.use(authenticate);
router.use(requireSiteAccess);

// Routes
router.post('/save-monthly', saveMonthlyReport);  // Add new route to save all data in monthly report

module.exports = router;
