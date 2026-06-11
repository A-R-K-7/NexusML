const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');
const { deployModel, getDeployments, getDeployment, stopDeployment, testPrediction } = require('../controllers/deployments.controller');

router.use(auth);

router.post('/', role('Owner', 'Contributor'), deployModel);
router.get('/', getDeployments);
router.get('/:id', getDeployment);
router.put('/:id/stop', role('Owner', 'Contributor'), stopDeployment);
router.post('/:id/predict', testPrediction);

module.exports = router;
