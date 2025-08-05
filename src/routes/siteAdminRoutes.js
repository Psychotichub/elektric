const express = require('express');
const router = express.Router();
const siteAdminController = require('../controllers/siteAdminController');
const { authenticate } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all sites
router.get('/sites', siteAdminController.getAllSites);

// Get specific site information
router.get('/sites/:site/:company', siteAdminController.getSiteInfo);

// Create new site
router.post('/sites', siteAdminController.createSite);

// Get site users
router.get('/sites/:site/:company/users', siteAdminController.getSiteUsers);

// Add user to site
router.post('/sites/:site/:company/users', siteAdminController.addSiteUser);

// Update site user
router.put('/sites/:site/:company/users/:username', siteAdminController.updateSiteUser);

// Delete site user
router.delete('/sites/:site/:company/users/:username', siteAdminController.deleteSiteUser);

// Get site materials
router.get('/sites/:site/:company/materials', siteAdminController.getSiteMaterials);

// Add material to site
router.post('/sites/:site/:company/materials', siteAdminController.addSiteMaterial);

// Update site material
router.put('/sites/:site/:company/materials/:materialId', siteAdminController.updateSiteMaterial);

// Create site backup
router.post('/sites/:site/:company/backup', siteAdminController.createSiteBackup);

// Get site statistics
router.get('/sites/:site/:company/stats', siteAdminController.getSiteStats);

// Initialize all site databases
router.post('/initialize', siteAdminController.initializeSiteDatabases);

// Get active connections
router.get('/connections', siteAdminController.getActiveConnections);

module.exports = router; 