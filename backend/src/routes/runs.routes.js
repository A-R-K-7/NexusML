const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');
const { createRun, getRuns, getRun, getRunStatus } = require('../controllers/runs.controller');

router.use(auth);

router.post('/', role('Owner', 'Contributor'), createRun);
router.get('/', getRuns);
router.get('/:id', getRun);
router.get('/:id/status', getRunStatus);

module.exports = router;
