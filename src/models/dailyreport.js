const mongoose = require('mongoose');
const dailyReportSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    materialName: { type: String, required: true },
    quantity: { type: Number, required: true },
    location: { type: String, required: true },
    materialPrice: { type: Number, required: null},
    labourPrice: { type: Number, required: null},
    unit: { type: String, required: true },
    notes: { type: String, default: '' }
},

{ collection: 'dailyReports' });
const DailyReport = mongoose.model('dailyReports', dailyReportSchema);

module.exports = DailyReport;
