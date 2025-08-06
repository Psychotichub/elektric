const received = require('../models/received');

// Get all received materials for the user's site
const getReceived = async (req, res) => {
    try {
        // Filter by user's site and company (ALL users including admins)
        const filter = {
            site: req.user.site,
            company: req.user.company
        };
        
        const receiveds = await received.find(filter);
        res.status(200).json(receiveds);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};  

// Add new received materials
const addReceived = async (req, res) => {
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

        // Create new received materials
        const newreceiveds = await received.insertMany(materialsWithSite);
        res.status(201).json(newreceiveds);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }   
};

// Update an existing received material
const updateReceived = async (req, res) => {
    const { date, materialName, quantity, notes } = req.body;
    const { id } = req.params;

    if (!date || !materialName || !quantity) {
        return res.status(400).json({ message: 'Invalid input' });
    }

    try {
        // Build filter to ensure user can only update their own site's data
        const filter = { 
            _id: id,
            site: req.user.site,
            company: req.user.company
        };

        // Find and update the received material by ID
        const updatedreceived = await received.findOneAndUpdate(
            filter,
            { date, materialName, quantity, notes },
            { new: true, runValidators: true }
        );

        if (!updatedreceived) {
            return res.status(404).json({ message: 'Received material not found' });
        }

        res.status(200).json(updatedreceived);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete an existing received material
const deleteReceived = async (req, res) => {
    const { id } = req.params;

    try {
        // Build filter to ensure user can only delete their own site's data
        const filter = { 
            _id: id,
            site: req.user.site,
            company: req.user.company
        };

        const deletedreceived = await received.findOneAndDelete(filter);

        if (!deletedreceived) {
            return res.status(404).json({ message: 'Received material not found' });
        }

        res.status(204).end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get received materials by date for the user's site
const getReceivedByDate = async (req, res) => {
    const { date } = req.params;
    try {
        // Build filter to include user's site
        const filter = { 
            date: new Date(date).toLocaleDateString('en-CA').split('T')[0],
            site: req.user.site,
            company: req.user.company
        };

        // Fetch received materials by date
        const receiveds = await received.find(filter);
        res.status(200).json(receiveds);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getReceived, addReceived, updateReceived, deleteReceived, getReceivedByDate };
