// Get all daily reports for the current user
const getDailyReports = async (req, res) => {
    try {
        const userModels = await req.getUserModels();
        const dailyReports = await userModels.UserDailyReport.find();
        res.status(200).json(dailyReports);
    } catch (error) {
        console.error('Error getting daily reports:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Add new daily reports for the current user
const addDailyReport = async (req, res) => {
    const { materials } = req.body;

    if (!materials || !Array.isArray(materials) || materials.length === 0) {
        return res.status(400).json({ message: 'Invalid input' });
    }

    try {
        const userModels = await req.getUserModels();
        
        // Get the current user's username for createdBy field
        const createdBy = req.user.username || req.user.id;

        // Add createdBy to each material in the array
        const materialsWithCreatedBy = materials.map(material => ({
            ...material,
            createdBy
        }));

        // Create new daily report documents in user's database
        const newDailyReports = await userModels.UserDailyReport.insertMany(materialsWithCreatedBy);
        res.status(201).json(newDailyReports);
    } catch (error) {
        console.error('Error adding daily reports:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update an existing daily report for the current user
const updateDailyReport = async (req, res) => {
    const { date, materialName, quantity, notes, location } = req.body;
    const { id } = req.params;

    if (!date || !materialName || !quantity || !location) {
        return res.status(400).json({ message: 'Invalid input' });
    }

    try {
        const userModels = await req.getUserModels();
        
        // Find and update the daily report by ID in user's database
        const updatedDailyReport = await userModels.UserDailyReport.findByIdAndUpdate(
            id,
            { date, materialName, quantity, notes, location },
            { new: true, runValidators: true }
        );

        if (!updatedDailyReport) {
            return res.status(404).json({ message: 'Daily report not found' });
        }

        res.status(200).json(updatedDailyReport);
    } catch (error) {
        console.error('Error updating daily report:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete an existing daily report for the current user
const deleteDailyReport = async (req, res) => {
    const { id } = req.params;

    try {
        const userModels = await req.getUserModels();
        
        const deletedDailyReport = await userModels.UserDailyReport.findByIdAndDelete(id);

        if (!deletedDailyReport) {
            return res.status(404).json({ message: 'Daily report not found' });
        }

        res.status(204).end();
    } catch (error) {
        console.error('Error deleting daily report:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get daily reports by date for the current user
const getDailyReportsByDate = async (req, res) => {
    const { date } = req.params;
    try {
        const userModels = await req.getUserModels();
        
        // Fetch daily reports by date from user's database
        const dailyReports = await userModels.UserDailyReport.find({ 
            date: new Date(date).toLocaleDateString('en-CA').split('T')[0] 
        });
        res.status(200).json(dailyReports);
    } catch (error) {
        console.error('Error getting daily reports by date:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get daily reports by date range for the current user
const getDailyReportsByDateRange = async (req, res) => {
    const { start, end } = req.query;
    try {
        const userModels = await req.getUserModels();
        
        // Fetch daily reports by date range from user's database
        const dailyReports = await userModels.UserDailyReport.find({
            date: {
                $gte: new Date(start).toISOString(),
                $lte: new Date(end).toISOString()
            }
        });
        res.status(200).json(dailyReports);
    } catch (error) {
        console.error('Error getting daily reports by date range:', error);
        res.status(500).json({ message: 'Server error' });
    }
};



module.exports = { 
    getDailyReports, 
    addDailyReport, 
    updateDailyReport, 
    deleteDailyReport, 
    getDailyReportsByDate, 
    getDailyReportsByDateRange
}; 