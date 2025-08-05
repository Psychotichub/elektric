const { getUserModels } = require('../models/siteUserModels');
const databaseManager = require('../utils/databaseManager');

// Get all users from all sites in the database
const getSiteUsers = async (req, res) => {
    try {
        console.log('🔍 getSiteUsers called');
        console.log('👤 Request user:', req.user);
        
        const { site, company } = req.user;
        console.log('🏢 Admin user site and company:', { site, company });
        
        console.log('🔍 Getting ALL sites and users from database...');
        
        // Get all user databases
        const userDatabases = await databaseManager.listAllUserDatabases();
        console.log('📊 All user databases:', userDatabases);
        
        // Extract all unique sites from database names
        const allSites = new Set();
        const siteUsers = [];
        
        // Process all user databases to extract site information
        for (const db of userDatabases) {
            const dbNameParts = db.name.split('_');
            console.log('🔍 Database name parts:', dbNameParts);
            
            if (dbNameParts.length >= 4) {
                const username = dbNameParts[2];
                const dbSite = dbNameParts[3];
                const dbCompany = dbNameParts[4];
                
                console.log('👤 Extracted info:', { username, dbSite, dbCompany });
                
                if (dbSite && dbCompany) {
                    allSites.add(`${dbSite}_${dbCompany}`);
                    
                    try {
                        // Get user's models to access their data
                        const userModels = await getUserModels(username, dbSite, dbCompany);
                        
                        // Get user's data
                        const materials = await userModels.UserMaterial.find();
                        const dailyReports = await userModels.UserDailyReport.find();
                        const receivedItems = await userModels.UserReceived.find();
                        const totalPrices = await userModels.UserTotalPrice.find();
                        
                        siteUsers.push({
                            username,
                            site: dbSite,
                            company: dbCompany,
                            database: db.name,
                            data: {
                                materials: materials.length,
                                dailyReports: dailyReports.length,
                                receivedItems: receivedItems.length,
                                totalPrices: totalPrices.length
                            },
                            databaseSize: db.sizeOnDisk
                        });
                    } catch (error) {
                        console.error(`Error accessing database ${db.name}:`, error);
                    }
                }
            }
        }
        
        console.log('📍 All sites found:', Array.from(allSites));
        console.log('👥 All site users found:', siteUsers);
        
        // If no users found, try to get users from the main database
        if (siteUsers.length === 0) {
            console.log('⚠️ No user databases found, checking main user collection...');
            
            try {
                // Import User model from the main database
                const User = require('../models/user');
                
                // Find all users from all sites
                const usersFromMainDb = await User.find({}).select('-password');
                
                console.log('👥 Users found in main database:', usersFromMainDb.length);
                
                // Add these users to the response
                usersFromMainDb.forEach(user => {
                    siteUsers.push({
                        username: user.username,
                        site: user.site,
                        company: user.company,
                        database: `daily_report_${user.username}_${user.site}_${user.company}`,
                        data: {
                            materials: 0,
                            dailyReports: 0,
                            receivedItems: 0,
                            totalPrices: 0
                        },
                        databaseSize: 0,
                        note: 'Database not created yet - will be created when user first accesses the system'
                    });
                    
                    if (user.site && user.company) {
                        allSites.add(`${user.site}_${user.company}`);
                    }
                });
                
                console.log('✅ Added users from main database');
            } catch (error) {
                console.error('❌ Error getting users from main database:', error);
            }
        }
        
        // If still no users found, provide helpful information
        if (siteUsers.length === 0) {
            console.log('⚠️ No users found in any site');
            console.log('💡 This might be normal if:');
            console.log('   - No users have been created yet');
            console.log('   - Users exist but don\'t have the correct site/company info');
            console.log('   - The database naming convention is different');
            console.log('   - Case sensitivity issues with site/company names');
            
            // Add the current user as a fallback for testing
            siteUsers.push({
                username: req.user.username,
                site: site,
                company: company,
                database: `daily_report_${req.user.username}_${site}_${company}`,
                data: {
                    materials: 0,
                    dailyReports: 0,
                    receivedItems: 0,
                    totalPrices: 0
                },
                databaseSize: 0,
                note: 'Current user (database not created yet)'
            });
            console.log('🔄 Added current user as fallback for testing');
        }
        
        // Convert allSites Set to array of site objects
        const sitesArray = Array.from(allSites).map(siteCompany => {
            const [siteName, companyName] = siteCompany.split('_');
            return { site: siteName, company: companyName };
        });
        
        const response = {
            success: true,
            sites: sitesArray,
            totalSites: sitesArray.length,
            totalUsers: siteUsers.length,
            users: siteUsers,
            message: siteUsers.length === 0 ? 'No users found in any site. This is normal if no users have been created yet.' : null
        };
        
        console.log('📤 Sending response:', response);
        res.json(response);
        
    } catch (error) {
        console.error('❌ Error getting site users:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Get all materials from all users in the same site
const getSiteMaterials = async (req, res) => {
    try {
        const { site, company } = req.user;
        
        // Get all user databases for this site
        const userDatabases = await databaseManager.listAllUserDatabases();
        const siteDatabases = userDatabases.filter(db => 
            db.name.includes(`_${site}_${company}`)
        );

        const allMaterials = [];
        
        for (const db of siteDatabases) {
            const dbNameParts = db.name.split('_');
            const username = dbNameParts[2];
            
            try {
                const userModels = await getUserModels(username, site, company);
                const materials = await userModels.Material.find();
                
                // Add username to each material for identification
                const materialsWithUser = materials.map(material => ({
                    ...material.toObject(),
                    username
                }));
                
                allMaterials.push(...materialsWithUser);
            } catch (error) {
                console.error(`Error accessing materials for ${username}:`, error);
            }
        }
        
        res.json({
            site,
            company,
            totalMaterials: allMaterials.length,
            materials: allMaterials
        });
    } catch (error) {
        console.error('Error getting site materials:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all daily reports from all users in the same site
const getSiteDailyReports = async (req, res) => {
    try {
        const { site, company } = req.user;
        const { start, end } = req.query;
        
        // Get all user databases for this site
        const userDatabases = await databaseManager.listAllUserDatabases();
        const siteDatabases = userDatabases.filter(db => 
            db.name.includes(`_${site}_${company}`)
        );

        const allDailyReports = [];
        
        for (const db of siteDatabases) {
            const dbNameParts = db.name.split('_');
            const username = dbNameParts[2];
            
            try {
                const userModels = await getUserModels(username, site, company);
                
                let query = {};
                if (start && end) {
                    query.date = {
                        $gte: new Date(start).toISOString(),
                        $lte: new Date(end).toISOString()
                    };
                }
                
                const dailyReports = await userModels.DailyReport.find(query);
                
                // Add username to each report for identification
                const reportsWithUser = dailyReports.map(report => ({
                    ...report.toObject(),
                    username
                }));
                
                allDailyReports.push(...reportsWithUser);
            } catch (error) {
                console.error(`Error accessing daily reports for ${username}:`, error);
            }
        }
        
        res.json({
            site,
            company,
            totalReports: allDailyReports.length,
            dailyReports: allDailyReports
        });
    } catch (error) {
        console.error('Error getting site daily reports:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all received items from all users in the same site
const getSiteReceivedItems = async (req, res) => {
    try {
        const { site, company } = req.user;
        const { start, end } = req.query;
        
        // Get all user databases for this site
        const userDatabases = await databaseManager.listAllUserDatabases();
        const siteDatabases = userDatabases.filter(db => 
            db.name.includes(`_${site}_${company}`)
        );

        const allReceivedItems = [];
        
        for (const db of siteDatabases) {
            const dbNameParts = db.name.split('_');
            const username = dbNameParts[2];
            
            try {
                const userModels = await getUserModels(username, site, company);
                
                let query = {};
                if (start && end) {
                    query.date = {
                        $gte: new Date(start).toISOString(),
                        $lte: new Date(end).toISOString()
                    };
                }
                
                const receivedItems = await userModels.Received.find(query);
                
                // Add username to each item for identification
                const itemsWithUser = receivedItems.map(item => ({
                    ...item.toObject(),
                    username
                }));
                
                allReceivedItems.push(...itemsWithUser);
            } catch (error) {
                console.error(`Error accessing received items for ${username}:`, error);
            }
        }
        
        res.json({
            site,
            company,
            totalReceivedItems: allReceivedItems.length,
            receivedItems: allReceivedItems
        });
    } catch (error) {
        console.error('Error getting site received items:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all total prices from all users in the same site
const getSiteTotalPrices = async (req, res) => {
    try {
        const { site, company } = req.user;
        const { startDate, endDate } = req.query;
        
        console.log('🔍 Getting site total prices for:', { site, company, startDate, endDate });
        
        // Get all user databases for this site
        const userDatabases = await databaseManager.listAllUserDatabases();
        const siteDatabases = userDatabases.filter(db => 
            db.name.includes(`_${site}_${company}`)
        );

        const allTotalPrices = [];
        
        for (const db of siteDatabases) {
            const dbNameParts = db.name.split('_');
            const username = dbNameParts[2];
            
            try {
                const userModels = await getUserModels(username, site, company);
                
                let query = {};
                if (startDate && endDate) {
                    query.date = {
                        $gte: new Date(startDate).toISOString(),
                        $lte: new Date(endDate).toISOString()
                    };
                }
                
                const totalPrices = await userModels.TotalPrice.find(query);
                
                // Add username to each price for identification
                const pricesWithUser = totalPrices.map(price => ({
                    ...price.toObject(),
                    username
                }));
                
                allTotalPrices.push(...pricesWithUser);
            } catch (error) {
                console.error(`Error accessing total prices for ${username}:`, error);
            }
        }
        
        console.log(`📊 Found ${allTotalPrices.length} total prices for site ${site}`);
        
        res.json({
            success: true,
            site,
            company,
            totalPrices: allTotalPrices,
            count: allTotalPrices.length,
            message: allTotalPrices.length === 0 ? 'No total prices found for the selected date range' : null
        });
    } catch (error) {
        console.error('Error getting site total prices:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Calculate total prices dynamically from daily reports and material prices
const calculateSiteTotalPrices = async (req, res) => {
    try {
        const { site, company } = req.user;
        const { startDate, endDate } = req.query;
        
        console.log('🔍 Calculating site total prices for:', { site, company, startDate, endDate });
        
        // Get site models to access shared site materials
        const { getSiteModels } = require('../models/siteUserModels');
        const siteModels = await getSiteModels(site, company);
        
        // Get all user databases for this site
        const userDatabases = await databaseManager.listAllUserDatabases();
        const siteDatabases = userDatabases.filter(db => 
            db.name.includes(`_${site}_${company}`)
        );

        console.log(`📊 Found ${siteDatabases.length} user databases for site ${site}`);
        
        const allDailyReports = [];
        const allTotalPrices = [];
        
        // Get site materials (shared across all users)
        const siteMaterials = await siteModels.SiteMaterial.find({ isActive: true });
        console.log(`📊 Site materials found: ${siteMaterials.length}`);
        
        // Collect daily reports and total prices from all users in the site
        for (const db of siteDatabases) {
            const dbNameParts = db.name.split('_');
            const username = dbNameParts[2];
            
            try {
                const userModels = await getUserModels(username, site, company);
                
                // Get daily reports for the date range
                let dailyReportsQuery = {};
                if (startDate && endDate) {
                    dailyReportsQuery.date = {
                        $gte: new Date(startDate),
                        $lte: new Date(endDate)
                    };
                }
                
                const dailyReports = await userModels.UserDailyReport.find(dailyReportsQuery);
                
                // Get total prices for the date range
                let totalPricesQuery = {};
                if (startDate && endDate) {
                    totalPricesQuery.date = {
                        $gte: new Date(startDate),
                        $lte: new Date(endDate)
                    };
                }
                
                const totalPrices = await userModels.UserTotalPrice.find(totalPricesQuery);
                
                // Add username to each record
                const reportsWithUser = dailyReports.map(report => ({
                    ...report.toObject(),
                    username
                }));
                
                const pricesWithUser = totalPrices.map(price => ({
                    ...price.toObject(),
                    username
                }));
                
                allDailyReports.push(...reportsWithUser);
                allTotalPrices.push(...pricesWithUser);
                
                console.log(`📊 User ${username}: ${dailyReports.length} daily reports, ${totalPrices.length} total prices`);
                
            } catch (error) {
                console.error(`Error accessing data for ${username}:`, error);
            }
        }
        
        console.log(`📊 Total daily reports: ${allDailyReports.length}, Total prices: ${allTotalPrices.length}, Total site materials: ${siteMaterials.length}`);
        
        // If we have existing total prices, use them directly
        if (allTotalPrices.length > 0) {
            console.log('💰 Using existing total prices from users');
            
            // Group total prices by material name and aggregate
            const aggregatedTotalPrices = allTotalPrices.reduce((acc, price) => {
                const key = price.materialName;
                if (!acc[key]) {
                    acc[key] = {
                        materialName: price.materialName,
                        quantity: 0,
                        unit: price.unit,
                        location: price.location,
                        materialPrice: price.materialPrice,
                        laborPrice: price.laborPrice,
                        materialCost: 0,
                        laborCost: 0,
                        totalPrice: 0,
                        usernames: new Set()
                    };
                }
                acc[key].quantity += price.quantity;
                acc[key].materialCost += price.materialPrice * price.quantity;
                acc[key].laborCost += price.laborPrice * price.quantity;
                acc[key].totalPrice += (price.materialPrice + price.laborPrice) * price.quantity;
                acc[key].usernames.add(price.username);
                return acc;
            }, {});
            
            const calculatedTotalPrices = Object.values(aggregatedTotalPrices).map(item => ({
                materialName: item.materialName,
                quantity: item.quantity,
                unit: item.unit,
                location: item.location,
                materialPrice: item.materialPrice,
                laborPrice: item.laborPrice,
                materialCost: item.materialCost,
                laborCost: item.laborCost,
                totalPrice: item.totalPrice,
                usernames: Array.from(item.usernames),
                dateRange: `${startDate} to ${endDate}`
            }));
            
            // Calculate grand totals
            const grandTotal = calculatedTotalPrices.reduce((sum, item) => sum + item.totalPrice, 0);
            const totalMaterialCost = calculatedTotalPrices.reduce((sum, item) => sum + item.materialCost, 0);
            const totalLaborCost = calculatedTotalPrices.reduce((sum, item) => sum + item.laborCost, 0);
            
            console.log(`📊 Calculated ${calculatedTotalPrices.length} total price records from existing data`);
            console.log(`💰 Grand total: $${grandTotal.toFixed(2)}`);
            
            res.json({
                success: true,
                site,
                company,
                dateRange: `${startDate} to ${endDate}`,
                calculatedTotalPrices,
                summary: {
                    totalMaterials: calculatedTotalPrices.length,
                    grandTotal: grandTotal,
                    totalMaterialCost: totalMaterialCost,
                    totalLaborCost: totalLaborCost,
                    totalDailyReports: allDailyReports.length,
                    totalSiteMaterials: siteMaterials.length,
                    dataSource: 'existing_total_prices'
                }
            });
            
        } else {
            // Calculate total prices from daily reports and site materials
            console.log('💰 Calculating total prices from daily reports and site materials');
            
            // Group daily reports by material name and aggregate quantities
            const aggregatedReports = allDailyReports.reduce((acc, report) => {
                const key = report.materialName;
                if (!acc[key]) {
                    acc[key] = {
                        materialName: report.materialName,
                        quantity: 0,
                        unit: report.unit,
                        location: report.location,
                        usernames: new Set()
                    };
                }
                acc[key].quantity += report.quantity;
                acc[key].usernames.add(report.username);
                return acc;
            }, {});
            
            // Calculate total prices for each material
            const calculatedTotalPrices = [];
            Object.values(aggregatedReports).forEach(aggregatedReport => {
                // Find the site material price
                const siteMaterial = siteMaterials.find(material => 
                    material.materialName === aggregatedReport.materialName
                );
                
                if (siteMaterial) {
                    const materialCost = aggregatedReport.quantity * siteMaterial.materialPrice;
                    const laborCost = aggregatedReport.quantity * siteMaterial.laborPrice;
                    const totalPrice = materialCost + laborCost;
                    
                    calculatedTotalPrices.push({
                        materialName: aggregatedReport.materialName,
                        quantity: aggregatedReport.quantity,
                        unit: aggregatedReport.unit,
                        location: aggregatedReport.location,
                        materialPrice: siteMaterial.materialPrice,
                        laborPrice: siteMaterial.laborPrice,
                        materialCost: materialCost,
                        laborCost: laborCost,
                        totalPrice: totalPrice,
                        usernames: Array.from(aggregatedReport.usernames),
                        dateRange: `${startDate} to ${endDate}`
                    });
                } else {
                    console.log(`⚠️ No site material found for: ${aggregatedReport.materialName}`);
                }
            });
            
            // Calculate grand totals
            const grandTotal = calculatedTotalPrices.reduce((sum, item) => sum + item.totalPrice, 0);
            const totalMaterialCost = calculatedTotalPrices.reduce((sum, item) => sum + item.materialCost, 0);
            const totalLaborCost = calculatedTotalPrices.reduce((sum, item) => sum + item.laborCost, 0);
            
            console.log(`📊 Calculated ${calculatedTotalPrices.length} total price records from daily reports`);
            console.log(`💰 Grand total: $${grandTotal.toFixed(2)}`);
            
            res.json({
                success: true,
                site,
                company,
                dateRange: `${startDate} to ${endDate}`,
                calculatedTotalPrices,
                summary: {
                    totalMaterials: calculatedTotalPrices.length,
                    grandTotal: grandTotal,
                    totalMaterialCost: totalMaterialCost,
                    totalLaborCost: totalLaborCost,
                    totalDailyReports: allDailyReports.length,
                    totalSiteMaterials: siteMaterials.length,
                    dataSource: 'calculated_from_daily_reports'
                }
            });
        }
        
    } catch (error) {
        console.error('Error calculating site total prices:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Get comprehensive site statistics
const getSiteStatistics = async (req, res) => {
    try {
        const { site, company } = req.user;
        
        // Get all user databases for this site
        const userDatabases = await databaseManager.listAllUserDatabases();
        const siteDatabases = userDatabases.filter(db => 
            db.name.includes(`_${site}_${company}`)
        );

        let totalMaterials = 0;
        let totalDailyReports = 0;
        let totalReceivedItems = 0;
        let totalPrices = 0;
        let totalDatabaseSize = 0;
        
        for (const db of siteDatabases) {
            const dbNameParts = db.name.split('_');
            const username = dbNameParts[2];
            
            try {
                const userModels = await getUserModels(username, site, company);
                
                const materials = await userModels.Material.find();
                const dailyReports = await userModels.DailyReport.find();
                const receivedItems = await userModels.Received.find();
                const totalPricesData = await userModels.TotalPrice.find();
                
                totalMaterials += materials.length;
                totalDailyReports += dailyReports.length;
                totalReceivedItems += receivedItems.length;
                totalPrices += totalPricesData.length;
                totalDatabaseSize += db.sizeOnDisk;
            } catch (error) {
                console.error(`Error calculating statistics for ${username}:`, error);
            }
        }
        
        res.json({
            site,
            company,
            statistics: {
                totalUsers: siteDatabases.length,
                totalMaterials,
                totalDailyReports,
                totalReceivedItems,
                totalPrices,
                totalDatabaseSize,
                averageMaterialsPerUser: siteDatabases.length > 0 ? Math.round(totalMaterials / siteDatabases.length) : 0,
                averageReportsPerUser: siteDatabases.length > 0 ? Math.round(totalDailyReports / siteDatabases.length) : 0
            }
        });
    } catch (error) {
        console.error('Error getting site statistics:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get specific user's data (admin can access any user in their site)
const getUserData = async (req, res) => {
    try {
        const { site, company } = req.user;
        const { username } = req.params;
        
        // Verify the user belongs to the same site
        const userDbName = `daily_report_${username}_${site}_${company}`;
        const userDatabases = await databaseManager.listAllUserDatabases();
        const userExists = userDatabases.some(db => db.name === userDbName);
        
        if (!userExists) {
            return res.status(404).json({ message: 'User not found in this site' });
        }
        
        // Get user's data
        const userModels = await getUserModels(username, site, company);
        
        const materials = await userModels.Material.find();
        const dailyReports = await userModels.DailyReport.find();
        const receivedItems = await userModels.Received.find();
        const totalPrices = await userModels.TotalPrice.find();
        
        res.json({
            username,
            site,
            company,
            database: userDbName,
            data: {
                materials,
                dailyReports,
                receivedItems,
                totalPrices
            },
            counts: {
                materials: materials.length,
                dailyReports: dailyReports.length,
                receivedItems: receivedItems.length,
                totalPrices: totalPrices.length
            }
        });
    } catch (error) {
        console.error('Error getting user data:', error);
        res.status(500).json({ message: 'Server error' });
    }
};



module.exports = {
    getSiteUsers,
    getSiteTotalPrices,
    getSiteMaterials,
    getSiteDailyReports,
    getSiteReceivedItems,
    getSiteStatistics,
    getUserData,
    calculateSiteTotalPrices
}; 