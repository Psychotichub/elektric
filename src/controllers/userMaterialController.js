const Material = require('../models/material');

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
        console.error('Error getting materials:', error);
        res.status(500).json({ message: error.message });
    }
};

// Add a new material for the user's site (Admin only)
const addMaterial = async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'admin') {
        return res.status(403).json({ 
            message: 'Access denied. Only site administrators can add materials with pricing information.' 
        });
    }

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
        res.status(201).json(material);
    } catch (error) {
        console.error('Error adding material:', error);
        res.status(500).json({ message: error.message });
    }
};

// Check if a material exists for the user's site
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
        console.error('Error checking material existence:', error);
        res.status(500).json({ message: error.message });
    }
};

// Update a material for the user's site (Admin only)
const updateMaterial = async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'admin') {
        return res.status(403).json({ 
            message: 'Access denied. Only site administrators can update materials with pricing information.' 
        });
    }

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
            return res.status(404).json({ message: 'Material not found in this site.' });
        }
        
        res.json(material);
    } catch (error) {
        console.error('Error updating material:', error);
        res.status(500).json({ message: error.message });
    }
};

// Delete a material for the user's site (Admin only)
const deleteMaterial = async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'admin') {
        return res.status(403).json({ 
            message: 'Access denied. Only site administrators can delete materials.' 
        });
    }

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
        console.error('Error deleting material:', error);
        res.status(500).json({ message: error.message });
    }
};

// Search for a material by name in the user's site
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