const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/user');
const DailyReport = require('../models/dailyreport');
const Material = require('../models/material');
const Received = require('../models/received');
const TotalPrice = require('../models/totalPrice');
const MonthlyReport = require('../models/montlyreport');
const { getSiteModels } = require('../models/siteDatabase');

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/daily_report_system');
    console.log('✅ Database connected for migration');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

// Migrate data to site-specific databases
const migrateToSiteDatabases = async () => {
  try {
    console.log('🚀 Starting migration to site-specific databases...\n');

    // Get all users to determine sites
    const users = await User.find().select('-password');
    console.log(`👥 Found ${users.length} users`);

    if (users.length === 0) {
      console.log('⚠️ No users found. Please create some users first.');
      return;
    }

    // Get unique sites
    const sites = [...new Set(users.map(user => ({ site: user.site, company: user.company })))];
    console.log(`📍 Found ${sites.length} unique sites:`, sites.map(s => `${s.site}_${s.company}`));

    // Migrate data for each site
    for (const siteInfo of sites) {
      const { site, company } = siteInfo;
      console.log(`\n📋 Migrating data for site: ${site} (Company: ${company})`);

      try {
        // Get site-specific models
        const siteModels = await getSiteModels(site, company);

        // Migrate Daily Reports
        const dailyReports = await DailyReport.find({ site, company });
        if (dailyReports.length > 0) {
          // Remove site and company fields before inserting
          const cleanDailyReports = dailyReports.map(report => {
            const { site, company, ...cleanReport } = report.toObject();
            return cleanReport;
          });
          await siteModels.SiteDailyReport.insertMany(cleanDailyReports);
          console.log(`   ✅ Migrated ${dailyReports.length} daily reports`);
        }

        // Migrate Materials
        const materials = await Material.find({ site, company });
        if (materials.length > 0) {
          const cleanMaterials = materials.map(material => {
            const { site, company, ...cleanMaterial } = material.toObject();
            return cleanMaterial;
          });
          await siteModels.SiteMaterial.insertMany(cleanMaterials);
          console.log(`   ✅ Migrated ${materials.length} materials`);
        }

        // Migrate Received Items
        const receivedItems = await Received.find({ site, company });
        if (receivedItems.length > 0) {
          const cleanReceivedItems = receivedItems.map(item => {
            const { site, company, ...cleanItem } = item.toObject();
            return cleanItem;
          });
          await siteModels.SiteReceived.insertMany(cleanReceivedItems);
          console.log(`   ✅ Migrated ${receivedItems.length} received items`);
        }

        // Migrate Total Prices
        const totalPrices = await TotalPrice.find({ site, company });
        if (totalPrices.length > 0) {
          const cleanTotalPrices = totalPrices.map(price => {
            const { site, company, ...cleanPrice } = price.toObject();
            return cleanPrice;
          });
          await siteModels.SiteTotalPrice.insertMany(cleanTotalPrices);
          console.log(`   ✅ Migrated ${totalPrices.length} total price records`);
        }

        // Migrate Monthly Reports
        const monthlyReports = await MonthlyReport.find({ site, company });
        if (monthlyReports.length > 0) {
          const cleanMonthlyReports = monthlyReports.map(report => {
            const { site, company, ...cleanReport } = report.toObject();
            return cleanReport;
          });
          await siteModels.SiteMonthlyReport.insertMany(cleanMonthlyReports);
          console.log(`   ✅ Migrated ${monthlyReports.length} monthly reports`);
        }

        console.log(`   🎉 Successfully migrated all data for ${site}`);

      } catch (error) {
        console.error(`   ❌ Error migrating data for ${site}:`, error.message);
      }
    }

    console.log('\n📊 Migration Summary:');
    
    // Show summary for each site
    for (const siteInfo of sites) {
      const { site, company } = siteInfo;
      const siteModels = await getSiteModels(site, company);
      
      const dailyReportsCount = await siteModels.SiteDailyReport.countDocuments();
      const materialsCount = await siteModels.SiteMaterial.countDocuments();
      const receivedItemsCount = await siteModels.SiteReceived.countDocuments();
      const totalPricesCount = await siteModels.SiteTotalPrice.countDocuments();
      const monthlyReportsCount = await siteModels.SiteMonthlyReport.countDocuments();
      
      console.log(`\n📍 Site: ${site}_${company}`);
      console.log(`   📊 Daily Reports: ${dailyReportsCount}`);
      console.log(`   🧱 Materials: ${materialsCount}`);
      console.log(`   📦 Received Items: ${receivedItemsCount}`);
      console.log(`   💰 Total Prices: ${totalPricesCount}`);
      console.log(`   📈 Monthly Reports: ${monthlyReportsCount}`);
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n⚠️  IMPORTANT: After verifying the migration, you can delete the old data from the main database.');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
};

// Run migration
const runMigration = async () => {
  await connectDB();
  await migrateToSiteDatabases();
  await mongoose.disconnect();
  console.log('✅ Migration script completed');
  process.exit(0);
};

// Handle command line arguments
if (require.main === module) {
  runMigration();
}

module.exports = { migrateToSiteDatabases }; 