const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const verifyToken = require('../middleware/authMiddleware');

router.get('/chat/history', verifyToken, chatController.getChatHistory);
router.post('/chat', verifyToken, chatController.sendMessage);

module.exports = router;
