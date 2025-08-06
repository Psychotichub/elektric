const TotalPrice = require('../models/totalPrice');

// Get all total prices for the user's site
const getTotalPrices = async (req, res) => {
    try {
        // Filter by user's site and company (ALL users including admins)
        const filter = {
            site: req.user.site,
            company: req.user.company
        };
        
        const totalPrices = await TotalPrice.find(filter);
        res.status(200).json(totalPrices);
    } catch (error) {
        console.error('Error getting total prices:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Add new total prices for the user's site
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
        console.error('Error saving total prices:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update an existing total price for the user's site
const updateTotalPrice = async (req, res) => {
    const { date, materialName, quantity, materialPrice, laborPrice, materialCost, laborCost, totalPrice, location, notes } = req.body;
    const { id } = req.params;

    if (!date || !materialName || !quantity || !materialPrice || !laborPrice) {
        return res.status(400).json({ message: 'Invalid input' });
    }

    try {
        // Build filter to ensure user can only update their own site's data
        const filter = { 
            _id: id,
            site: req.user.site,
            company: req.user.company
        };

        // Find and update the total price by ID
        const updatedTotalPrice = await TotalPrice.findOneAndUpdate(
            filter,
            { date, materialName, quantity, materialPrice, laborPrice, materialCost, laborCost, totalPrice, location, notes },
            { new: true, runValidators: true }
        );

        if (!updatedTotalPrice) {
            return res.status(404).json({ message: 'Total price not found' });
        }

        res.status(200).json(updatedTotalPrice);
    } catch (error) {
        console.error('Error updating total price:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete an existing total price for the user's site
const deleteTotalPrice = async (req, res) => {
    const { id } = req.params;

    try {
        // Build filter to ensure user can only delete their own site's data
        const filter = { 
            _id: id,
            site: req.user.site,
            company: req.user.company
        };

        const deletedTotalPrice = await TotalPrice.findOneAndDelete(filter);

        if (!deletedTotalPrice) {
            return res.status(404).json({ message: 'Total price not found' });
        }

        res.status(204).end();
    } catch (error) {
        console.error('Error deleting total price:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get total prices by date for the user's site
const getTotalPricesByDate = async (req, res) => {
    const { date } = req.params;
    try {
        // Build filter to include user's site
        const filter = { 
            date: new Date(date).toLocaleDateString('en-CA').split('T')[0],
            site: req.user.site,
            company: req.user.company
        };

        const totalPrices = await TotalPrice.find(filter);
        res.status(200).json(totalPrices);
    } catch (error) {
        console.error('Error getting total prices by date:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get total prices by date range for the user's site
const getTotalPricesByDateRange = async (req, res) => {
    const { start, end } = req.query;
    try {
        // Build filter to include user's site
        const filter = {
            date: {
                $gte: new Date(start).toISOString(),
                $lte: new Date(end).toISOString()
            },
            site: req.user.site,
            company: req.user.company
        };

        const totalPrices = await TotalPrice.find(filter);
        res.status(200).json(totalPrices);
    } catch (error) {
        console.error('Error getting total prices by date range:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Calculate total price for the user's site
const calculateTotalPrice = async (req, res) => {
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
        console.error('Error calculating total price:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { 
    getTotalPrices, 
    addTotalPrice, 
    updateTotalPrice, 
    deleteTotalPrice, 
    getTotalPricesByDate, 
    getTotalPricesByDateRange,
    calculateTotalPrice
}; 