const express = require('express');
const router = express.Router();
const monthlyReportController = require('../controllers/monthlyReportController');
const { saveMonthlyReport } = monthlyReportController;

// Routes
router.post('/save-monthly', saveMonthlyReport);  // Add new route to save all data in monthly report

module.exports = router;
