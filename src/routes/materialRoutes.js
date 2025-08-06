const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');
const { getMaterials, addMaterial, updateMaterial, deleteMaterial, checkMaterialExists, searchMaterial } = materialController;
const { authenticate, requireSiteAccess } = require('../middleware/auth');

// Apply authentication and site access middleware to all routes
router.use(authenticate);
router.use(requireSiteAccess);

router.get('/', getMaterials);
router.post('/', addMaterial);
router.put('/', updateMaterial);
router.delete('/:materialName', deleteMaterial);
router.get('/check/:materialName', checkMaterialExists);
router.get('/search/:materialName', searchMaterial);

module.exports = router;
