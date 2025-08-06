const express = require('express');
const router = express.Router();
const receivedController = require('../controllers/receivedController');
const { getReceived, addReceived, updateReceived, deleteReceived, getReceivedByDate } = receivedController;
const { authenticate, requireSiteAccess } = require('../middleware/auth');

// Apply authentication and site access middleware to all routes
router.use(authenticate);
router.use(requireSiteAccess);

// Routes
router.get('/', getReceived);  // Get all received materials
router.post('/', addReceived);  // Add a new received material
router.put('/:id', updateReceived);  // Update a received material by ID
router.delete('/:id', deleteReceived);  // Delete a received material by ID
router.get('/date/:date', getReceivedByDate);  // Get received materials by date

module.exports = router;
