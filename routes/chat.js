const express = require('express');
const axios = require('axios');
const authMiddleware = require('../middleware/authMiddleware');
const Message = require('../models/Message');

const router = express.Router();

// @route   GET /api/chat/history
// @desc    Get chat history for user
// @access  Private
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({ user: req.user.id }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/chat/message
// @desc    Send message and get AI response
// @access  Private
router.post('/message', authMiddleware, async (req, res) => {
  const { text, promptType } = req.body;

  try {
    // Save user message
    const userMessage = new Message({
      user: req.user.id,
      sender: 'user',
      text,
    });
    await userMessage.save();

    // Prepare Gemini API request payload
    let prompt = text;
    if (promptType) {
      if (promptType === 'summarize') {
        prompt = 'Summarize my day: ' + text;
      } else if (promptType === 'motivation') {
        prompt = 'Give me motivation for tomorrow: ' + text;
      } else if (promptType === 'improve') {
        prompt = 'What can I improve this week: ' + text;
      }
    }

    // Call Gemini API with correct endpoint and payload
    const geminiResponse = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + process.env.GEMINI_API_KEY,
      {
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    // Extract AI response text from parts array
    let aiText = 'Sorry, no response from AI.';
    const content = geminiResponse.data.candidates?.[0]?.content;
    if (content && content.parts && Array.isArray(content.parts)) {
      aiText = content.parts.map(part => part.text).join('');
    }

    // Save AI response
    const aiMessage = new Message({
      user: req.user.id,
      sender: 'ai',
      text: aiText,
    });
    await aiMessage.save();

    res.json({ aiText });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
