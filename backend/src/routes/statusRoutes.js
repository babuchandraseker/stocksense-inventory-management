const express = require('express');
const { getHealth, getStatus } = require('../controllers/statusController');

const router = express.Router();

router.get('/health', getHealth);
router.get('/status', getStatus);

module.exports = router;
