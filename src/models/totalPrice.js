const mongoose = require('mongoose');
const { getDailyReportsByDateRange } = require('../controllers/dailyReportController');

// Define the schema for daily report
const totalPriceSchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    dateRange: { type: String, required: true },
    materialName: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    materialPrice: { type: Number, required: true },
    laborPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    notes: { type: String, default: '' }
},
{ collection: 'totalPrice' });

const totalPrice = mongoose.model('totalPrice', totalPriceSchema);

module.exports = totalPrice;
