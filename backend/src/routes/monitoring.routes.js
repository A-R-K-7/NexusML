const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const { getMonitoringSummary, getTimeSeries, getOverview, logMetric } = require('../controllers/monitoring.controller');

router.use(auth);

router.get('/overview', getOverview);
router.get('/:deploymentId', getMonitoringSummary);
router.get('/:deploymentId/timeseries', getTimeSeries);
router.post('/log', logMetric);

module.exports = router;
