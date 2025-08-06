const DailyReport = require('../models/dailyreport');

// Get all daily reports for the user's site
const getDailyReports = async (req, res) => {
    try {
        // Filter by user's site and company (ALL users including admins)
        const filter = {
            site: req.user.site,
            company: req.user.company
        };
        
        const dailyReports = await DailyReport.find(filter);
        res.status(200).json(dailyReports);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}; 

// Add new daily reports
const addDailyReport = async (req, res) => {
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

        // Create new daily report documents
        const newDailyReports = await DailyReport.insertMany(materialsWithSite);
        res.status(201).json(newDailyReports);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }   
};

// Update an existing daily report
const updateDailyReport = async (req, res) => {
    const { date, materialName, quantity, notes, location } = req.body;
    const { id } = req.params;

    if (!date || !materialName || !quantity || !location) {
        return res.status(400).json({ message: 'Invalid input' });
    }

    try {
        // Build filter to ensure user can only update their own site's data
        const filter = { 
            _id: id,
            site: req.user.site,
            company: req.user.company
        };

        // Find and update the daily report by ID
        const updatedDailyReport = await DailyReport.findOneAndUpdate(
            filter,
            { date, materialName, quantity, notes, location },
            { new: true, runValidators: true }
        );

        if (!updatedDailyReport) {
            return res.status(404).json({ message: 'Daily report not found' });
        }

        res.status(200).json(updatedDailyReport);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete an existing daily report
const deleteDailyReport = async (req, res) => {
    const { id } = req.params;

    try {
        // Build filter to ensure user can only delete their own site's data
        const filter = { 
            _id: id,
            site: req.user.site,
            company: req.user.company
        };

        const deletedDailyReport = await DailyReport.findOneAndDelete(filter);

        if (!deletedDailyReport) {
            return res.status(404).json({ message: 'Daily report not found' });
        }

        res.status(204).end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get daily reports by date for the user's site
const getDailyReportsByDate = async (req, res) => {
    const { date } = req.params;
    try {
        // Build filter to include user's site
        const filter = { 
            date: new Date(date).toLocaleDateString('en-CA').split('T')[0],
            site: req.user.site,
            company: req.user.company
        };

        // Fetch daily reports by date
        const dailyReports = await DailyReport.find(filter);
        res.status(200).json(dailyReports);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get daily reports by date range for the user's site
const getDailyReportsByDateRange = async (req, res) => {
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

        // Fetch daily reports by date range
        const dailyReports = await DailyReport.find(filter);
        res.status(200).json(dailyReports);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getDailyReports, addDailyReport, updateDailyReport, deleteDailyReport, getDailyReportsByDate, getDailyReportsByDateRange };
