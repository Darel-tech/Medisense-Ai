const express = require('express');
const router = express.Router();
const assessmentController = require('../controllers/assessmentController');
const verifyToken = require('../middleware/authMiddleware');

// Public reference endpoints
router.get('/symptoms/categories', assessmentController.getCategories);
router.get('/symptoms', assessmentController.getSymptoms);
router.get('/diseases', assessmentController.getDiseases);

// Protected screening endpoints
router.post('/assessments', verifyToken, assessmentController.createAssessment);
router.get('/assessments', verifyToken, assessmentController.getPatientAssessments);
router.get('/assessments/:id', verifyToken, assessmentController.getAssessmentById);

module.exports = router;
