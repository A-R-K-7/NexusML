const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');
const { registerModel, getModels, getModel, updateModel, getModelLineage } = require('../controllers/models.controller');

router.use(auth);

router.post('/register', role('Owner', 'Contributor'), registerModel);
router.get('/', getModels);
router.get('/:id', getModel);
router.get('/:id/lineage', getModelLineage);
router.put('/:id', role('Owner', 'Contributor'), updateModel);

module.exports = router;
