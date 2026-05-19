const express = require('express');
const router = express.Router();
const hospitalController = require('../controllers/hospitalController');
const verifyToken = require('../middleware/authMiddleware');

router.get('/hospitals/nearby', verifyToken, hospitalController.getNearbyHospitals);

module.exports = router;
