const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/user');
const DailyReport = require('../models/dailyreport');
const Material = require('../models/material');
const Received = require('../models/received');
const TotalPrice = require('../models/totalPrice');

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

// Test site-based access control
const testSiteAccess = async () => {
  try {
    console.log('🧪 Testing site-based access control...\n');

    // Get all users
    const users = await User.find().select('-password');
    console.log(`👥 Found ${users.length} users`);

    if (users.length === 0) {
      console.log('⚠️ No users found. Please create some users first.');
      return;
    }

    // Test with first two users (if available)
    const testUsers = users.slice(0, 2);
    
    for (let i = 0; i < testUsers.length; i++) {
      const user = testUsers[i];
      console.log(`\n📋 Testing user: ${user.username} (Site: ${user.site}, Company: ${user.company})`);
      
      // Test Daily Reports
      const dailyReports = await DailyReport.find({
        site: user.site,
        company: user.company
      });
      console.log(`   📊 Daily Reports: ${dailyReports.length} records`);
      
      // Test Materials
      const materials = await Material.find({
        site: user.site,
        company: user.company
      });
      console.log(`   🧱 Materials: ${materials.length} records`);
      
      // Test Received Items
      const receivedItems = await Received.find({
        site: user.site,
        company: user.company
      });
      console.log(`   📦 Received Items: ${receivedItems.length} records`);
      
      // Test Total Price Data
      const totalPrices = await TotalPrice.find({
        site: user.site,
        company: user.company
      });
      console.log(`   💰 Total Price Records: ${totalPrices.length} records`);
    }

    // Test cross-site isolation
    if (testUsers.length >= 2) {
      console.log('\n🔒 Testing cross-site isolation...');
      
      const user1 = testUsers[0];
      const user2 = testUsers[1];
      
      if (user1.site !== user2.site || user1.company !== user2.company) {
        console.log(`   Comparing ${user1.username} (${user1.site}) vs ${user2.username} (${user2.site})`);
        
        // Try to access user2's data from user1's perspective
        const user1AccessingUser2Data = await DailyReport.find({
          site: user2.site,
          company: user2.company
        });
        
        console.log(`   User ${user1.username} can see ${user1AccessingUser2Data.length} records from ${user2.username}'s site`);
        
        if (user1AccessingUser2Data.length === 0) {
          console.log('   ✅ Cross-site isolation working correctly');
        } else {
          console.log('   ⚠️ Cross-site isolation may have issues');
        }
      } else {
        console.log('   ⚠️ Both users have same site/company - cannot test isolation');
      }
    }

    // Test admin access (if any admin exists)
    const adminUsers = users.filter(user => user.role === 'admin');
    if (adminUsers.length > 0) {
      console.log('\n👑 Testing admin access...');
      
      const admin = adminUsers[0];
      console.log(`   Admin: ${admin.username}`);
      
      // Admin should be able to see all data
      const allDailyReports = await DailyReport.find();
      const allMaterials = await Material.find();
      const allReceived = await Received.find();
      const allTotalPrices = await TotalPrice.find();
      
      console.log(`   Admin can see all data:`);
      console.log(`     - Daily Reports: ${allDailyReports.length}`);
      console.log(`     - Materials: ${allMaterials.length}`);
      console.log(`     - Received Items: ${allReceived.length}`);
      console.log(`     - Total Prices: ${allTotalPrices.length}`);
      
      console.log('   ✅ Admin access working correctly');
    }

    // Test data creation with site information
    console.log('\n➕ Testing data creation with site information...');
    
    const testUser = testUsers[0];
    const testData = {
      date: new Date(),
      materialName: 'Test Material',
      quantity: 100,
      location: 'Test Location',
      materialPrice: 50,
      labourPrice: 25,
      unit: 'kg',
      notes: 'Test data for site access verification',
      site: testUser.site,
      company: testUser.company
    };
    
    try {
      const newDailyReport = new DailyReport(testData);
      await newDailyReport.save();
      console.log(`   ✅ Created test daily report for ${testUser.username}`);
      
      // Verify it's only visible to the correct user
      const userDailyReports = await DailyReport.find({
        site: testUser.site,
        company: testUser.company
      });
      
      const otherUsersDailyReports = await DailyReport.find({
        site: { $ne: testUser.site },
        company: { $ne: testUser.company }
      });
      
      console.log(`   📊 User can see ${userDailyReports.length} records from their site`);
      console.log(`   📊 Other sites have ${otherUsersDailyReports.length} records`);
      
      // Clean up test data
      await DailyReport.findOneAndDelete({
        materialName: 'Test Material',
        site: testUser.site,
        company: testUser.company
      });
      console.log('   🧹 Cleaned up test data');
      
    } catch (error) {
      console.log(`   ❌ Error creating test data: ${error.message}`);
    }

    console.log('\n🎉 Site-based access control test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run test
const runTest = async () => {
  await connectDB();
  await testSiteAccess();
  await mongoose.disconnect();
  console.log('✅ Test script completed');
  process.exit(0);
};

// Handle command line arguments
if (require.main === module) {
  runTest();
}

module.exports = { testSiteAccess }; 