const { MongoClient } = require('mongodb');

/**
 * Database Management Utility
 * Provides functions to manage user-specific databases in MongoDB only
 */
class DatabaseManager {
    constructor() {
        this.baseUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
        console.log('🔧 DatabaseManager initialized with URI:', this.baseUri);
    }

    /**
     * List all user databases in the MongoDB instance
     * @returns {Promise<Array>} Array of database names
     */
    async listAllUserDatabases() {
        try {
            console.log('🔍 Connecting to MongoDB with URI:', this.baseUri);
            const client = new MongoClient(this.baseUri);
            await client.connect();
            
            const adminDb = client.db('admin');
            const result = await adminDb.admin().listDatabases();
            
            await client.close();
            
            console.log('📊 All databases found:', result.databases.length);
            
            // Filter for user-specific databases
            const userDatabases = result.databases
                .filter(db => db.name.startsWith('daily_report_'))
                .map(db => ({
                    name: db.name,
                    sizeOnDisk: db.sizeOnDisk,
                    empty: db.empty
                }));
            
            console.log('👥 User databases found:', userDatabases.length);
            return userDatabases;
        } catch (error) {
            console.error('❌ Error listing user databases:', error);
            // Return empty array instead of throwing error
            return [];
        }
    }

    /**
     * Get detailed information about a specific user database
     * @param {string} dbName - Database name
     * @returns {Promise<Object>} Database information
     */
    async getUserDatabaseInfo(dbName) {
        try {
            const client = new MongoClient(this.baseUri);
            await client.connect();
            
            const db = client.db(dbName);
            const collections = await db.listCollections().toArray();
            
            const collectionInfo = await Promise.all(
                collections.map(async (collection) => {
                    const count = await db.collection(collection.name).countDocuments();
                    return {
                        name: collection.name,
                        documentCount: count
                    };
                })
            );
            
            await client.close();
            
            return {
                databaseName: dbName,
                collections: collectionInfo,
                totalCollections: collections.length
            };
        } catch (error) {
            console.error(`Error getting database info for ${dbName}:`, error);
            throw error;
        }
    }

    /**
     * Delete a user database
     * @param {string} dbName - Database name to delete
     * @returns {Promise<boolean>} Success status
     */
    async deleteUserDatabase(dbName) {
        try {
            const client = new MongoClient(this.baseUri);
            await client.connect();
            
            const db = client.db(dbName);
            await db.dropDatabase();
            
            await client.close();
            
            console.log(`Database ${dbName} deleted successfully`);
            return true;
        } catch (error) {
            console.error(`Error deleting database ${dbName}:`, error);
            throw error;
        }
    }

    /**
     * Get database statistics for all user databases
     * @returns {Promise<Object>} Statistics object
     */
    async getUserDatabaseStats() {
        try {
            const userDatabases = await this.listAllUserDatabases();
            
            const stats = {
                totalDatabases: userDatabases.length,
                totalSizeOnDisk: userDatabases.reduce((sum, db) => sum + db.sizeOnDisk, 0),
                emptyDatabases: userDatabases.filter(db => db.empty).length,
                nonEmptyDatabases: userDatabases.filter(db => !db.empty).length,
                databases: userDatabases
            };
            
            return stats;
        } catch (error) {
            console.error('Error getting database stats:', error);
            throw error;
        }
    }

    /**
     * Clean up inactive user databases (databases with no data)
     * @returns {Promise<Array>} Array of deleted database names
     */
    async cleanupEmptyDatabases() {
        try {
            const userDatabases = await this.listAllUserDatabases();
            const emptyDatabases = userDatabases.filter(db => db.empty);
            
            const deletedDatabases = [];
            
            for (const db of emptyDatabases) {
                try {
                    await this.deleteUserDatabase(db.name);
                    deletedDatabases.push(db.name);
                } catch (error) {
                    console.error(`Failed to delete database ${db.name}:`, error);
                }
            }
            
            return deletedDatabases;
        } catch (error) {
            console.error('Error cleaning up empty databases:', error);
            throw error;
        }
    }
}

// Create singleton instance
const databaseManager = new DatabaseManager();

module.exports = databaseManager; 