const mongoose = require('mongoose');
const User = require('../models/user');
require('dotenv').config();

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/daily_report_system');
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
}

async function checkCompanyNames() {
    try {
        console.log('🔍 Checking all company names in database...\n');
        
        // Get all users and their company names
        const users = await User.find({}).select('username role site company');
        
        console.log('👥 All users in database:');
        users.forEach(user => {
            console.log(`  - ${user.username} (${user.role}): site="${user.site || 'NULL'}", company="${user.company || 'NULL'}"`);
        });
        
        // Get unique company names
        const companies = [...new Set(users.map(u => u.company).filter(Boolean))];
        console.log('\n🏢 Unique company names found:');
        companies.forEach(company => {
            console.log(`  - "${company}"`);
        });
        
        // Get unique sites
        const sites = [...new Set(users.map(u => u.site).filter(Boolean))];
        console.log('\n📍 Unique site names found:');
        sites.forEach(site => {
            console.log(`  - "${site}"`);
        });
        
        // Check what database names would be created
        console.log('\n🗄️ Database names that would be created:');
        for (const site of sites) {
            for (const company of companies) {
                const dbName = `${site}_${company}`.toLowerCase().replace(/[^a-z0-9]/g, '_');
                console.log(`  - Site: "${site}", Company: "${company}" → Database: "${dbName}"`);
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

async function main() {
    await connectDB();
    await checkCompanyNames();
    await mongoose.disconnect();
    console.log('\n✅ Check completed');
}

main().catch(console.error);
