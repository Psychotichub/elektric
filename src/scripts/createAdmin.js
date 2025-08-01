const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/user');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Create admin user with flexible options
async function createAdminUser() {
  try {
    // Get admin credentials from environment variables or use defaults
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminSite = process.env.ADMIN_SITE;
    const adminCompany = process.env.ADMIN_COMPANY;
    
    console.log('🚀 Creating admin user with credentials:');
    console.log('📍 Site:', adminSite);
    console.log('🏢 Company:', adminCompany);
    console.log('👤 Username:', adminUsername);
    console.log('🔑 Role: admin');
    
    // Check if admin already exists
    const adminExists = await User.findOne({ username: adminUsername });
    
    if (adminExists) {
      console.log('✅ Admin user already exists:');
      console.log('  - Username:', adminExists.username);
      console.log('  - Site:', adminExists.site || 'Not set');
      console.log('  - Company:', adminExists.company || 'Not set');
      console.log('  - Role:', adminExists.role);
      process.exit(0);
    }
    
    // Create new admin user
    const adminUser = new User({
      username: adminUsername,
      password: adminPassword, // This will be hashed by the pre-save hook
      site: adminSite,
      company: adminCompany,
      role: 'admin'
    });
    
    await adminUser.save();
    console.log('✅ Admin user created successfully!');
    console.log('📍 Site:', adminSite);
    console.log('🏢 Company:', adminCompany);
    console.log('👤 Username:', adminUsername);
    console.log('🔑 Password:', adminPassword);
    console.log('🔑 Role: admin');
    console.log('');
    console.log('🎉 You can now login with:');
    console.log('   Username:', adminUsername);
    console.log('   Password:', adminPassword);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    if (error.code === 11000) {
      console.log('💡 User already exists in database');
    }
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the function
createAdminUser(); 