const mongoose = require('mongoose');
require('dotenv').config();

// Import User model
const User = require('../models/user');

// Connect to MongoDB
async function connectToDatabase() {
    try {
        const uri = process.env.MONGOOSE_URI || 'mongodb://localhost:27017/daily_report_system';
        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ Error connecting to MongoDB:', error);
        process.exit(1);
    }
}

// Check manager users
async function checkManagerUsers() {
    try {
        await connectToDatabase();
        
        console.log('🔍 Checking manager users in database...\n');
        
        // Find all users
        const allUsers = await User.find({});
        console.log(`📊 Total users in database: ${allUsers.length}`);
        
        // Find manager users
        const managerUsers = await User.find({ role: { $in: ['manager', 'admin'] } });
        console.log(`👥 Manager/Admin users: ${managerUsers.length}`);
        
        if (managerUsers.length > 0) {
            console.log('\n📋 Manager/Admin user details:');
            managerUsers.forEach((user, index) => {
                console.log(`${index + 1}. Username: ${user.username}`);
                console.log(`   Role: ${user.role}`);
                console.log(`   Site: ${user.site || 'Not specified'}`);
                console.log(`   Company: ${user.company || 'Not specified'}`);
                console.log(`   Created: ${user.createdAt}`);
                console.log(`   Has password: ${user.password ? 'Yes' : 'No'}`);
                console.log('');
            });
        }
        
        // Test specific manager login
        console.log('🧪 Testing manager1 login...');
        const manager1 = await User.findOne({ username: 'manager1' });
        if (manager1) {
            console.log('✅ manager1 found in database');
            console.log(`   Role: ${manager1.role}`);
            console.log(`   Password hash: ${manager1.password.substring(0, 20)}...`);
            
            // Test password comparison
            const bcrypt = require('bcryptjs');
            const isMatch = await bcrypt.compare('manager123', manager1.password);
            console.log(`   Password match: ${isMatch}`);
        } else {
            console.log('❌ manager1 not found in database');
        }
        
    } catch (error) {
        console.error('❌ Error checking manager users:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Run the check
if (require.main === module) {
    checkManagerUsers();
}

module.exports = { checkManagerUsers }; 