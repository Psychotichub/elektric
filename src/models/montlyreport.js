const mongoose = require('mongoose');

// Define the schema for daily report
const totalPriceSchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    materials: [{
        materialName: { type: String, required: true },
        quantity: { type: Number, required: true },
        unit: { type: String, required: true },
        materialPrice: { type: Number, required: true },
        labourPrice: { type: Number, required: true },
        totalPrice: { type: Number, required: true },
        notes: { type: String, default: '' }
    }]
},
{ collection: 'monthlyReport' }); // Ensure the collection name is 'totalPrice'

// Create the model for daily report
const totalPrice = mongoose.model('monthlyReport', totalPriceSchema);

module.exports = totalPrice;
