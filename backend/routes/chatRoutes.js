import express from 'express';
import { authMiddleware, roleMiddleware } from '../middleware/index.js';
import chatService from '../services/chat.service.js';
import aiChatService from '../services/aiChat.service.js';
import { uploadChatFile } from '../middleware/uploadChat.middleware.js';

const router = express.Router();

// Chat is restricted to caregiver and expert roles only
router.use(authMiddleware);
router.use(roleMiddleware('caregiver', 'expert'));

// ─────────────────────────────────────────
// IMPORTANT: Specific routes must come BEFORE parameterized routes
// ─────────────────────────────────────────

// @route   GET /api/chat/contacts
// @desc    Get role-aware list of contacts with last message + unread count
// @access  Private
router.get('/contacts', async (req, res) => {
  try {
    const contacts = await chatService.getContacts(req.user._id, req.user.role);
    res.json({ success: true, data: contacts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/chat/upload
// @desc    Upload a file for chat (image / PDF / doc)
// @access  Private
router.post('/upload', (req, res) => {
  uploadChatFile(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const fileUrl = `/uploads/chat/${req.file.filename}`;
    const isImage = req.file.mimetype.startsWith('image/');

    res.json({
      success: true,
      data: {
        fileUrl,
        fileName: req.file.originalname,
        type: isImage ? 'image' : 'file',
      },
    });
  });
});

// @route   POST /api/chat/ai
// @desc    Send a message to AutiSmart AI and get a response
// @access  Private
router.post('/ai', async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }
    const reply = await aiChatService.chat(message.trim(), history);
    res.json({ success: true, data: { reply } });
  } catch (error) {
    console.error('[ChatRoute] AI error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/chat/:contactId/messages
// @desc    Get paginated message history with a specific user
// @access  Private
router.get('/:contactId/messages', async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const messages = await chatService.getConversation(
      req.user._id,
      req.params.contactId,
      parseInt(page, 10)
    );
    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/chat/:contactId/message
// @desc    Send a message via REST (fallback if socket unavailable)
// @access  Private
router.post('/:contactId/message', async (req, res) => {
  try {
    const { content, type = 'text', fileUrl, fileName } = req.body;
    const message = await chatService.saveMessage({
      senderId: req.user._id,
      receiverId: req.params.contactId,
      content: content || '',
      type,
      fileUrl,
      fileName,
    });

    // Emit to recipient via Socket.IO if available
    const io = req.app.get('io');
    if (io) {
      io.to(req.params.contactId.toString()).emit('receive_message', message);
    }

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PATCH /api/chat/:contactId/read
// @desc    Mark all messages from contactId to current user as read
// @access  Private
router.patch('/:contactId/read', async (req, res) => {
  try {
    await chatService.markAsRead(req.params.contactId, req.user._id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
