const express = require('express');
const router = express.Router();
const rawController = require('../controllers/rawController');
const auth = require('../middleware/auth');

router.post('/addRaw', auth, rawController.addRawMaterial);
router.delete('/deleteRaw/:id', auth,  rawController.deleteRawMaterial);
router.put('/update/:id', auth,  rawController.updateRawMaterial);
router.get('/allRaw', auth, rawController.getAllRawMaterials);
router.get('/byDate', auth, rawController.getRawMaterialsByDate);
router.get('/allRawNoPagination', auth, rawController.getAllRawMaterialsNoPagination); // Limitsiz

module.exports = router;
