const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Existing chat endpoint
router.post('/', chatController.getBotResponse);

// New history endpoints
router.get('/history', chatController.getConversationHistory);
router.delete('/history', chatController.clearConversationHistory);

module.exports = router;