const { getSiteModels, getUserModels } = require('../models/siteUserModels');
const User = require('../models/user');

/**
 * Site Admin Controller
 * Manages site-specific administrative operations
 */
class SiteAdminController {
    
    /**
     * Get all sites with their information
     */
    async getAllSites(req, res) {
        try {
            // Get all unique site and company combinations from users
            const sites = await User.aggregate([
                {
                    $group: {
                        _id: { site: '$site', company: '$company' },
                        userCount: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        site: '$_id.site',
                        company: '$_id.company',
                        userCount: 1,
                        _id: 0
                    }
                }
            ]);
            
            res.json({
                success: true,
                message: 'Sites retrieved successfully',
                data: sites
            });
        } catch (error) {
            console.error('Error getting all sites:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving sites',
                error: error.message
            });
        }
    }

    /**
     * Get specific site information
     */
    async getSiteInfo(req, res) {
        try {
            const { site, company } = req.params;
            
            if (!site || !company) {
                return res.status(400).json({
                    success: false,
                    message: 'Site and company parameters are required'
                });
            }

            const siteModels = await getSiteModels(site, company);
            const siteConfig = await siteModels.SiteConfig.findOne({
                siteName: site,
                companyName: company
            });

            const siteUsers = await siteModels.SiteUser.find({ isActive: true });
            const siteMaterials = await siteModels.SiteMaterial.find({ isActive: true });

            res.json({
                success: true,
                message: 'Site information retrieved successfully',
                data: {
                    site,
                    company,
                    config: siteConfig,
                    users: siteUsers,
                    materials: siteMaterials
                }
            });
        } catch (error) {
            console.error('Error getting site info:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving site information',
                error: error.message
            });
        }
    }

    /**
     * Create a new site
     */
    async createSite(req, res) {
        try {
            const { siteName, companyName, adminUsername, adminPassword, adminEmail } = req.body;
            
            if (!siteName || !companyName || !adminUsername || !adminPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Site name, company name, admin username, and password are required'
                });
            }

            // Check if site already exists
            const existingSite = await User.findOne({
                site: siteName,
                company: companyName
            });

            if (existingSite) {
                return res.status(400).json({
                    success: false,
                    message: 'Site already exists'
                });
            }

            // Create a new admin user for the site
            const newAdmin = new User({
                username: adminUsername,
                password: adminPassword, // Note: This should be hashed in production
                email: adminEmail,
                role: 'admin',
                site: siteName,
                company: companyName,
                isActive: true
            });

            await newAdmin.save();

            res.json({
                success: true,
                message: 'Site created successfully',
                data: {
                    siteName,
                    companyName,
                    adminUsername,
                    adminEmail
                }
            });
        } catch (error) {
            console.error('Error creating site:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating site',
                error: error.message
            });
        }
    }

    /**
     * Get site users
     */
    async getSiteUsers(req, res) {
        try {
            const { site, company } = req.params;
            
            if (!site || !company) {
                return res.status(400).json({
                    success: false,
                    message: 'Site and company parameters are required'
                });
            }

            const siteModels = await getSiteModels(site, company);
            const users = await siteModels.SiteUser.find({ isActive: true }).select('-password');

            res.json({
                success: true,
                message: 'Site users retrieved successfully',
                data: users
            });
        } catch (error) {
            console.error('Error getting site users:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving site users',
                error: error.message
            });
        }
    }

    /**
     * Add user to site
     */
    async addSiteUser(req, res) {
        try {
            const { site, company } = req.params;
            const { username, password, email, role, permissions } = req.body;
            
            if (!site || !company || !username || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Site, company, username, and password are required'
                });
            }

            const siteModels = await getSiteModels(site, company);
            
            // Check if user already exists in site
            const existingUser = await siteModels.SiteUser.findOne({ username });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'User already exists in this site'
                });
            }

            // Create user in site
            const newSiteUser = await siteModels.SiteUser.create({
                username,
                password,
                email: email || '',
                role: role || 'user',
                permissions: permissions || ['read', 'write'],
                isActive: true
            });

            // Create user in main user database
            await User.create({
                username,
                password,
                site,
                company,
                role: role || 'user'
            });

            // Initialize user database
            const userModels = await getUserModels(username, site, company);
            await userModels.UserSettings.create({
                userId: username,
                preferences: {
                    defaultLocation: '',
                    defaultUnit: 'pcs',
                    notifications: true,
                    theme: 'light'
                }
            });

            res.json({
                success: true,
                message: 'User added to site successfully',
                data: {
                    username: newSiteUser.username,
                    role: newSiteUser.role,
                    isActive: newSiteUser.isActive
                }
            });
        } catch (error) {
            console.error('Error adding site user:', error);
            res.status(500).json({
                success: false,
                message: 'Error adding user to site',
                error: error.message
            });
        }
    }

    /**
     * Update site user
     */
    async updateSiteUser(req, res) {
        try {
            const { site, company, username } = req.params;
            const { email, role, permissions, isActive } = req.body;
            
            if (!site || !company || !username) {
                return res.status(400).json({
                    success: false,
                    message: 'Site, company, and username are required'
                });
            }

            const siteModels = await getSiteModels(site, company);
            
            const updateData = {};
            if (email !== undefined) updateData.email = email;
            if (role !== undefined) updateData.role = role;
            if (permissions !== undefined) updateData.permissions = permissions;
            if (isActive !== undefined) updateData.isActive = isActive;
            updateData.updatedAt = new Date();

            const updatedUser = await siteModels.SiteUser.findOneAndUpdate(
                { username },
                updateData,
                { new: true }
            ).select('-password');

            if (!updatedUser) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found in site'
                });
            }

            // Update user in main user database
            await User.findOneAndUpdate(
                { username, site, company },
                { role, updatedAt: new Date() }
            );

            res.json({
                success: true,
                message: 'User updated successfully',
                data: updatedUser
            });
        } catch (error) {
            console.error('Error updating site user:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating user',
                error: error.message
            });
        }
    }

    /**
     * Delete site user
     */
    async deleteSiteUser(req, res) {
        try {
            const { site, company, username } = req.params;
            
            if (!site || !company || !username) {
                return res.status(400).json({
                    success: false,
                    message: 'Site, company, and username are required'
                });
            }

            const siteModels = await getSiteModels(site, company);
            
            // Soft delete user (set isActive to false)
            const deletedUser = await siteModels.SiteUser.findOneAndUpdate(
                { username },
                { isActive: false, updatedAt: new Date() },
                { new: true }
            ).select('-password');

            if (!deletedUser) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found in site'
                });
            }

            res.json({
                success: true,
                message: 'User deactivated successfully',
                data: {
                    username: deletedUser.username,
                    isActive: deletedUser.isActive
                }
            });
        } catch (error) {
            console.error('Error deleting site user:', error);
            res.status(500).json({
                success: false,
                message: 'Error deleting user',
                error: error.message
            });
        }
    }

    /**
     * Get site materials
     */
    async getSiteMaterials(req, res) {
        try {
            const { site, company } = req.params;
            
            if (!site || !company) {
                return res.status(400).json({
                    success: false,
                    message: 'Site and company parameters are required'
                });
            }

            const siteModels = await getSiteModels(site, company);
            const materials = await siteModels.SiteMaterial.find({ isActive: true });

            res.json({
                success: true,
                message: 'Site materials retrieved successfully',
                data: materials
            });
        } catch (error) {
            console.error('Error getting site materials:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving site materials',
                error: error.message
            });
        }
    }

    /**
     * Add material to site
     */
    async addSiteMaterial(req, res) {
        try {
            const { site, company } = req.params;
            const { materialName, unit, materialPrice, laborPrice, category, supplier } = req.body;
            
            if (!site || !company || !materialName || !unit || !materialPrice || !laborPrice) {
                return res.status(400).json({
                    success: false,
                    message: 'Site, company, material name, unit, material price, and labor price are required'
                });
            }

            const siteModels = await getSiteModels(site, company);
            
            // Check if material already exists
            const existingMaterial = await siteModels.SiteMaterial.findOne({ 
                materialName,
                isActive: true 
            });
            
            if (existingMaterial) {
                return res.status(400).json({
                    success: false,
                    message: 'Material already exists in this site'
                });
            }

            const newMaterial = await siteModels.SiteMaterial.create({
                materialName,
                unit,
                materialPrice,
                laborPrice,
                category: category || 'General',
                supplier: supplier || '',
                isActive: true,
                createdBy: req.user?.username || 'admin'
            });

            res.json({
                success: true,
                message: 'Material added to site successfully',
                data: newMaterial
            });
        } catch (error) {
            console.error('Error adding site material:', error);
            res.status(500).json({
                success: false,
                message: 'Error adding material to site',
                error: error.message
            });
        }
    }

    /**
     * Update site material
     */
    async updateSiteMaterial(req, res) {
        try {
            const { site, company, materialId } = req.params;
            const { materialName, unit, materialPrice, laborPrice, category, supplier, isActive } = req.body;
            
            if (!site || !company || !materialId) {
                return res.status(400).json({
                    success: false,
                    message: 'Site, company, and material ID are required'
                });
            }

            const siteModels = await getSiteModels(site, company);
            
            const updateData = {};
            if (materialName !== undefined) updateData.materialName = materialName;
            if (unit !== undefined) updateData.unit = unit;
            if (materialPrice !== undefined) updateData.materialPrice = materialPrice;
            if (laborPrice !== undefined) updateData.laborPrice = laborPrice;
            if (category !== undefined) updateData.category = category;
            if (supplier !== undefined) updateData.supplier = supplier;
            if (isActive !== undefined) updateData.isActive = isActive;
            updateData.updatedAt = new Date();

            const updatedMaterial = await siteModels.SiteMaterial.findByIdAndUpdate(
                materialId,
                updateData,
                { new: true }
            );

            if (!updatedMaterial) {
                return res.status(404).json({
                    success: false,
                    message: 'Material not found in site'
                });
            }

            res.json({
                success: true,
                message: 'Material updated successfully',
                data: updatedMaterial
            });
        } catch (error) {
            console.error('Error updating site material:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating material',
                error: error.message
            });
        }
    }

    /**
     * Create site backup
     */
    async createSiteBackup(req, res) {
        try {
            const { site, company } = req.params;
            
            if (!site || !company) {
                return res.status(400).json({
                    success: false,
                    message: 'Site and company parameters are required'
                });
            }

            // For now, return a placeholder response since backup functionality is not implemented
            res.json({
                success: true,
                message: 'Site backup functionality not implemented',
                data: {
                    site,
                    company,
                    backupFile: null
                }
            });
        } catch (error) {
            console.error('Error creating site backup:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating site backup',
                error: error.message
            });
        }
    }

    /**
     * Get site statistics
     */
    async getSiteStats(req, res) {
        try {
            const { site, company } = req.params;
            
            if (!site || !company) {
                return res.status(400).json({
                    success: false,
                    message: 'Site and company parameters are required'
                });
            }

            const siteModels = await getSiteModels(site, company);
            
            // Get counts
            const userCount = await siteModels.SiteUser.countDocuments({ isActive: true });
            const materialCount = await siteModels.SiteMaterial.countDocuments({ isActive: true });
            const activityCount = await siteModels.SiteActivityLog.countDocuments();
            
            // Get recent activity
            const recentActivity = await siteModels.SiteActivityLog.find()
                .sort({ timestamp: -1 })
                .limit(10);

            res.json({
                success: true,
                message: 'Site statistics retrieved successfully',
                data: {
                    site,
                    company,
                    stats: {
                        users: userCount,
                        materials: materialCount,
                        activities: activityCount
                    },
                    recentActivity
                }
            });
        } catch (error) {
            console.error('Error getting site stats:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving site statistics',
                error: error.message
            });
        }
    }

    /**
     * Initialize all site databases
     */
    async initializeSiteDatabases(req, res) {
        try {
            // For now, return a placeholder response since initialization is not implemented
            res.json({
                success: true,
                message: 'Site databases initialization not implemented',
                data: { message: 'Database initialization not implemented' }
            });
        } catch (error) {
            console.error('Error initializing site databases:', error);
            res.status(500).json({
                success: false,
                message: 'Error initializing site databases',
                error: error.message
            });
        }
    }

    /**
     * Get active connections
     */
    async getActiveConnections(req, res) {
        try {
            // For now, return a placeholder response since connection tracking is not implemented
            res.json({
                success: true,
                message: 'Active connections tracking not implemented',
                data: { connections: [] }
            });
        } catch (error) {
            console.error('Error getting active connections:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving active connections',
                error: error.message
            });
        }
    }
}

module.exports = new SiteAdminController(); 