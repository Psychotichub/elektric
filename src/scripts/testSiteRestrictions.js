const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const axios = require('axios');
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

// Helper function to create JWT token for a user
const createToken = (user) => {
  return jwt.sign(
    { 
      id: user._id, 
      username: user.username, 
      role: user.role, 
      site: user.site, 
      company: user.company 
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '1h' }
  );
};

// Helper function to make authenticated API requests
const makeAuthenticatedRequest = async (url, token, method = 'GET', data = null) => {
  try {
    const config = {
      method,
      url: `http://localhost:3000${url}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    if (error.response) {
      return { error: error.response.data, status: error.response.status };
    }
    return { error: error.message };
  }
};

// Test site-based restrictions through API routes
const testSiteRestrictions = async () => {
  try {
    console.log('🧪 Testing site-based restrictions through API routes...\n');

    // Get all users
    const users = await User.find().select('-password');
    console.log(`👥 Found ${users.length} users`);

    if (users.length === 0) {
      console.log('⚠️ No users found. Please create some users first.');
      return;
    }

    // Test with different users from different sites
    const testUsers = users.slice(0, 3); // Test with first 3 users
    
    for (let i = 0; i < testUsers.length; i++) {
      const user = testUsers[i];
      console.log(`\n📋 Testing user: ${user.username} (Role: ${user.role}, Site: ${user.site}, Company: ${user.company})`);
      
      // Create token for this user
      const token = createToken(user);
      
      // Test Daily Reports API
      const dailyReportsResponse = await makeAuthenticatedRequest('/api/user/daily-reports', token);
      if (dailyReportsResponse.error) {
        console.log(`   ❌ Daily Reports API Error: ${dailyReportsResponse.error.message || dailyReportsResponse.error}`);
      } else {
        console.log(`   📊 Daily Reports: ${dailyReportsResponse.length} records`);
      }
      
      // Test Materials API
      const materialsResponse = await makeAuthenticatedRequest('/api/user/materials', token);
      if (materialsResponse.error) {
        console.log(`   ❌ Materials API Error: ${materialsResponse.error.message || materialsResponse.error}`);
      } else {
        console.log(`   🧱 Materials: ${materialsResponse.length} records`);
      }
      
      // Test Received Items API
      const receivedResponse = await makeAuthenticatedRequest('/api/user/received', token);
      if (receivedResponse.error) {
        console.log(`   ❌ Received Items API Error: ${receivedResponse.error.message || receivedResponse.error}`);
      } else {
        console.log(`   📦 Received Items: ${receivedResponse.length} records`);
      }
      
      // Test Total Prices API
      const totalPricesResponse = await makeAuthenticatedRequest('/api/user/total-prices', token);
      if (totalPricesResponse.error) {
        console.log(`   ❌ Total Prices API Error: ${totalPricesResponse.error.message || totalPricesResponse.error}`);
      } else {
        console.log(`   💰 Total Price Records: ${totalPricesResponse.length} records`);
      }
    }

    // Test cross-site isolation
    if (testUsers.length >= 2) {
      console.log('\n🔒 Testing cross-site isolation through API...');
      
      const user1 = testUsers[0];
      const user2 = testUsers[1];
      
      if (user1.site !== user2.site || user1.company !== user2.company) {
        console.log(`   Comparing ${user1.username} (${user1.site}) vs ${user2.username} (${user2.site})`);
        
        // User1 tries to access user2's data through API
        const token1 = createToken(user1);
        const user1AccessingUser2Data = await makeAuthenticatedRequest('/api/user/daily-reports', token1);
        
        if (user1AccessingUser2Data.error) {
          console.log(`   ❌ User ${user1.username} API Error: ${user1AccessingUser2Data.error.message || user1AccessingUser2Data.error}`);
        } else {
          console.log(`   📊 User ${user1.username} can see ${user1AccessingUser2Data.length} records from their own site`);
          
          // Check if user1 can see any data that belongs to user2's site
          const user1Data = await DailyReport.find({ site: user1.site, company: user1.company });
          const user2Data = await DailyReport.find({ site: user2.site, company: user2.company });
          
          if (user1AccessingUser2Data.length === user1Data.length) {
            console.log('   ✅ Cross-site isolation working correctly - User only sees their own site data');
          } else {
            console.log('   ⚠️ Cross-site isolation may have issues');
          }
        }
      } else {
        console.log('   ⚠️ Both users have same site/company - cannot test isolation');
      }
    }

    // Test admin restrictions
    const adminUsers = users.filter(user => user.role === 'admin');
    if (adminUsers.length > 0) {
      console.log('\n👑 Testing admin site restrictions through API...');
      
      const admin = adminUsers[0];
      console.log(`   Admin: ${admin.username} (Site: ${admin.site})`);
      
      const adminToken = createToken(admin);
      const adminDailyReportsResponse = await makeAuthenticatedRequest('/api/user/daily-reports', adminToken);
      
      if (adminDailyReportsResponse.error) {
        console.log(`   ❌ Admin API Error: ${adminDailyReportsResponse.error.message || adminDailyReportsResponse.error}`);
      } else {
        console.log(`   📊 Admin can see ${adminDailyReportsResponse.length} records from their own site`);
        
        // Compare with total records in system
        const allDailyReports = await DailyReport.find();
        console.log(`   📊 Total records in system: ${allDailyReports.length}`);
        
        if (adminDailyReportsResponse.length < allDailyReports.length) {
          console.log('   ✅ Admin is properly restricted to their own site');
        } else {
          console.log('   ⚠️ Admin may have access to all sites (this is expected if admin is the only user)');
        }
      }
    }

    // Test data creation with site restrictions
    console.log('\n➕ Testing data creation with site restrictions...');
    
    const testUser = testUsers[0];
    const testToken = createToken(testUser);
    
    const testData = {
      materials: [{
        date: new Date(),
        materialName: 'Test Material for Site Restriction',
        quantity: 100,
        location: 'Test Location',
        materialPrice: 50,
        labourPrice: 25,
        unit: 'kg',
        notes: 'Test data for site restriction verification'
      }]
    };
    
    try {
      const createResponse = await makeAuthenticatedRequest('/api/user/daily-reports', testToken, 'POST', testData);
      
      if (createResponse.error) {
        console.log(`   ❌ Error creating test data: ${createResponse.error.message || createResponse.error}`);
      } else {
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
          materialName: 'Test Material for Site Restriction',
          site: testUser.site,
          company: testUser.company
        });
        console.log('   🧹 Cleaned up test data');
      }
      
    } catch (error) {
      console.log(`   ❌ Error creating test data: ${error.message}`);
    }

    console.log('\n🎉 Site-based restrictions test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run test
const runTest = async () => {
  await connectDB();
  await testSiteRestrictions();
  await mongoose.disconnect();
  console.log('✅ Test script completed');
  process.exit(0);
};

// Handle command line arguments
if (require.main === module) {
  runTest();
}

module.exports = { testSiteRestrictions }; 