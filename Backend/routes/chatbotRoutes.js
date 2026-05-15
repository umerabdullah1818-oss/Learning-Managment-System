const express = require('express');
const router = express.Router();
const chatbotController = require('../controller/chatbotController');
const verifyJWT = require('../middleware/verifyJWT');
const verifyRole = require('../middleware/verifyRole');

// All routes require authentication (role-specific behavior handled in controller)
router.get('/context', verifyJWT, chatbotController.getContext);
router.post('/message', verifyJWT, chatbotController.postMessage);

module.exports = router;
