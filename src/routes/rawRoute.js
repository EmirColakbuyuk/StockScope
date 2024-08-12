const express = require('express');
const router = express.Router();
const rawController = require('../controllers/rawController');
const auth = require('../middleware/auth');

router.post('/addRaw', auth, rawController.addRawMaterial);
router.delete('/deleteRaw/:id', auth,  rawController.deleteRawMaterial);
router.patch('/softDeleteRaw/:id', auth,  rawController.softDeleteRawMaterial);
router.patch('/softActiveRaw/:id', auth,  rawController.softActiveRawMaterial);
router.put('/update/:id', auth,  rawController.updateRawMaterial);
router.get('/allRaw', auth, rawController.getAllRawMaterials);
router.get('/allRawActive', auth, rawController.getAllActiveRawMaterials);
router.get('/allRawPassive', auth, rawController.getAllPassiveRawMaterials);
router.get('/allRawPaginated', auth, rawController.getAllRawMaterialPagination);
router.get('/allRawActivePaginated', auth, rawController.getAllActiveRawMaterialPagination);
router.get('/allRawPassivePaginated', auth, rawController.getAllPassiveRawMaterialPagination);
router.get('/byDate', auth, rawController.getRawMaterialsByDate);
router.get('/raw-materials/:name', auth, rawController.getDistinctValuesByName);
router.get('/getAllNames', auth, rawController.getAllNames);
router.get('/getAllTypes', auth, rawController.getAllTypes);
router.get('/filterActiveRawMaterials', auth, rawController.filterActiveRawMaterials);
router.get('/filterPassiveRawMaterials', auth, rawController.filterPassiveRawMaterials);
router.get('/filterRawMaterials', auth, rawController.filterRawMaterials);


module.exports = router;
