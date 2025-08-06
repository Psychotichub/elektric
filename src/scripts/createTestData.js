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

// Create test data for different sites
const createTestData = async () => {
  try {
    console.log('🧪 Creating test data for different sites...\n');

    // Get all users
    const users = await User.find().select('-password');
    console.log(`👥 Found ${users.length} users`);

    if (users.length === 0) {
      console.log('⚠️ No users found. Please create some users first.');
      return;
    }

    // Create test data for each user's site
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      console.log(`\n📋 Creating test data for: ${user.username} (Site: ${user.site}, Company: ${user.company})`);
      
      // Create test materials
      const testMaterials = [
        {
          materialName: `Test Material ${i + 1} - ${user.site}`,
          unit: 'kg',
          materialPrice: 100 + (i * 10),
          laborPrice: 50 + (i * 5),
          site: user.site,
          company: user.company
        },
        {
          materialName: `Another Material ${i + 1} - ${user.site}`,
          unit: 'pieces',
          materialPrice: 200 + (i * 15),
          laborPrice: 75 + (i * 8),
          site: user.site,
          company: user.company
        }
      ];

      // Create test daily reports
      const testDailyReports = [
        {
          date: new Date(),
          materialName: `Test Material ${i + 1} - ${user.site}`,
          quantity: 100 + (i * 10),
          location: `Test Location ${user.site}`,
          materialPrice: 100 + (i * 10),
          labourPrice: 50 + (i * 5),
          unit: 'kg',
          notes: `Test daily report for ${user.site}`,
          site: user.site,
          company: user.company
        },
        {
          date: new Date(),
          materialName: `Another Material ${i + 1} - ${user.site}`,
          quantity: 50 + (i * 5),
          location: `Another Location ${user.site}`,
          materialPrice: 200 + (i * 15),
          labourPrice: 75 + (i * 8),
          unit: 'pieces',
          notes: `Another test daily report for ${user.site}`,
          site: user.site,
          company: user.company
        }
      ];

      // Create test received items
      const testReceivedItems = [
        {
          date: new Date(),
          materialName: `Test Material ${i + 1} - ${user.site}`,
          quantity: 200 + (i * 20),
          supplier: `Test Supplier ${user.site}`,
          location: `Test Location ${user.site}`,
          notes: `Test received item for ${user.site}`,
          site: user.site,
          company: user.company
        }
      ];

      // Create test total prices
      const testTotalPrices = [
        {
          date: new Date(),
          materialName: `Test Material ${i + 1} - ${user.site}`,
          quantity: 100 + (i * 10),
          unit: 'kg',
          materialPrice: 100 + (i * 10),
          laborPrice: 50 + (i * 5),
          materialCost: (100 + (i * 10)) * (100 + (i * 10)),
          laborCost: (50 + (i * 5)) * (100 + (i * 10)),
          totalPrice: ((100 + (i * 10)) * (100 + (i * 10))) + ((50 + (i * 5)) * (100 + (i * 10))),
          location: `Test Location ${user.site}`,
          notes: `Test total price for ${user.site}`,
          site: user.site,
          company: user.company
        }
      ];

      try {
        // Insert materials
        await Material.insertMany(testMaterials);
        console.log(`   ✅ Created ${testMaterials.length} materials`);

        // Insert daily reports
        await DailyReport.insertMany(testDailyReports);
        console.log(`   ✅ Created ${testDailyReports.length} daily reports`);

        // Insert received items
        await Received.insertMany(testReceivedItems);
        console.log(`   ✅ Created ${testReceivedItems.length} received items`);

        // Insert total prices
        await TotalPrice.insertMany(testTotalPrices);
        console.log(`   ✅ Created ${testTotalPrices.length} total price records`);

      } catch (error) {
        console.log(`   ❌ Error creating test data for ${user.username}: ${error.message}`);
      }
    }

    console.log('\n🎉 Test data creation completed!');
    console.log('\n📊 Summary:');
    
    // Show summary by site
    const sites = [...new Set(users.map(user => user.site))];
    for (const site of sites) {
      const siteUsers = users.filter(user => user.site === site);
      const materials = await Material.countDocuments({ site });
      const dailyReports = await DailyReport.countDocuments({ site });
      const receivedItems = await Received.countDocuments({ site });
      const totalPrices = await TotalPrice.countDocuments({ site });
      
      console.log(`\n📍 Site: ${site}`);
      console.log(`   👥 Users: ${siteUsers.length}`);
      console.log(`   🧱 Materials: ${materials}`);
      console.log(`   📊 Daily Reports: ${dailyReports}`);
      console.log(`   📦 Received Items: ${receivedItems}`);
      console.log(`   💰 Total Prices: ${totalPrices}`);
    }

  } catch (error) {
    console.error('❌ Test data creation failed:', error);
  }
};

// Run test data creation
const runTestDataCreation = async () => {
  await connectDB();
  await createTestData();
  await mongoose.disconnect();
  console.log('✅ Test data creation script completed');
  process.exit(0);
};

// Handle command line arguments
if (require.main === module) {
  runTestDataCreation();
}

module.exports = { createTestData }; 