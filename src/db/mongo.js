const { MongoClient } = require('mongodb');
require('dotenv').config();

// Use environment variable or fallback to default local MongoDB
const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/daily_report_system';
// Extract database name from URI or use default
const dbName = process.env.DB_NAME || 'daily_report_system';

console.log('🔧 DatabaseManager initialized with URI:', uri);

let db;

async function connectToMongo() {
    try {
        console.log('🔌 Attempting to connect to MongoDB...');
        const client = new MongoClient(uri);
        await client.connect();
        db = client.db(dbName);
        console.log('✅ Successfully connected to MongoDB');
    } catch (error) {
        console.error('❌ Error connecting to MongoDB:', error);
        console.error('💡 Please ensure MongoDB is running on localhost:27017');
        process.exit(1);
    }
}

function getDb() {
    if (!db) {
        throw new Error('Database not initialized. Call connectToMongo first.');
    }
    return db;
}

module.exports = { connectToMongo, getDb };
