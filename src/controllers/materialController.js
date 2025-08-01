const Material = require('../models/material');

// Get all materials
const getMaterials = async (req, res) => {
    try {
        const materials = await Material.find();
        res.json(materials);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Add a new material
const addMaterial = async (req, res) => {
    const { materialName, unit, materialPrice, laborPrice } = req.body;
    try {
        const existingMaterial = await Material.findOne({ materialName });
        if (existingMaterial) {
            return res.status(400).json({ message: 'Material already exists.' });
        }

        const material = new Material({ materialName, unit, materialPrice, laborPrice });
        await material.save();
        res.status(201).json(material);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Check if a material exists
const checkMaterialExists = async (req, res) => {
    const { materialName } = req.params;
    try {
        const material = await Material.findOne({ materialName });
        res.json({ exists: !!material });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a material
const updateMaterial = async (req, res) => {
    const { originalMaterialName, materialName, unit, materialPrice, laborPrice } = req.body;
    try {
        // Check if the new material name already exists (excluding the current material)
        if (materialName !== originalMaterialName) {
            const existingMaterial = await Material.findOne({ materialName });
            if (existingMaterial) {
                return res.status(400).json({ message: 'Material name already exists.' });
            }
        }

        const material = await Material.findOneAndUpdate(
            { materialName: originalMaterialName },
            { materialName, unit, materialPrice, laborPrice },
            { new: true }
        );
        
        if (!material) {
            return res.status(404).json({ message: 'Material not found.' });
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
        await Material.findOneAndDelete({ materialName });
        res.status(200).json({ message: 'Material deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Search for a material by name
const searchMaterial = async (req, res) => {
    const { materialName } = req.params;
    try {
        const material = await Material.findOne({ materialName });
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
