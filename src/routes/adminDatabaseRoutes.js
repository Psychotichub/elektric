const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const databaseManager = require('../utils/databaseManager');

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Admin access required' });
    }
};

// Apply authentication and admin middleware to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// Get all user databases
router.get('/databases', async (req, res) => {
    try {
        const databases = await databaseManager.listAllUserDatabases();
        res.json(databases);
    } catch (error) {
        console.error('Error getting databases:', error);
        res.status(500).json({ error: 'Failed to get databases' });
    }
});

// Get database statistics
router.get('/databases/stats', async (req, res) => {
    try {
        const stats = await databaseManager.getUserDatabaseStats();
        res.json(stats);
    } catch (error) {
        console.error('Error getting database stats:', error);
        res.status(500).json({ error: 'Failed to get database stats' });
    }
});

// Get detailed information about a specific database
router.get('/databases/:dbName', async (req, res) => {
    try {
        const { dbName } = req.params;
        const info = await databaseManager.getUserDatabaseInfo(dbName);
        res.json(info);
    } catch (error) {
        console.error('Error getting database info:', error);
        res.status(500).json({ error: 'Failed to get database info' });
    }
});

// Delete a specific database
router.delete('/databases/:dbName', async (req, res) => {
    try {
        const { dbName } = req.params;
        await databaseManager.deleteUserDatabase(dbName);
        res.json({ message: `Database ${dbName} deleted successfully` });
    } catch (error) {
        console.error('Error deleting database:', error);
        res.status(500).json({ error: 'Failed to delete database' });
    }
});

// Clean up empty databases
router.post('/databases/cleanup', async (req, res) => {
    try {
        const deletedDatabases = await databaseManager.cleanupEmptyDatabases();
        res.json({ 
            message: 'Cleanup completed',
            deletedDatabases,
            count: deletedDatabases.length
        });
    } catch (error) {
        console.error('Error cleaning up databases:', error);
        res.status(500).json({ error: 'Failed to cleanup databases' });
    }
});

// Get active connections
router.get('/connections', (req, res) => {
    try {
        const connections = databaseManager.getActiveConnections();
        res.json(connections);
    } catch (error) {
        console.error('Error getting connections:', error);
        res.status(500).json({ error: 'Failed to get connections' });
    }
});

// Close all connections
router.post('/connections/close', async (req, res) => {
    try {
        await databaseManager.closeAllConnections();
        res.json({ message: 'All connections closed successfully' });
    } catch (error) {
        console.error('Error closing connections:', error);
        res.status(500).json({ error: 'Failed to close connections' });
    }
});

module.exports = router; 