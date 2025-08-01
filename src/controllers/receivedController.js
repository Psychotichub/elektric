const received = require('../models/received');

// Get all daily reports
const getReceived = async (req, res) => {
    try {
        // Fetch all daily reports
        const receiveds = await received.find();
        res.status(200).json(receiveds);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};  

// Add new daily reports
const addReceived = async (req, res) => {
    const { materials } = req.body;

    if (!materials || !Array.isArray(materials) || materials.length === 0) {
        return res.status(400).json({ message: 'Invalid input' });
    }

    try {
        // Create new daily report
        const newreceiveds = await received.insertMany(materials);
        res.status(201).json(newreceiveds);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }   
};

// Update an existing daily report
const updateReceived = async (req, res) => {
    const { date, materialName, quantity, notes } = req.body;
    const { id } = req.params;

    if (!date || !materialName || !quantity) {
        return res.status(400).json({ message: 'Invalid input' });
    }

    try {
        // Find and update the daily report by ID
        const updatedreceived = await received.findByIdAndUpdate(
            id,
            { date, materialName, quantity, notes },
            { new: true, runValidators: true }
        );

        if (!updatedreceived) {
            return res.status(404).json({ message: 'Daily report not found' });
        }

        res.status(200).json(updatedreceived);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete an existing daily report
const deleteReceived = async (req, res) => {
    const { id } = req.params;

    try {
        // Find and delete the daily report by ID
        const deletedreceived = await received.findByIdAndDelete(id);

        if (!deletedreceived) {
            return res.status(404).json({ message: 'Daily report not found' });
        }

        res.status(204).end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get daily reports by date
const getReceivedByDate = async (req, res) => {
    const { date } = req.params;
    try {
        // Fetch daily reports by date
        const receiveds = await received.find({ date: new Date(date).toLocaleDateString('en-CA').split('T')[0] });
        res.status(200).json(receiveds);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getReceived, addReceived, updateReceived, deleteReceived, getReceivedByDate };
