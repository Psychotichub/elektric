// Get all total price entries for the current user
const getTotalPrices = async (req, res) => {
    try {
        const userModels = await req.getUserModels();
        const totalPrices = await userModels.UserTotalPrice.find();
        res.status(200).json(totalPrices);
    } catch (error) {
        console.error('Error getting total prices:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Add new total price entry for the current user
const addTotalPrice = async (req, res) => {
    const { date, materialName, quantity, materialPrice, laborPrice, totalPrice, unit, location } = req.body;

    if (!date || !materialName || !quantity || !materialPrice || !laborPrice || !totalPrice || !unit || !location) {
        return res.status(400).json({ message: 'Invalid input' });
    }

    try {
        const userModels = await req.getUserModels();
        
        // Get the current user's username for createdBy field
        const createdBy = req.user.username || req.user.id;

        const newTotalPrice = new userModels.UserTotalPrice({
            date,
            materialName,
            quantity,
            materialPrice,
            laborPrice,
            totalPrice,
            unit,
            location,
            createdBy
        });

        await newTotalPrice.save();
        res.status(201).json(newTotalPrice);
    } catch (error) {
        console.error('Error adding total price:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update an existing total price entry for the current user
const updateTotalPrice = async (req, res) => {
    const { date, materialName, quantity, materialPrice, laborPrice, totalPrice, unit, location } = req.body;
    const { id } = req.params;

    if (!date || !materialName || !quantity || !materialPrice || !laborPrice || !totalPrice || !unit || !location) {
        return res.status(400).json({ message: 'Invalid input' });
    }

    try {
        const userModels = await req.getUserModels();
        
        const updatedTotalPrice = await userModels.UserTotalPrice.findByIdAndUpdate(
            id,
            { date, materialName, quantity, materialPrice, laborPrice, totalPrice, unit, location },
            { new: true, runValidators: true }
        );

        if (!updatedTotalPrice) {
            return res.status(404).json({ message: 'Total price entry not found' });
        }

        res.status(200).json(updatedTotalPrice);
    } catch (error) {
        console.error('Error updating total price:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete an existing total price entry for the current user
const deleteTotalPrice = async (req, res) => {
    const { id } = req.params;

    try {
        const userModels = await req.getUserModels();
        
        const deletedTotalPrice = await userModels.UserTotalPrice.findByIdAndDelete(id);

        if (!deletedTotalPrice) {
            return res.status(404).json({ message: 'Total price entry not found' });
        }

        res.status(204).end();
    } catch (error) {
        console.error('Error deleting total price:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get total prices by date for the current user
const getTotalPricesByDate = async (req, res) => {
    const { date } = req.params;
    try {
        const userModels = await req.getUserModels();
        
        const totalPrices = await userModels.UserTotalPrice.find({ 
            date: new Date(date).toLocaleDateString('en-CA').split('T')[0] 
        });
        res.status(200).json(totalPrices);
    } catch (error) {
        console.error('Error getting total prices by date:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get total prices by date range for the current user
const getTotalPricesByDateRange = async (req, res) => {
    const { start, end } = req.query;
    try {
        const userModels = await req.getUserModels();
        
        const totalPrices = await userModels.UserTotalPrice.find({
            date: {
                $gte: new Date(start).toISOString(),
                $lte: new Date(end).toISOString()
            }
        });
        res.status(200).json(totalPrices);
    } catch (error) {
        console.error('Error getting total prices by date range:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Calculate total price for a material for the current user
const calculateTotalPrice = async (req, res) => {
    const { materialName, quantity } = req.body;

    if (!materialName || !quantity) {
        return res.status(400).json({ message: 'Material name and quantity are required' });
    }

    try {
        const userModels = await req.getUserModels();
        
        // Get material pricing from user's database
        const material = await userModels.UserMaterial.findOne({ materialName });
        
        if (!material) {
            return res.status(404).json({ message: 'Material not found' });
        }

        const materialCost = material.materialPrice * quantity;
        const laborCost = material.laborPrice * quantity;
        const totalCost = materialCost + laborCost;

        res.status(200).json({
            materialName,
            quantity,
            materialPrice: material.materialPrice,
            laborPrice: material.laborPrice,
            materialCost,
            laborCost,
            totalCost,
            unit: material.unit
        });
    } catch (error) {
        console.error('Error calculating total price:', error);
        res.status(500).json({ message: 'Server error' });
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