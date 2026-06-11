const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');
const { uploadDataset, getDatasets, getDataset } = require('../controllers/datasets.controller');

router.use(auth);

router.post('/upload', role('Owner', 'Contributor'), uploadDataset);
router.get('/', getDatasets);
router.get('/:id', getDataset);

module.exports = router;
