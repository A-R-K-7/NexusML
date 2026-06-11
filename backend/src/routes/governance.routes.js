const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const { createRiskProfile, getRiskProfile, getChecklist, updateChecklistItem } = require('../controllers/governance.controller');

router.use(auth);

router.post('/risk', createRiskProfile);
router.get('/risk/:modelId', getRiskProfile);
router.get('/checklist/:modelId', getChecklist);
router.put('/checklist/:itemId', updateChecklistItem);

module.exports = router;
