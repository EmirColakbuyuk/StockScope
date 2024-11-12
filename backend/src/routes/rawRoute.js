const express = require('express');
const router = express.Router();
const rawController = require('../controllers/rawController');
const auth = require('../middleware/auth');
const roleAccess = require('../middleware/roleAccess');
const loggerModule = require('../middleware/logger');

router.post('/addRaw', auth, loggerModule.logger, rawController.addRawMaterial);
router.delete('/deleteRaw/:id', auth, loggerModule.logger, rawController.deleteRawMaterial);
router.patch('/softDeleteRaw/:id', auth,loggerModule.logger, rawController.softDeleteRawMaterial);
router.patch('/softActiveRaw/:id', auth, loggerModule.logger, rawController.softActiveRawMaterial);
router.patch('/transferRaw/:id', auth, loggerModule.logger, rawController.TransferRawMaterial);
router.patch('/revertTransferRaw/:id', auth, loggerModule.logger, rawController.revertTransferRawMaterial);
router.put('/update/:id', auth, loggerModule.logger, rawController.updateRawMaterial);
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
router.get('/searchNotesAllRawMaterials', auth, rawController.searchNotesAllRawMaterials);
router.get('/searchNotesActiveRawMaterials', auth, rawController.searchNotesActiveRawMaterials);
router.get('/searchNotesPassiveRawMaterials', auth, rawController.searchNotesPassiveRawMaterials);
router.post('/checkRawMaterialExists', rawController.checkIfRawMaterialExists);
router.get('/rawActiveAnalysis', auth, rawController.getActiveRawDistribution); // Active raw material analysis
router.get('/rawPassiveAnalysis', auth, rawController.getPassiveRawDistribution); // Passive raw material analysis
router.get('/rawComparison', auth, rawController.getRawDistributionWithSalesRatio); // Raw material comparison analysis with sales ratio
router.get('/rawInOutAnalysis', auth, rawController.getRawMaterialInOutAnalysis);






module.exports = router;
