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

// Create manager account
async function createManagerAccount(username, password, email = null, company = null) {
    try {
        console.log(`🔧 Creating manager account for: ${username}`);
        
        // Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            console.log('❌ User already exists with this username');
            return { success: false, message: 'User already exists' };
        }
        
        // Create new manager user (password will be hashed by the model's pre-save hook)
        const managerUser = new User({
            username: username,
            password: password, // Don't hash here - the model will do it
            email: email,
            role: 'manager',
            company: company,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        
        // Save to database
        await managerUser.save();
        
        console.log('✅ Manager account created successfully');
        console.log('📋 Account details:');
        console.log(`   Username: ${username}`);
        console.log(`   Role: ${managerUser.role}`);
        console.log(`   Site: Not required for manager`);
        console.log(`   Company: ${company || 'Not specified'}`);
        console.log(`   Email: ${email || 'Not specified'}`);
        
        return { 
            success: true, 
            message: 'Manager account created successfully',
            user: {
                username: managerUser.username,
                role: managerUser.role,
                site: managerUser.site,
                company: managerUser.company,
                email: managerUser.email
            }
        };
        
    } catch (error) {
        console.error('❌ Error creating manager account:', error);
        return { success: false, message: error.message };
    }
}

// Main function to create manager accounts
async function main() {
    try {
        await connectToDatabase();
        
        // Single manager account to create (as requested)
        const managerAccounts = [
            {
                username: 'Suresh',
                password: '787223',
                email: 'suresh.pokhrel243@gmail.com',
                company: 'Sion Solution SRL'
            }
        ];
        
        console.log('🚀 Creating manager accounts...\n');
        
        for (const account of managerAccounts) {
            console.log(`📝 Creating account: ${account.username}`);
            const result = await createManagerAccount(account.username, account.password, account.email, account.company);
            
            if (result.success) {
                console.log('✅ Success\n');
            } else {
                console.log(`❌ Failed: ${result.message}\n`);
            }
        }
        
        console.log('🎉 Manager account creation completed!');
        console.log('\n📋 Available manager account:');
        console.log('   Username: Suresh, Password: 787223');
        
    } catch (error) {
        console.error('❌ Error in main function:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = { createManagerAccount }; 