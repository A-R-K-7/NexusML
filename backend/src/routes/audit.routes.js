const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const { getAuditLogs } = require('../controllers/audit.controller');

router.use(auth);
router.get('/', getAuditLogs);

module.exports = router;
