const TotalPrice = require('../models/totalPrice');

// Get all total price data for the user's site
const getTotalPrice = async (req, res) => {
    try {
        // Filter by user's site and company (ALL users including admins)
        const filter = {
            site: req.user.site,
            company: req.user.company
        };
        
        const total = await TotalPrice.find(filter);
        res.status(200).json(total);
    } catch (error) {
        console.error('Error fetching total price:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Add new total price data
const addTotalPrice = async (req, res) => {
    try {
        const { materials } = req.body;

        if (!materials || !Array.isArray(materials) || materials.length === 0) {
            return res.status(400).json({ message: 'Invalid materials data.' });
        }

        // Add site and company information to each material
        const materialsWithSite = materials.map(material => ({
            ...material,
            site: req.user.site,
            company: req.user.company
        }));

        const savedMaterials = await TotalPrice.insertMany(materialsWithSite);
        res.status(201).json(savedMaterials);
    } catch (error) {
        console.error('Error saving total price:', error);
        console.error('Request body:', req.body);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get total price data by date for the user's site
const getTotalPriceByDate = async (req, res) => {
    const { date } = req.params;
    try {
        // Build filter to include user's site
        const filter = { 
            date: new Date(date).toLocaleDateString('en-CA').split('T')[0],
            site: req.user.site,
            company: req.user.company
        };

        const totalPrice = await TotalPrice.find(filter);
        res.status(200).json(totalPrice);
    } catch (error) {
        console.error('Error fetching total price by date:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getDateRange = async (req, res) => {
    const { dateRange } = req.query;
    try {
        // Build filter to include user's site
        const filter = { 
            dateRange,
            site: req.user.site,
            company: req.user.company
        };

        const totalPrice = await TotalPrice.findOne(filter);
        res.json({ exists: !!totalPrice });
    } catch (error) {
        console.error('Error checking date range:', error);
        res.status(500).json({ message: error.message });
    }
};

const getTotalPriceByLocation = async (req, res) => {
    const { location } = req.params;
    try {
        // Build filter to include user's site
        const filter = { 
            location,
            site: req.user.site,
            company: req.user.company
        };

        const totalPrice = await TotalPrice.find(filter);
        res.status(200).json(totalPrice);
    } catch (error) {
        console.error('Error fetching total price by location:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getTotalPrice, addTotalPrice, getTotalPriceByDate, getDateRange, getTotalPriceByLocation };
