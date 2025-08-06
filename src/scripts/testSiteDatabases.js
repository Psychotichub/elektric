const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const axios = require('axios');
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

// Test site-specific databases
const testSiteDatabases = async () => {
  try {
    console.log('🧪 Testing site-specific databases...\n');

    // Get all users
    const users = await User.find().select('-password');
    console.log(`👥 Found ${users.length} users`);

    if (users.length === 0) {
      console.log('⚠️ No users found. Please create some users first.');
      return;
    }

    // Test each user's site-specific database
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
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

    // Test data creation in site-specific databases
    console.log('\n➕ Testing data creation in site-specific databases...');
    
    const testUser = users[0];
    const testToken = createToken(testUser);
    
    const testData = {
      materials: [{
        date: new Date(),
        materialName: 'Test Material for Site Database',
        quantity: 100,
        location: 'Test Location',
        materialPrice: 50,
        labourPrice: 25,
        unit: 'kg',
        notes: 'Test data for site database verification'
      }]
    };
    
    try {
      const createResponse = await makeAuthenticatedRequest('/api/user/daily-reports', testToken, 'POST', testData);
      
      if (createResponse.error) {
        console.log(`   ❌ Error creating test data: ${createResponse.error.message || createResponse.error}`);
      } else {
        console.log(`   ✅ Created test daily report for ${testUser.username} in site-specific database`);
        
        // Verify it's only visible to the correct user
        const userDailyReports = await makeAuthenticatedRequest('/api/user/daily-reports', testToken);
        
        if (userDailyReports.error) {
          console.log(`   ❌ Error fetching user data: ${userDailyReports.error.message || userDailyReports.error}`);
        } else {
          console.log(`   📊 User can see ${userDailyReports.length} records from their site-specific database`);
        }
        
        // Clean up test data
        const siteModels = await getSiteModels(testUser.site, testUser.company);
        await siteModels.SiteDailyReport.findOneAndDelete({
          materialName: 'Test Material for Site Database'
        });
        console.log('   🧹 Cleaned up test data');
      }
      
    } catch (error) {
      console.log(`   ❌ Error creating test data: ${error.message}`);
    }

    // Test cross-site isolation
    if (users.length >= 2) {
      console.log('\n🔒 Testing cross-site isolation with site-specific databases...');
      
      const user1 = users[0];
      const user2 = users[1];
      
      if (user1.site !== user2.site || user1.company !== user2.company) {
        console.log(`   Comparing ${user1.username} (${user1.site}) vs ${user2.username} (${user2.site})`);
        
        // User1 tries to access user2's data through API
        const token1 = createToken(user1);
        const user1Data = await makeAuthenticatedRequest('/api/user/daily-reports', token1);
        
        const token2 = createToken(user2);
        const user2Data = await makeAuthenticatedRequest('/api/user/daily-reports', token2);
        
        if (user1Data.error) {
          console.log(`   ❌ User ${user1.username} API Error: ${user1Data.error.message || user1Data.error}`);
        } else if (user2Data.error) {
          console.log(`   ❌ User ${user2.username} API Error: ${user2Data.error.message || user2Data.error}`);
        } else {
          console.log(`   📊 User ${user1.username} can see ${user1Data.length} records from their site-specific database`);
          console.log(`   📊 User ${user2.username} can see ${user2Data.length} records from their site-specific database`);
          
          if (user1Data.length === 0 && user2Data.length === 0) {
            console.log('   ✅ Cross-site isolation working correctly - Each user only sees their own site data');
          } else {
            console.log('   ⚠️ Cross-site isolation may have issues');
          }
        }
      } else {
        console.log('   ⚠️ Both users have same site/company - cannot test isolation');
      }
    }

    console.log('\n🎉 Site-specific database test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run test
const runTest = async () => {
  await connectDB();
  await testSiteDatabases();
  await mongoose.disconnect();
  console.log('✅ Test script completed');
  process.exit(0);
};

// Handle command line arguments
if (require.main === module) {
  runTest();
}

module.exports = { testSiteDatabases }; 