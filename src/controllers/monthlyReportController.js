const MonthlyReport = require('../models/monthlyReport');  // Import Mongoose model

// Save all data in one document in another collection
const saveMonthlyReport = async (req, res) => {
    try {
        const { materials } = req.body;

        if (!materials || !Array.isArray(materials) || materials.length === 0) {
            return res.status(400).json({ message: 'Invalid materials data.' });
        }

        const newDocument = new MonthlyReport({ materials });
        const savedDocument = await newDocument.save();
        res.status(201).json(savedDocument);
    } catch (error) {
        console.error('Error saving monthly report:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { saveMonthlyReport };
