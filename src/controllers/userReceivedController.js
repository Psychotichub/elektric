// Get all received items for the current user
const getReceivedItems = async (req, res) => {
    try {
        const userModels = await req.getUserModels();
        const receivedItems = await userModels.UserReceived.find();
        res.status(200).json(receivedItems);
    } catch (error) {
        console.error('Error getting received items:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Add new received item for the current user
const addReceivedItem = async (req, res) => {
    const { date, materialName, quantity, supplier, unit, notes } = req.body;

    if (!date || !materialName || !quantity || !supplier || !unit) {
        return res.status(400).json({ message: 'Invalid input' });
    }

    try {
        const userModels = await req.getUserModels();
        
        // Get the current user's username for createdBy field
        const createdBy = req.user.username || req.user.id;

        const newReceivedItem = new userModels.UserReceived({
            date,
            materialName,
            quantity,
            supplier,
            unit,
            notes: notes || '',
            createdBy
        });

        await newReceivedItem.save();
        res.status(201).json(newReceivedItem);
    } catch (error) {
        console.error('Error adding received item:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update an existing received item for the current user
const updateReceivedItem = async (req, res) => {
    const { date, materialName, quantity, supplier, unit, notes } = req.body;
    const { id } = req.params;

    if (!date || !materialName || !quantity || !supplier || !unit) {
        return res.status(400).json({ message: 'Invalid input' });
    }

    try {
        const userModels = await req.getUserModels();
        
        const updatedReceivedItem = await userModels.UserReceived.findByIdAndUpdate(
            id,
            { date, materialName, quantity, supplier, unit, notes },
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

// Delete an existing received item for the current user
const deleteReceivedItem = async (req, res) => {
    const { id } = req.params;

    try {
        const userModels = await req.getUserModels();
        
        const deletedReceivedItem = await userModels.UserReceived.findByIdAndDelete(id);

        if (!deletedReceivedItem) {
            return res.status(404).json({ message: 'Received item not found' });
        }

        res.status(204).end();
    } catch (error) {
        console.error('Error deleting received item:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get received items by date for the current user
const getReceivedItemsByDate = async (req, res) => {
    const { date } = req.params;
    try {
        const userModels = await req.getUserModels();
        
        const receivedItems = await userModels.UserReceived.find({ 
            date: new Date(date).toLocaleDateString('en-CA').split('T')[0] 
        });
        res.status(200).json(receivedItems);
    } catch (error) {
        console.error('Error getting received items by date:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get received items by date range for the current user
const getReceivedItemsByDateRange = async (req, res) => {
    const { start, end } = req.query;
    try {
        const userModels = await req.getUserModels();
        
        const receivedItems = await userModels.UserReceived.find({
            date: {
                $gte: new Date(start).toISOString(),
                $lte: new Date(end).toISOString()
            }
        });
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