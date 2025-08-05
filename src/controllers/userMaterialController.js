// Updated to use compatibility middleware

// Get all materials for the current user's site
const getMaterials = async (req, res) => {
    try {
        // Get site models to access shared site materials
        const { getSiteModels } = require('../models/siteUserModels');
        const siteModels = await getSiteModels(req.user.site, req.user.company);
        const materials = await siteModels.SiteMaterial.find({ isActive: true });
        res.json(materials);
    } catch (error) {
        console.error('Error getting materials:', error);
        res.status(500).json({ message: error.message });
    }
};

// Add a new material for the current user's site (Admin only)
const addMaterial = async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'admin') {
        return res.status(403).json({ 
            message: 'Access denied. Only site administrators can add materials with pricing information.' 
        });
    }

    const { materialName, unit, materialPrice, laborPrice } = req.body;
    try {
        // Get site models to access shared site materials
        const { getSiteModels } = require('../models/siteUserModels');
        const siteModels = await getSiteModels(req.user.site, req.user.company);
        
        const existingMaterial = await siteModels.SiteMaterial.findOne({ materialName });
        if (existingMaterial) {
            return res.status(400).json({ message: 'Material already exists in this site.' });
        }

        // Get the current user's username for createdBy field
        const createdBy = req.user.username || req.user.id;

        const material = new siteModels.SiteMaterial({ 
            materialName, 
            unit, 
            materialPrice, 
            laborPrice,
            createdBy
        });
        await material.save();
        res.status(201).json(material);
    } catch (error) {
        console.error('Error adding material:', error);
        res.status(500).json({ message: error.message });
    }
};

// Check if a material exists for the current user's site
const checkMaterialExists = async (req, res) => {
    const { materialName } = req.params;
    try {
        // Get site models to access shared site materials
        const { getSiteModels } = require('../models/siteUserModels');
        const siteModels = await getSiteModels(req.user.site, req.user.company);
        const material = await siteModels.SiteMaterial.findOne({ materialName, isActive: true });
        res.json({ exists: !!material });
    } catch (error) {
        console.error('Error checking material existence:', error);
        res.status(500).json({ message: error.message });
    }
};

// Update a material for the current user's site (Admin only)
const updateMaterial = async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'admin') {
        return res.status(403).json({ 
            message: 'Access denied. Only site administrators can update materials with pricing information.' 
        });
    }

    const { originalMaterialName, materialName, unit, materialPrice, laborPrice } = req.body;
    try {
        // Get site models to access shared site materials
        const { getSiteModels } = require('../models/siteUserModels');
        const siteModels = await getSiteModels(req.user.site, req.user.company);
        
        // Check if the new material name already exists (excluding the current material)
        if (materialName !== originalMaterialName) {
            const existingMaterial = await siteModels.SiteMaterial.findOne({ materialName });
            if (existingMaterial) {
                return res.status(400).json({ message: 'Material name already exists in this site.' });
            }
        }

        const material = await siteModels.SiteMaterial.findOneAndUpdate(
            { materialName: originalMaterialName },
            { materialName, unit, materialPrice, laborPrice },
            { new: true }
        );
        
        if (!material) {
            return res.status(404).json({ message: 'Material not found in this site.' });
        }
        
        res.json(material);
    } catch (error) {
        console.error('Error updating material:', error);
        res.status(500).json({ message: error.message });
    }
};

// Delete a material for the current user's site (Admin only)
const deleteMaterial = async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'admin') {
        return res.status(403).json({ 
            message: 'Access denied. Only site administrators can delete materials.' 
        });
    }

    const { materialName } = req.params;
    try {
        // Get site models to access shared site materials
        const { getSiteModels } = require('../models/siteUserModels');
        const siteModels = await getSiteModels(req.user.site, req.user.company);
        await siteModels.SiteMaterial.findOneAndDelete({ materialName });
        res.status(200).json({ message: 'Material deleted successfully from site' });
    } catch (error) {
        console.error('Error deleting material:', error);
        res.status(500).json({ message: error.message });
    }
};

// Search for a material by name for the current user's site
const searchMaterial = async (req, res) => {
    const { materialName } = req.params;
    try {
        // Get site models to access shared site materials
        const { getSiteModels } = require('../models/siteUserModels');
        const siteModels = await getSiteModels(req.user.site, req.user.company);
        const material = await siteModels.SiteMaterial.findOne({ materialName, isActive: true });
        if (material) {
            res.json(material);
        } else {
            res.status(404).json({ message: 'Material not found in this site.' });
        }
    } catch (error) {
        console.error('Error searching material:', error);
        res.status(500).json({ message: error.message });
    }
};



module.exports = {
    getMaterials,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    checkMaterialExists,
    searchMaterial
}; 