const Material = require('../models/material');
const { getSiteModels } = require('../models/siteDatabase');

// Get all materials for the user's site
const getMaterials = async (req, res) => {
    try {
        // Filter by user's site and company (ALL users including admins)
        const filter = {
            site: req.user.site,
            company: req.user.company
        };
        
        const materials = await Material.find(filter);
        res.json(materials);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Add a new material
const addMaterial = async (req, res) => {
    const { materialName, unit, materialPrice, laborPrice } = req.body;
    try {
        // Check if material exists in the same site
        const existingMaterial = await Material.findOne({ 
            materialName, 
            site: req.user.site, 
            company: req.user.company 
        });
        
        if (existingMaterial) {
            return res.status(400).json({ message: 'Material already exists in this site.' });
        }

        const material = new Material({ 
            materialName, 
            unit, 
            materialPrice, 
            laborPrice,
            site: req.user.site,
            company: req.user.company
        });
        await material.save();

        // Also ensure site-scoped database has this material with pricing
        try {
            const siteModels = await getSiteModels(req.user.site, req.user.company);
            // Upsert into SiteMaterial (createdBy is required in site schema)
            await siteModels.SiteMaterial.findOneAndUpdate(
                { materialName },
                { materialName, unit, materialPrice, laborPrice, createdBy: req.user.username || 'system' },
                { upsert: true, new: true }
            );
        } catch (e) {
            // Do not block the main response on site mirror errors
            console.error('Failed to mirror material to site database:', e.message);
        }

        res.status(201).json(material);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Check if a material exists
const checkMaterialExists = async (req, res) => {
    const { materialName } = req.params;
    try {
        // Check if material exists in the user's site
        const filter = { 
            materialName,
            site: req.user.site,
            company: req.user.company
        };
        
        const material = await Material.findOne(filter);
        res.json({ exists: !!material });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a material
const updateMaterial = async (req, res) => {
    const { originalMaterialName, materialName, unit, materialPrice, laborPrice } = req.body;
    try {
        // Build filter to ensure user can only update their own site's materials
        const filter = { 
            materialName: originalMaterialName,
            site: req.user.site,
            company: req.user.company
        };

        // Check if the new material name already exists in the same site
        if (materialName !== originalMaterialName) {
            const existingMaterial = await Material.findOne({ 
                materialName, 
                site: req.user.site, 
                company: req.user.company 
            });
            if (existingMaterial) {
                return res.status(400).json({ message: 'Material name already exists in this site.' });
            }
        }

        const material = await Material.findOneAndUpdate(
            filter,
            { materialName, unit, materialPrice, laborPrice },
            { new: true }
        );
        
        if (!material) {
            return res.status(404).json({ message: 'Material not found.' });
        }

        // Mirror update to site-scoped database
        try {
            const siteModels = await getSiteModels(req.user.site, req.user.company);
            const existing = await siteModels.SiteMaterial.findOne({ materialName: originalMaterialName });
            const updateData = { materialName, unit, materialPrice, laborPrice };
            if (existing && (!existing.createdBy || existing.createdBy === '')) {
                updateData.createdBy = req.user.username || existing.createdBy;
            }
            await siteModels.SiteMaterial.findOneAndUpdate(
                { materialName: originalMaterialName },
                updateData,
                { new: true }
            );
        } catch (e) {
            console.error('Failed to update site material pricing:', e.message);
        }

        res.json(material);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete a material
const deleteMaterial = async (req, res) => {
    const { materialName } = req.params;
    try {
        // Build filter to ensure user can only delete their own site's materials
        const filter = { 
            materialName,
            site: req.user.site,
            company: req.user.company
        };
        
        await Material.findOneAndDelete(filter);
        res.status(200).json({ message: 'Material deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Search for a material by name
const searchMaterial = async (req, res) => {
    const { materialName } = req.params;
    try {
        // Build filter to include user's site
        const filter = { 
            materialName,
            site: req.user.site,
            company: req.user.company
        };
        
        const material = await Material.findOne(filter);
        if (material) {
            res.json(material);
        } else {
            res.status(404).json({ message: 'Material not found.' });
        }
    } catch (error) {
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
