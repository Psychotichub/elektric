require('dotenv').config();
const { connectToMongoose } = require('../db/mongoose');
const mongoose = require('mongoose');
const siteDatabaseManager = require('../db/siteDatabaseManager');
const { getSiteModels, getUserModels } = require('../models/siteUserModels');
const User = require('../models/user');

/**
 * Create admin user with site-based database structure
 */
async function createAdminUser() {
  try {
    console.log('🚀 Creating admin user with site-based database structure...');
    
    // Connect to MongoDB
    await connectToMongoose();
    console.log('✅ Connected to MongoDB');
    
    // Get admin credentials from environment variables or use defaults
    const adminUsername = process.env.ADMIN_USERNAME || process.env.USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || process.env.PASSWORD || 'admin123';
    const adminSite = process.env.ADMIN_SITE || process.env.Site || 'DefaultSite';
    const adminCompany = process.env.ADMIN_COMPANY || process.env.COMPANY || 'DefaultCompany';
    
    console.log('📋 Admin credentials:');
    console.log('📍 Site:', adminSite);
    console.log('🏢 Company:', adminCompany);
    console.log('👤 Username:', adminUsername);
    console.log('🔑 Role: admin');
    
    // Check if admin already exists in main user database
    const adminExists = await User.findOne({ 
      username: adminUsername,
      site: adminSite,
      company: adminCompany
    });
    
    if (adminExists) {
      console.log('✅ Admin user already exists in main database:');
      console.log('  - Username:', adminExists.username);
      console.log('  - Site:', adminExists.site);
      console.log('  - Company:', adminExists.company);
      console.log('  - Role:', adminExists.role);
      
      // Check if site structure exists
      try {
        const siteModels = await getSiteModels(adminSite, adminCompany);
        const siteUser = await siteModels.SiteUser.findOne({ username: adminUsername });
        
        if (siteUser) {
          console.log('✅ Admin user exists in site database');
        } else {
          console.log('⚠️ Admin user not found in site database, creating...');
          await createSiteAdminUser(adminUsername, adminPassword, adminSite, adminCompany);
        }
      } catch (error) {
        console.log('⚠️ Site database not initialized, creating site structure...');
        await createSiteAdminUser(adminUsername, adminPassword, adminSite, adminCompany);
      }
      
      process.exit(0);
    }
    
    // Create new admin user in main database
    console.log('📝 Creating admin user in main database...');
    const adminUser = new User({
      username: adminUsername,
      password: adminPassword,
      site: adminSite,
      company: adminCompany,
      role: 'admin'
    });
    
    await adminUser.save();
    console.log('✅ Admin user created in main database');
    
    // Create site-based structure for admin
    await createSiteAdminUser(adminUsername, adminPassword, adminSite, adminCompany);
    
    console.log('');
    console.log('🎉 Admin user created successfully!');
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

/**
 * Create admin user in site-based database structure
 */
async function createSiteAdminUser(username, password, site, company) {
  try {
    console.log('🏗️ Creating site-based database structure...');
    
    // Create site folder structure
    const siteFolder = siteDatabaseManager.createSiteFolder(site, company);
    console.log('📁 Site folder created:', siteFolder);
    
    // Initialize site models
    const siteModels = await getSiteModels(site, company);
    console.log('✅ Site models initialized');
    
    // Create site configuration if not exists
    const existingConfig = await siteModels.SiteConfig.findOne({
      siteName: site,
      companyName: company
    });
    
    if (!existingConfig) {
      await siteModels.SiteConfig.create({
        siteName: site,
        companyName: company,
        settings: {
          currency: 'USD',
          timezone: 'UTC',
          dateFormat: 'YYYY-MM-DD',
          backupFrequency: 'weekly'
        }
      });
      console.log('✅ Site configuration created');
    }
    
    // Create admin user in site database
    const existingSiteUser = await siteModels.SiteUser.findOne({ username });
    
    if (!existingSiteUser) {
      await siteModels.SiteUser.create({
        username,
        password,
        email: `${username}@${site}.com`,
        role: 'admin',
        permissions: ['read', 'write', 'delete', 'admin'],
        isActive: true
      });
      console.log('✅ Admin user created in site database');
    } else {
      console.log('✅ Admin user already exists in site database');
    }
    
    // Initialize admin user database
    const userModels = await getUserModels(username, site, company);
    console.log('✅ Admin user models initialized');
    
    // Create admin user settings
    const existingSettings = await userModels.UserSettings.findOne({ userId: username });
    
    if (!existingSettings) {
      await userModels.UserSettings.create({
        userId: username,
        preferences: {
          defaultLocation: '',
          defaultUnit: 'pcs',
          notifications: true,
          theme: 'light'
        }
      });
      console.log('✅ Admin user settings created');
    } else {
      console.log('✅ Admin user settings already exist');
    }
    
    console.log('✅ Site-based database structure completed');
    
  } catch (error) {
    console.error('❌ Error creating site admin user:', error.message);
    throw error;
  }
}

/**
 * Create a new site with admin user
 */
async function createNewSiteWithAdmin(siteName, companyName, adminUsername, adminPassword, adminEmail) {
  try {
    console.log(`🏗️ Creating new site: ${siteName} - ${companyName}`);
    
    // Connect to MongoDB
    await connectToMongoose();
    console.log('✅ Connected to MongoDB');
    
    // Create admin user in main database
    const adminUser = new User({
      username: adminUsername,
      password: adminPassword,
      site: siteName,
      company: companyName,
      role: 'admin'
    });
    
    await adminUser.save();
    console.log('✅ Admin user created in main database');
    
    // Create site-based structure
    await createSiteAdminUser(adminUsername, adminPassword, siteName, companyName);
    
    console.log(`🎉 New site ${siteName} created successfully!`);
    console.log('👤 Admin user:', adminUsername);
    console.log('🔑 Password:', adminPassword);
    
    return {
      success: true,
      siteName,
      companyName,
      adminUsername,
      adminPassword
    };
    
  } catch (error) {
    console.error(`❌ Error creating new site ${siteName}:`, error.message);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Export functions
module.exports = {
  createAdminUser,
  createSiteAdminUser,
  createNewSiteWithAdmin
};

// Run the function if called directly
if (require.main === module) {
  createAdminUser();
} 