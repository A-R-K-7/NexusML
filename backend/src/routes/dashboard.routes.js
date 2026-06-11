const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const { getSummary, getRecentActivity, getMonitoringSnapshot, getGovernanceSummary } = require('../controllers/dashboard.controller');

router.use(auth);

router.get('/summary', getSummary);
router.get('/activity', getRecentActivity);
router.get('/monitoring', getMonitoringSnapshot);
router.get('/governance', getGovernanceSummary);

module.exports = router;
