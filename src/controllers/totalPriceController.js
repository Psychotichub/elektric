const TotalPrice = require('../models/totalPrice');

// Get all daily reports
const getTotalPrice = async (req, res) => {
    try {
        const total = await TotalPrice.find();
        res.status(200).json(total);
    } catch (error) {
        console.error('Error fetching total price:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Add new daily reports
const addTotalPrice = async (req, res) => {
    try {
        const { materials } = req.body;

        if (!materials || !Array.isArray(materials) || materials.length === 0) {
            return res.status(400).json({ message: 'Invalid materials data.' });
        }

        const savedMaterials = await TotalPrice.insertMany(materials);
        res.status(201).json(savedMaterials);
    } catch (error) {
        console.error('Error saving total price:', error);
        console.error('Request body:', req.body);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get daily reports by date
const getTotalPriceByDate = async (req, res) => {
    const { date } = req.params;
    try {
        const totalPrice = await TotalPrice.find({ date: new Date(date).toLocaleDateString('en-CA').split('T')[0] });
        res.status(200).json(totalPrice);
    } catch (error) {
        console.error('Error fetching total price by date:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getDateRange = async (req, res) => {
    const { dateRange } = req.query;
    try {
        const totalPrice = await TotalPrice.findOne({ dateRange });
        res.json({ exists: !!totalPrice });
    } catch (error) {
        console.error('Error checking date range:', error);
        res.status(500).json({ message: error.message });
    }
};

const getTotalPriceByLocation = async (req, res) => {
    const { location } = req.params;
    try {
        const totalPrice = await TotalPrice.find({ location });
        res.status(200).json(totalPrice);
    } catch (error) {
        console.error('Error fetching total price by location:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getTotalPrice, addTotalPrice, getTotalPriceByDate, getDateRange, getTotalPriceByLocation };
