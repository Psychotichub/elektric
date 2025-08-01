const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');
const { getMaterials, addMaterial, updateMaterial, deleteMaterial, checkMaterialExists, searchMaterial } = materialController;

router.get('/', getMaterials);
router.post('/', addMaterial);
router.put('/', updateMaterial);
router.delete('/:materialName', deleteMaterial);
router.get('/check/:materialName', checkMaterialExists);
router.get('/search/:materialName', searchMaterial);

module.exports = router;
