const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const verifyToken = require('../middleware/authMiddleware');

router.get('/profile', verifyToken, patientController.getProfile);
router.put('/profile', verifyToken, patientController.updateProfile);

module.exports = router;
