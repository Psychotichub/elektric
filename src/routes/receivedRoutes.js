const express = require('express');
const router = express.Router();
const receivedController = require('../controllers/receivedController');
const { getReceived, addReceived, updateReceived, deleteReceived, getReceivedByDate } = receivedController;

// Routes
router.get('/', getReceived);  // Get all daily reports
router.post('/', addReceived);  // Add a new daily report
router.put('/:id', updateReceived);  // Update a daily report by ID
router.delete('/:id', deleteReceived);  // Delete a daily report by ID
router.get('/date/:date', getReceivedByDate);  // Get daily reports by date

module.exports = router;
