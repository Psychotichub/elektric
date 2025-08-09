const mongoose = require('mongoose');
require('dotenv').config();

// Import User model
const User = require('../models/user');
const { createManagerAccount } = require('./createManagerAccount');

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

// Delete and recreate manager accounts
async function deleteAndRecreateManagers() {
    try {
        await connectToDatabase();
        
        console.log('🗑️ Deleting existing manager accounts...');
        
        // Delete existing manager accounts
        const deleteResult = await User.deleteMany({ 
            role: { $in: ['manager'] },
            username: { $in: ['manager1', 'manager2', 'admin'] }
        });
        
        console.log(`✅ Deleted ${deleteResult.deletedCount} existing manager accounts`);
        
        // Recreate manager accounts
        console.log('\n🔄 Recreating manager accounts...');
        
        const managerAccounts = [
            {
                username: 'manager1',
                password: 'manager123',
                email: 'manager1@example.com',
                site: 'Sion',
                company: 'Sion'
            },
            {
                username: 'manager2',
                password: 'manager456',
                email: 'manager2@example.com',
                site: 'Arsi',
                company: 'Power'
            },
            {
                username: 'admin',
                password: 'admin123',
                email: 'admin@example.com',
                site: 'Sion',
                company: 'Sion'
            }
        ];
        
        for (const account of managerAccounts) {
            console.log(`📝 Creating account: ${account.username}`);
            const result = await createManagerAccount(
                account.username,
                account.password,
                account.email,
                account.site,
                account.company
            );
            
            if (result.success) {
                console.log('✅ Success\n');
            } else {
                console.log(`❌ Failed: ${result.message}\n`);
            }
        }
        
        console.log('🎉 Manager accounts recreated successfully!');
        console.log('\n📋 Available manager accounts:');
        console.log('   Username: manager1, Password: manager123');
        console.log('   Username: manager2, Password: manager456');
        console.log('   Username: admin, Password: admin123');
        
    } catch (error) {
        console.error('❌ Error in deleteAndRecreateManagers:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Run the script
if (require.main === module) {
    deleteAndRecreateManagers();
}

module.exports = { deleteAndRecreateManagers }; 