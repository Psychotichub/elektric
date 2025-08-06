const Received = require('../models/received');

// Get all received items for the user's site
const getReceivedItems = async (req, res) => {
    try {
        // Filter by user's site and company (ALL users including admins)
        const filter = {
            site: req.user.site,
            company: req.user.company
        };
        
        const receivedItems = await Received.find(filter);
        res.status(200).json(receivedItems);
    } catch (error) {
        console.error('Error getting received items:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Add new received items for the user's site
const addReceivedItem = async (req, res) => {
    const { materials } = req.body;

    if (!materials || !Array.isArray(materials) || materials.length === 0) {
        return res.status(400).json({ message: 'Invalid input' });
    }

    try {
        // Add site and company information to each material
        const materialsWithSite = materials.map(material => ({
            ...material,
            site: req.user.site,
            company: req.user.company
        }));

        // Create new received items
        const newReceivedItems = await Received.insertMany(materialsWithSite);
        res.status(201).json(newReceivedItems);
    } catch (error) {
        console.error('Error adding received items:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update an existing received item for the user's site
const updateReceivedItem = async (req, res) => {
    const { date, materialName, quantity, supplier, notes, location } = req.body;
    const { id } = req.params;

    if (!date || !materialName || !quantity || !supplier) {
        return res.status(400).json({ message: 'Invalid input' });
    }

    try {
        // Build filter to ensure user can only update their own site's data
        const filter = { 
            _id: id,
            site: req.user.site,
            company: req.user.company
        };

        // Find and update the received item by ID
        const updatedReceivedItem = await Received.findOneAndUpdate(
            filter,
            { date, materialName, quantity, supplier, notes, location },
            { new: true, runValidators: true }
        );

        if (!updatedReceivedItem) {
            return res.status(404).json({ message: 'Received item not found' });
        }

        res.status(200).json(updatedReceivedItem);
    } catch (error) {
        console.error('Error updating received item:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete an existing received item for the user's site
const deleteReceivedItem = async (req, res) => {
    const { id } = req.params;

    try {
        // Build filter to ensure user can only delete their own site's data
        const filter = { 
            _id: id,
            site: req.user.site,
            company: req.user.company
        };

        const deletedReceivedItem = await Received.findOneAndDelete(filter);

        if (!deletedReceivedItem) {
            return res.status(404).json({ message: 'Received item not found' });
        }

        res.status(204).end();
    } catch (error) {
        console.error('Error deleting received item:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get received items by date for the user's site
const getReceivedItemsByDate = async (req, res) => {
    const { date } = req.params;
    try {
        // Build filter to include user's site
        const filter = { 
            date: new Date(date).toLocaleDateString('en-CA').split('T')[0],
            site: req.user.site,
            company: req.user.company
        };

        // Fetch received items by date
        const receivedItems = await Received.find(filter);
        res.status(200).json(receivedItems);
    } catch (error) {
        console.error('Error getting received items by date:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get received items by date range for the user's site
const getReceivedItemsByDateRange = async (req, res) => {
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

        // Fetch received items by date range
        const receivedItems = await Received.find(filter);
        res.status(200).json(receivedItems);
    } catch (error) {
        console.error('Error getting received items by date range:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { 
    getReceivedItems, 
    addReceivedItem, 
    updateReceivedItem, 
    deleteReceivedItem, 
    getReceivedItemsByDate, 
    getReceivedItemsByDateRange 
}; 