const mongoose = require('mongoose');
const User = require('../models/user');
const { getSiteModels } = require('../models/siteDatabase');
require('dotenv').config();

// Connect to MongoDB
async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/daily_report_system');
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
}

// Get manager owned usernames (same logic as controller)
async function getManagerOwnedUsernames(managerId, managerUsername) {
    try {
        console.log(`🔍 Finding users created by manager ID: ${managerId}`);
        
        // Get all users directly created by this manager
        const directUsers = await User.find({ 'createdBy.id': managerId }).select('username _id role');
        console.log(`📋 Direct users created by manager:`, directUsers.map(u => ({ username: u.username, role: u.role, id: u._id })));
        
        const usernames = directUsers.map(u => u.username);
        
        // Get admins created by this manager
        const adminsCreatedByManager = directUsers.filter(u => u.role === 'admin');
        console.log(`👥 Admins created by manager:`, adminsCreatedByManager.map(a => ({ username: a.username, id: a._id })));
        
        // For each admin created by manager, get users they created
        for (const admin of adminsCreatedByManager) {
            console.log(`🔍 Finding users created by admin ${admin.username} (${admin._id})`);
            const usersCreatedByAdmin = await User.find({ 'createdBy.id': admin._id }).select('username role');
            console.log(`📋 Users created by admin ${admin.username}:`, usersCreatedByAdmin.map(u => ({ username: u.username, role: u.role })));
            usernames.push(...usersCreatedByAdmin.map(u => u.username));
        }
        
        // Include the manager themselves
        if (managerUsername) usernames.push(managerUsername);
        
        const finalUsernames = Array.from(new Set(usernames));
        console.log(`🎯 Final owned usernames for manager ${managerUsername}:`, finalUsernames);
        return finalUsernames;
    } catch (e) {
        console.error('❌ Error getting manager owned usernames:', e);
        return managerUsername ? [managerUsername] : [];
    }
}

