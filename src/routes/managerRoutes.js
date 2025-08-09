const express = require('express');
const router = express.Router();
const managerController = require('../controllers/managerController');
const { authenticate, requireManagerAccess } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

// Manager-specific routes
router.get('/site/calculate-total-prices', requireManagerAccess, managerController.calculateTotalPrices);
router.get('/site/materials', requireManagerAccess, managerController.getSiteMaterials);
router.get('/site/statistics', requireManagerAccess, managerController.getSiteStatistics);

module.exports = router; 