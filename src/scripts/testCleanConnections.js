const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/user');
const { getSiteModels } = require('../models/siteDatabase');

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/daily_report_system');
    console.log('✅ Database connected for testing');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

// Test clean database connections
const testCleanConnections = async () => {
  try {
    console.log('🧪 Testing clean database connections...\n');

    // Get all users
    const users = await User.find().select('-password');
    console.log(`👥 Found ${users.length} users`);

    if (users.length === 0) {
      console.log('⚠️ No users found. Please create some users first.');
      return;
    }

    // Test site-specific database connections
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      console.log(`\n📋 Testing site database for: ${user.username} (Site: ${user.site}, Company: ${user.company})`);
      
      try {
        // Get site-specific models (this will create the connection)
        const siteModels = await getSiteModels(user.site, user.company);
        
        // Test basic operations
        const dailyReportsCount = await siteModels.SiteDailyReport.countDocuments();
        const materialsCount = await siteModels.SiteMaterial.countDocuments();
        const receivedCount = await siteModels.SiteReceived.countDocuments();
        const totalPricesCount = await siteModels.SiteTotalPrice.countDocuments();
        
        console.log(`   📊 Daily Reports: ${dailyReportsCount} records`);
        console.log(`   🧱 Materials: ${materialsCount} records`);
        console.log(`   📦 Received Items: ${receivedCount} records`);
        console.log(`   💰 Total Prices: ${totalPricesCount} records`);
        
        console.log(`   ✅ Site database connection working for ${user.site}`);
        
      } catch (error) {
        console.log(`   ❌ Error connecting to site database: ${error.message}`);
      }
    }

    console.log('\n🎉 Clean database connections test completed!');
    console.log('✅ No deprecation warnings should appear above');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run test
const runTest = async () => {
  await connectDB();
  await testCleanConnections();
  await mongoose.disconnect();
  console.log('✅ Test script completed');
  process.exit(0);
};

// Handle command line arguments
if (require.main === module) {
  runTest();
}

module.exports = { testCleanConnections }; 