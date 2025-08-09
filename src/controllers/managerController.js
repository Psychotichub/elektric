const { getSiteModels } = require('../models/siteDatabase');
const User = require('../models/user');

async function getManagerOwnedUsernames(managerId, managerUsername) {
    try {
        const users = await User.find({ 'createdBy.id': managerId }).select('username');
        const usernames = users.map(u => u.username);
        if (managerUsername) usernames.push(managerUsername);
        return Array.from(new Set(usernames));
    } catch (e) {
        return managerUsername ? [managerUsername] : [];
    }
}

// Calculate total prices for a specific site and company
exports.calculateTotalPrices = async (req, res) => {
    try {
        const { site, company, startDate, endDate } = req.query;
        
        console.log('🔍 Manager calculating total prices:', { site, company, startDate, endDate });
        
        // Validation
        if (!site || !company || !startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Site, company, start date, and end date are required'
            });
        }

        // Get site-specific models
        const siteModels = await getSiteModels(site, company);
        
        // Build base date range filter
        const reportFilter = {
            date: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        };

        // If requester is a manager, restrict to data created by the manager or users they created
        if (req.user?.role === 'manager') {
            const allowedUsernames = await getManagerOwnedUsernames(req.user.id, req.user.username);
            reportFilter.username = { $in: allowedUsernames };
        }

        // Get daily reports for the date range (and username filter if applied)
        const dailyReports = await siteModels.SiteDailyReport.find(reportFilter);

        console.log(`📊 Found ${dailyReports.length} daily reports for ${site}_${company}`);

        // Group by material and calculate totals
        const materialTotals = {};
        
        dailyReports.forEach(report => {
            const materialName = report.materialName;
            
            if (!materialTotals[materialName]) {
                materialTotals[materialName] = {
                    materialName: materialName,
                    quantity: 0,
                    unit: report.unit,
                    materialCost: 0,
                    laborCost: 0,
                    totalPrice: 0,
                    location: report.location || 'N/A'
                };
            }
            
            // Add quantities and costs
            materialTotals[materialName].quantity += report.quantity || 0;
            materialTotals[materialName].materialCost += (report.materialPrice || 0) * (report.quantity || 0);
            materialTotals[materialName].laborCost += (report.labourPrice || 0) * (report.quantity || 0);
            materialTotals[materialName].totalPrice += ((report.materialPrice || 0) + (report.labourPrice || 0)) * (report.quantity || 0);
        });

        // Convert to array and calculate summary
        const calculatedTotalPrices = Object.values(materialTotals);
        const grandTotal = calculatedTotalPrices.reduce((sum, item) => sum + item.totalPrice, 0);
        const totalMaterialCost = calculatedTotalPrices.reduce((sum, item) => sum + item.materialCost, 0);
        const totalLaborCost = calculatedTotalPrices.reduce((sum, item) => sum + item.laborCost, 0);

        console.log(`💰 Calculated totals for ${site}_${company}:`, {
            totalMaterials: calculatedTotalPrices.length,
            grandTotal: grandTotal,
            totalMaterialCost: totalMaterialCost,
            totalLaborCost: totalLaborCost
        });

        res.status(200).json({
            success: true,
            calculatedTotalPrices: calculatedTotalPrices,
            summary: {
                totalMaterials: calculatedTotalPrices.length,
                grandTotal: grandTotal,
                totalMaterialCost: totalMaterialCost,
                totalLaborCost: totalLaborCost
            },
            dateRange: {
                start: startDate,
                end: endDate
            },
            site: site,
            company: company
        });

    } catch (error) {
        console.error('❌ Error calculating total prices:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to calculate total prices',
            error: error.message
        });
    }
};

// Get materials for a specific site and company
exports.getSiteMaterials = async (req, res) => {
    try {
        const { site, company } = req.query;
        
        console.log('🔍 Manager getting site materials:', { site, company });
        
        // Validation
        if (!site || !company) {
            return res.status(400).json({
                success: false,
                message: 'Site and company are required'
            });
        }

        // Get site-specific models
        const siteModels = await getSiteModels(site, company);
        
        // Apply manager ownership filter if needed
        let materialsFilter = {};
        if (req.user?.role === 'manager') {
            const allowedUsernames = await getManagerOwnedUsernames(req.user.id, req.user.username);
            materialsFilter = { createdBy: { $in: allowedUsernames } };
        }

        // Get materials for the site
        const materials = await siteModels.SiteMaterial
            .find(materialsFilter)
            .sort({ materialName: 1 });

        console.log(`📊 Found ${materials.length} materials for ${site}_${company}`);

        res.status(200).json({
            success: true,
            materials: materials,
            site: site,
            company: company
        });

    } catch (error) {
        console.error('❌ Error getting site materials:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get site materials',
            error: error.message
        });
    }
};

// Get site statistics
exports.getSiteStatistics = async (req, res) => {
    try {
        const { site, company } = req.query;
        
        console.log('🔍 Manager getting site statistics:', { site, company });
        
        // Validation
        if (!site || !company) {
            return res.status(400).json({
                success: false,
                message: 'Site and company are required'
            });
        }

        // Get site-specific models
        const siteModels = await getSiteModels(site, company);
        
        // Build filters for manager ownership if needed
        let dailyReportsFilter = {};
        let materialsFilterCount = {};
        let receivedFilter = {};
        let totalPricesFilter = {};
        if (req.user?.role === 'manager') {
            const allowedUsernames = await getManagerOwnedUsernames(req.user.id, req.user.username);
            dailyReportsFilter = { username: { $in: allowedUsernames } };
            materialsFilterCount = { createdBy: { $in: allowedUsernames } };
            receivedFilter = { username: { $in: allowedUsernames } };
            totalPricesFilter = { username: { $in: allowedUsernames } };
        }

        // Get counts for different collections
        const dailyReportsCount = await siteModels.SiteDailyReport.countDocuments(dailyReportsFilter);
        const materialsCount = await siteModels.SiteMaterial.countDocuments(materialsFilterCount);
        const receivedItemsCount = await siteModels.SiteReceived.countDocuments(receivedFilter);
        const totalPricesCount = await siteModels.SiteTotalPrice.countDocuments(totalPricesFilter);
        const monthlyReportsCount = await siteModels.SiteMonthlyReport.countDocuments();

        console.log(`📊 Site statistics for ${site}_${company}:`, {
            dailyReports: dailyReportsCount,
            materials: materialsCount,
            receivedItems: receivedItemsCount,
            totalPrices: totalPricesCount,
            monthlyReports: monthlyReportsCount
        });

        res.status(200).json({
            success: true,
            statistics: {
                dailyReports: dailyReportsCount,
                materials: materialsCount,
                receivedItems: receivedItemsCount,
                totalPrices: totalPricesCount,
                monthlyReports: monthlyReportsCount
            },
            site: site,
            company: company
        });

    } catch (error) {
        console.error('❌ Error getting site statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get site statistics',
            error: error.message
        });
    }
}; 