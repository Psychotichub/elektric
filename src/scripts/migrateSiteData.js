const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/user');
const DailyReport = require('../models/dailyreport');
const Material = require('../models/material');
const Received = require('../models/received');
const TotalPrice = require('../models/totalPrice');
const MonthlyReport = require('../models/montlyreport');

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

// Migration function
const migrateSiteData = async () => {
  try {
    console.log('🔄 Starting site data migration...');

    // Get all users
    const users = await User.find();
    console.log(`👥 Found ${users.length} users`);

    let migratedCount = 0;

    for (const user of users) {
      console.log(`\n📋 Processing user: ${user.username} (${user.site}, ${user.company})`);

      // Skip users without site/company info
      if (!user.site || !user.company) {
        console.log(`⚠️ Skipping user ${user.username} - missing site/company info`);
        continue;
      }

      // Migrate Daily Reports
      const dailyReportsToUpdate = await DailyReport.find({
        site: { $exists: false },
        company: { $exists: false }
      });
      
      if (dailyReportsToUpdate.length > 0) {
        await DailyReport.updateMany(
          { site: { $exists: false }, company: { $exists: false } },
          { $set: { site: user.site, company: user.company } }
        );
        console.log(`✅ Updated ${dailyReportsToUpdate.length} daily reports`);
        migratedCount += dailyReportsToUpdate.length;
      }

      // Migrate Materials
      const materialsToUpdate = await Material.find({
        site: { $exists: false },
        company: { $exists: false }
      });
      
      if (materialsToUpdate.length > 0) {
        await Material.updateMany(
          { site: { $exists: false }, company: { $exists: false } },
          { $set: { site: user.site, company: user.company } }
        );
        console.log(`✅ Updated ${materialsToUpdate.length} materials`);
        migratedCount += materialsToUpdate.length;
      }

      // Migrate Received Items
      const receivedToUpdate = await Received.find({
        site: { $exists: false },
        company: { $exists: false }
      });
      
      if (receivedToUpdate.length > 0) {
        await Received.updateMany(
          { site: { $exists: false }, company: { $exists: false } },
          { $set: { site: user.site, company: user.company } }
        );
        console.log(`✅ Updated ${receivedToUpdate.length} received items`);
        migratedCount += receivedToUpdate.length;
      }

      // Migrate Total Price Data
      const totalPriceToUpdate = await TotalPrice.find({
        site: { $exists: false },
        company: { $exists: false }
      });
      
      if (totalPriceToUpdate.length > 0) {
        await TotalPrice.updateMany(
          { site: { $exists: false }, company: { $exists: false } },
          { $set: { site: user.site, company: user.company } }
        );
        console.log(`✅ Updated ${totalPriceToUpdate.length} total price records`);
        migratedCount += totalPriceToUpdate.length;
      }

      // Migrate Monthly Reports
      const monthlyReportsToUpdate = await MonthlyReport.find({
        site: { $exists: false },
        company: { $exists: false }
      });
      
      if (monthlyReportsToUpdate.length > 0) {
        await MonthlyReport.updateMany(
          { site: { $exists: false }, company: { $exists: false } },
          { $set: { site: user.site, company: user.company } }
        );
        console.log(`✅ Updated ${monthlyReportsToUpdate.length} monthly reports`);
        migratedCount += monthlyReportsToUpdate.length;
      }
    }

    console.log(`\n🎉 Migration completed! Total records updated: ${migratedCount}`);

    // Verify migration
    console.log('\n🔍 Verifying migration...');
    
    const dailyReportsWithoutSite = await DailyReport.find({ site: { $exists: false } });
    const materialsWithoutSite = await Material.find({ site: { $exists: false } });
    const receivedWithoutSite = await Received.find({ site: { $exists: false } });
    const totalPriceWithoutSite = await TotalPrice.find({ site: { $exists: false } });
    const monthlyReportsWithoutSite = await MonthlyReport.find({ site: { $exists: false } });

    const totalUnmigrated = dailyReportsWithoutSite.length + 
                           materialsWithoutSite.length + 
                           receivedWithoutSite.length + 
                           totalPriceWithoutSite.length + 
                           monthlyReportsWithoutSite.length;

    if (totalUnmigrated === 0) {
      console.log('✅ All data has been successfully migrated with site information!');
    } else {
      console.log(`⚠️ ${totalUnmigrated} records still need site information`);
      console.log(`   - Daily Reports: ${dailyReportsWithoutSite.length}`);
      console.log(`   - Materials: ${materialsWithoutSite.length}`);
      console.log(`   - Received Items: ${receivedWithoutSite.length}`);
      console.log(`   - Total Price: ${totalPriceWithoutSite.length}`);
      console.log(`   - Monthly Reports: ${monthlyReportsWithoutSite.length}`);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
};

// Run migration
const runMigration = async () => {
  await connectDB();
  await migrateSiteData();
  await mongoose.disconnect();
  console.log('✅ Migration script completed');
  process.exit(0);
};

// Handle command line arguments
if (require.main === module) {
  runMigration();
}

module.exports = { migrateSiteData }; 