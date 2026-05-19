const express = require('express');
const router = express.Router();
const monitoringController = require('../controllers/monitoringController');
const verifyToken = require('../middleware/authMiddleware');

router.post('/monitoring', verifyToken, monitoringController.createLog);
router.get('/monitoring/:id', verifyToken, monitoringController.getLogsByAssessment);

module.exports = router;
