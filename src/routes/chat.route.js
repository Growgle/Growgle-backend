const express = require('express');
const router = express.Router();
const { tokenValidator } = require('../middlewares/auth/tokenValidation');
const {
    getChatSessions,
    getChatSession,
    createChatSession,
    updateChatSession,
    deleteChatSession,
} = require('../controllers/chat.controller');

// All routes require authentication
router.use(tokenValidator);

// GET /api/chats - List all chat sessions for the user
router.get('/', getChatSessions);

// GET /api/chats/:id - Get a specific chat session
router.get('/:id', getChatSession);

// POST /api/chats - Create a new chat session
router.post('/', createChatSession);

// PUT /api/chats/:id - Update a chat session
router.put('/:id', updateChatSession);

// DELETE /api/chats/:id - Delete a chat session
router.delete('/:id', deleteChatSession);

module.exports = router;
