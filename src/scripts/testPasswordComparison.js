const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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

// Test password comparison
async function testPasswordComparison() {
    try {
        await connectToDatabase();
        
        console.log('🧪 Testing password comparison...\n');
        
        // Find manager1 user
        const user = await User.findOne({ username: 'manager1' });
        
        if (!user) {
            console.log('❌ manager1 user not found');
            return;
        }
        
        console.log('✅ Found user:', user.username);
        console.log('📋 User details:');
        console.log(`   Role: ${user.role}`);
        console.log(`   Site: ${user.site}`);
        console.log(`   Company: ${user.company}`);
        console.log(`   Password hash: ${user.password.substring(0, 20)}...`);
        
        // Test password comparison using the model method
        console.log('\n🔍 Testing password comparison using model method...');
        const modelResult = await user.comparePassword('manager123');
        console.log('✅ Model method result:', modelResult);
        
        // Test password comparison using bcrypt directly
        console.log('\n🔍 Testing password comparison using bcrypt directly...');
        const bcryptResult = await bcrypt.compare('manager123', user.password);
        console.log('✅ Bcrypt direct result:', bcryptResult);
        
        // Test with wrong password
        console.log('\n🔍 Testing with wrong password...');
        const wrongResult = await user.comparePassword('wrongpassword');
        console.log('✅ Wrong password result:', wrongResult);
        
        // Test creating a new hash
        console.log('\n🔍 Testing new hash creation...');
        const newHash = await bcrypt.hash('manager123', 10);
        console.log('✅ New hash created:', newHash.substring(0, 20) + '...');
        
        // Test comparing with new hash
        const newHashResult = await bcrypt.compare('manager123', newHash);
        console.log('✅ New hash comparison result:', newHashResult);
        
    } catch (error) {
        console.error('❌ Error in testPasswordComparison:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Run the test
if (require.main === module) {
    testPasswordComparison();
}

module.exports = { testPasswordComparison }; 