const mongoose = require('mongoose');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/daily_report_system');
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
}

async function debugManagerToken() {
    try {
        console.log('🔍 Debugging Manager Dashboard Data...\n');
        
        // Find the manager
        const manager = await User.findOne({ username: 'Suresh', role: 'manager' });
        if (!manager) {
            console.log('❌ Manager "Suresh" not found');
            return;
        }
        
        console.log('👨‍💼 Manager found:', {
            username: manager.username,
            role: manager.role,
            site: manager.site || 'NULL',
            company: manager.company || 'NULL'
        });
        
        // Create a JWT token like the login would
        const token = jwt.sign(
            { 
                id: manager._id, 
                username: manager.username, 
                role: manager.role,
                site: manager.site,
                company: manager.company
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        console.log('\n🎫 JWT Token payload:', {
            id: manager._id,
            username: manager.username,
            role: manager.role,
            site: manager.site || 'NULL',
            company: manager.company || 'NULL'
        });
        
        // Get users created by this manager (like the dashboard does)
        const directUsers = await User.find({ 'createdBy.id': manager._id }).select('username _id role site company');
        console.log('\n👥 Users created directly by manager:', directUsers.map(u => ({
            username: u.username,
            role: u.role,
            site: u.site || 'NULL',
            company: u.company || 'NULL'
        })));
        
        // Get admins created by manager
        const admins = directUsers.filter(u => u.role === 'admin');
        console.log('\n👨‍💼 Admins created by manager:', admins.map(a => ({
            username: a.username,
            site: a.site || 'NULL',
            company: a.company || 'NULL'
        })));
        
        // Get users created by those admins
        for (const admin of admins) {
            const usersCreatedByAdmin = await User.find({ 'createdBy.id': admin._id }).select('username role site company');
            console.log(`\n👤 Users created by admin ${admin.username}:`, usersCreatedByAdmin.map(u => ({
                username: u.username,
                role: u.role,
                site: u.site || 'NULL',
                company: u.company || 'NULL'
            })));
        }
        
        // Simulate what the frontend would see
        const allUsers = [...directUsers];
        for (const admin of admins) {
            const usersCreatedByAdmin = await User.find({ 'createdBy.id': admin._id }).select('username role site company');
            allUsers.push(...usersCreatedByAdmin);
        }
        
        const sites = new Set();
        const companies = new Set();
        allUsers.forEach(u => {
            if (u.site) sites.add(u.site);
            if (u.company) companies.add(u.company);
        });
        
        console.log('\n🏢 Sites available to manager:', Array.from(sites));
        console.log('🏢 Companies available to manager:', Array.from(companies));
        
        // Check what database name would be used
        if (sites.size > 0 && companies.size > 0) {
            const site = Array.from(sites)[0];
            const company = Array.from(companies)[0];
            const dbName = `${site}_${company}`.toLowerCase().replace(/[^a-z0-9]/g, '_');
            console.log(`\n🗄️ Database name that would be used: "${dbName}"`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

async function main() {
    await connectDB();
    await debugManagerToken();
    await mongoose.disconnect();
    console.log('\n✅ Debug completed');
}

main().catch(console.error);
