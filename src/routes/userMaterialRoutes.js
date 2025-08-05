const express = require('express');
const router = express.Router();

const { authenticateToken } = require('../middleware/auth');
const {
    getMaterials,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    checkMaterialExists,
    searchMaterial
} = require('../controllers/userMaterialController');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Material routes
router.get('/materials', getMaterials);
router.post('/materials', addMaterial);
router.put('/materials', updateMaterial);
router.delete('/materials/:materialName', deleteMaterial);
router.get('/materials/check/:materialName', checkMaterialExists);
router.get('/materials/search/:materialName', searchMaterial);



module.exports = router; 