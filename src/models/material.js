const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
    materialName: { type: String, required: true, unique: true },
    unit: { type: String, required: true },
    materialPrice: { type: Number, required: true },
    laborPrice: { type: Number, required: true }
}, { collection: 'materialPrice' }); //collection name is materialPrice from the database

const Material = mongoose.model('materialPrice', materialSchema);

module.exports = Material;