// Test data access for a manager
async function testManagerDataAccess() {
    try {
        console.log('🧪 Testing Manager Data Access\n');
        
        // Find all managers in the system
        const managers = await User.find({ role: 'manager' }).select('username _id site company');
        console.log('👨‍💼 Found managers:', managers.map(m => ({ 
            username: m.username, 
            id: m._id, 
            site: m.site, 
            company: m.company 
        })));
        
        if (managers.length === 0) {
            console.log('❌ No managers found in database');
            return;
        }
        
        // Test with the first manager
        const testManager = managers[0];
        console.log(`\n🎯 Testing with manager: ${testManager.username} (${testManager._id})\n`);
        
        // Get owned usernames
        const ownedUsernames = await getManagerOwnedUsernames(testManager._id, testManager.username);
        
        // Find all sites and companies in the system
        console.log('\n🏢 Finding all sites and companies in system:');
        const allUsers = await User.find({}).select('site company');
        const sites = [...new Set(allUsers.map(u => u.site).filter(Boolean))];
        const companies = [...new Set(allUsers.map(u => u.company).filter(Boolean))];
        console.log('📍 Available sites:', sites);
        console.log('🏢 Available companies:', companies);
        
        // Test each site/company combination
        for (const site of sites) {
            for (const company of companies) {
                console.log(`\n🔍 Testing site: ${site}, company: ${company}`);
                
                try {
                    // Get site models
                    const siteModels = await getSiteModels(site, company);
                    console.log(`✅ Site models created for ${site}_${company}`);
                    
                    // Check daily reports
                    const allDailyReports = await siteModels.SiteDailyReport.find({});
                    console.log(`📊 Total daily reports in ${site}_${company}:`, allDailyReports.length);
                    
                    if (allDailyReports.length > 0) {
                        console.log('📋 Sample daily reports:');
                        allDailyReports.slice(0, 3).forEach((report, i) => {
                            console.log(`  ${i + 1}. Material: ${report.materialName}, Username: ${report.username || 'NO USERNAME'}, Date: ${report.date}, Qty: ${report.quantity}`);
                        });
                        
                        // Check how many match manager's owned usernames
                        const matchingReports = allDailyReports.filter(r => 
                            ownedUsernames.includes(r.username)
                        );
                        console.log(`🎯 Daily reports matching manager's owned usernames:`, matchingReports.length);
                    }
                    
                    // Check total prices
                    const allTotalPrices = await siteModels.SiteTotalPrice.find({});
                    console.log(`💰 Total price records in ${site}_${company}:`, allTotalPrices.length);
                    
                    if (allTotalPrices.length > 0) {
                        console.log('💰 Sample total prices:');
                        allTotalPrices.slice(0, 3).forEach((price, i) => {
                            console.log(`  ${i + 1}. Material: ${price.materialName}, Username: ${price.username || 'NO USERNAME'}, Date: ${price.date}, Total: ${price.totalPrice}`);
                        });
                        
                        // Check how many match manager's owned usernames
                        const matchingPrices = allTotalPrices.filter(p => 
                            ownedUsernames.includes(p.username)
                        );
                        console.log(`🎯 Total prices matching manager's owned usernames:`, matchingPrices.length);
                    }
                    
                    // Check materials
                    const allMaterials = await siteModels.SiteMaterial.find({});
                    console.log(`🧱 Materials in ${site}_${company}:`, allMaterials.length);
                    
                    if (allMaterials.length > 0) {
                        console.log('🧱 Sample materials:');
                        allMaterials.slice(0, 3).forEach((material, i) => {
                            console.log(`  ${i + 1}. Material: ${material.materialName}, CreatedBy: ${material.createdBy || 'NO CREATOR'}, Price: ${material.materialPrice}`);
                        });
                        
                        // Check how many match manager's owned usernames
                        const matchingMaterials = allMaterials.filter(m => 
                            ownedUsernames.includes(m.createdBy)
                        );
                        console.log(`🎯 Materials matching manager's owned usernames:`, matchingMaterials.length);
                    }
                    
                } catch (error) {
                    console.log(`❌ Error accessing ${site}_${company}:`, error.message);
                }
            }
        }
        
        // Test date range filtering
        console.log('\n📅 Testing date range filtering:');
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        console.log(`📅 Date range: ${firstDay.toISOString().split('T')[0]} to ${lastDay.toISOString().split('T')[0]}`);
        
        for (const site of sites.slice(0, 1)) { // Test first site only
            for (const company of companies.slice(0, 1)) { // Test first company only
                try {
                    const siteModels = await getSiteModels(site, company);
                    
                    const dateFilter = {
                        date: {
                            $gte: firstDay,
                            $lte: lastDay
                        }
                    };
                    
                    const reportsInRange = await siteModels.SiteDailyReport.find(dateFilter);
                    console.log(`📊 Daily reports in current month for ${site}_${company}:`, reportsInRange.length);
                    
                    const pricesInRange = await siteModels.SiteTotalPrice.find(dateFilter);
                    console.log(`💰 Total prices in current month for ${site}_${company}:`, pricesInRange.length);
                    
                    // Test with username filter
                    const userFilteredReports = await siteModels.SiteDailyReport.find({
                        ...dateFilter,
                        username: { $in: ownedUsernames }
                    });
                    console.log(`🎯 Reports in range matching manager usernames:`, userFilteredReports.length);
                    
                    const userFilteredPrices = await siteModels.SiteTotalPrice.find({
                        ...dateFilter,
                        username: { $in: ownedUsernames }
                    });
                    console.log(`🎯 Prices in range matching manager usernames:`, userFilteredPrices.length);
                    
                } catch (error) {
                    console.log(`❌ Error in date range test:`, error.message);
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Main execution
async function main() {
    await connectDB();
    await testManagerDataAccess();
    await mongoose.disconnect();
    console.log('\n✅ Test completed');
}

main().catch(console.error);
