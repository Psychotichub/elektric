const express = require('express');
const router = express.Router();
const totalPriceController = require('../controllers/totalPriceController');
const { getTotalPrice, addTotalPrice, getTotalPriceByDate, getDateRange, getTotalPriceByLocation } = totalPriceController;

// Routes
router.get('/', getTotalPrice);  // Get all daily reports
router.post('/', addTotalPrice);  // Add new total price
router.get('/date/:date', getTotalPriceByDate);  // Get daily reports by date
router.get('/date-range', getDateRange);  // Check if date range exists
router.get('/location/:location', getTotalPriceByLocation);  // Get total price by location
module.exports = router;
