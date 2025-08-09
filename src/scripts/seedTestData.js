const mongoose = require('mongoose');
const { getSiteModels } = require('../models/siteDatabase');
require('dotenv').config();

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/daily_report_system');
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
}

async function seedTestData() {
    try {
        console.log('🌱 Seeding test data for Arsi site...');
        
        const site = 'Arsi';
        const company = 'Sion Solution SRL';
        const siteModels = await getSiteModels(site, company);
        
        // Clear existing data
        await siteModels.SiteMaterial.deleteMany({});
        await siteModels.SiteDailyReport.deleteMany({});
        await siteModels.SiteTotalPrice.deleteMany({});
        console.log('🗑️ Cleared existing data');
        
        // Create test materials
        const materials = [
            { materialName: 'Cement', unit: 'kg', materialPrice: 50, laborPrice: 20, createdBy: 'Psychotic' },
            { materialName: 'Steel', unit: 'kg', materialPrice: 80, laborPrice: 30, createdBy: 'Psychotic' },
            { materialName: 'Brick', unit: 'pcs', materialPrice: 5, laborPrice: 2, createdBy: 'Prabin' },
            { materialName: 'Sand', unit: 'm3', materialPrice: 100, laborPrice: 50, createdBy: 'Suresh' }
        ];
        
        await siteModels.SiteMaterial.insertMany(materials);
        console.log('🧱 Created test materials:', materials.length);
        
        // Create test daily reports
        const today = new Date();
        const dailyReports = [
            {
                username: 'Psychotic',
                date: new Date(today.getFullYear(), today.getMonth(), 1),
                materialName: 'Cement',
                quantity: 100,
                unit: 'kg',
                materialPrice: 50,
                labourPrice: 20,
                location: 'Site A',
                notes: 'Foundation work'
            },
            {
                username: 'Prabin',
                date: new Date(today.getFullYear(), today.getMonth(), 2),
                materialName: 'Steel',
                quantity: 50,
                unit: 'kg',
                materialPrice: 80,
                labourPrice: 30,
                location: 'Site B',
                notes: 'Column reinforcement'
            },
            {
                username: 'Psychotic',
                date: new Date(today.getFullYear(), today.getMonth(), 3),
                materialName: 'Brick',
                quantity: 500,
                unit: 'pcs',
                materialPrice: 5,
                labourPrice: 2,
                location: 'Site A',
                notes: 'Wall construction'
            },
            {
                username: 'Suresh',
                date: new Date(today.getFullYear(), today.getMonth(), 5),
                materialName: 'Sand',
                quantity: 10,
                unit: 'm3',
                materialPrice: 100,
                labourPrice: 50,
                location: 'Site C',
                notes: 'Concrete mixing'
            }
        ];
        
        await siteModels.SiteDailyReport.insertMany(dailyReports);
        console.log('📊 Created test daily reports:', dailyReports.length);
        
        // Create test total prices
        const totalPrices = [
            {
                username: 'Psychotic',
                date: new Date(today.getFullYear(), today.getMonth(), 1),
                materialName: 'Cement',
                quantity: 100,
                unit: 'kg',
                materialPrice: 50,
                laborPrice: 20,
                materialCost: 5000, // 100 * 50
                laborCost: 2000,    // 100 * 20
                totalPrice: 7000,   // 5000 + 2000
                location: 'Site A',
                notes: 'Foundation work total'
            },
            {
                username: 'Prabin',
                date: new Date(today.getFullYear(), today.getMonth(), 2),
                materialName: 'Steel',
                quantity: 50,
                unit: 'kg',
                materialPrice: 80,
                laborPrice: 30,
                materialCost: 4000, // 50 * 80
                laborCost: 1500,    // 50 * 30
                totalPrice: 5500,   // 4000 + 1500
                location: 'Site B',
                notes: 'Steel work total'
            }
        ];
        
        await siteModels.SiteTotalPrice.insertMany(totalPrices);
        console.log('💰 Created test total prices:', totalPrices.length);
        
        console.log('✅ Test data seeded successfully!');
        
        // Verify data
        const materialCount = await siteModels.SiteMaterial.countDocuments();
        const reportCount = await siteModels.SiteDailyReport.countDocuments();
        const priceCount = await siteModels.SiteTotalPrice.countDocuments();
        
        console.log('\n📊 Data verification:');
        console.log(`🧱 Materials: ${materialCount}`);
        console.log(`📊 Daily Reports: ${reportCount}`);
        console.log(`💰 Total Prices: ${priceCount}`);
        
    } catch (error) {
        console.error('❌ Error seeding data:', error);
    }
}

async function main() {
    await connectDB();
    await seedTestData();
    await mongoose.disconnect();
    console.log('\n✅ Seeding completed');
}

main().catch(console.error);
