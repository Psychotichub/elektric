const express = require('express');
const router = express.Router();
const totalPriceController = require('../controllers/totalPriceController');
const { getTotalPrice, addTotalPrice, getTotalPriceByDate, getDateRange, getTotalPriceByLocation } = totalPriceController;
const { authenticate, requireSiteAccess } = require('../middleware/auth');

// Apply authentication and site access middleware to all routes
router.use(authenticate);
router.use(requireSiteAccess);

// Routes
router.get('/', getTotalPrice);  // Get all total price data
router.post('/', addTotalPrice);  // Add new total price
router.get('/date/:date', getTotalPriceByDate);  // Get total price by date
router.get('/date-range', getDateRange);  // Check if date range exists
router.get('/location/:location', getTotalPriceByLocation);  // Get total price by location
module.exports = router;
