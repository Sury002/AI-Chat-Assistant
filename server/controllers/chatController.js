const axios = require('axios');
const Chat = require('../models/Chat');

exports.getBotResponse = async (req, res) => {
  try {
    const { message, userId } = req.body;

    // Call OpenRouter API
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-4o",
        messages: [{ role: "user", content: message }],
        max_tokens: 100,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const botReply = response.data.choices[0].message.content;

    // Save conversation to database
    const newChat = new Chat({
      userId,
      userMessage: message,
      botReply,
      timestamp: new Date()
    });
    await newChat.save();

    res.json({ 
      reply: botReply,
      id: newChat._id // Return the ID for frontend reference
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: "AI request failed" });
  }
};

// Get conversation history
exports.getConversationHistory = async (req, res) => {
  try {
    const { userId } = req.query;
    
    // Validate user ID
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Fetch history from database
    const history = await Chat.find({ userId }).sort({ timestamp: 1 });
    
    // Format messages for frontend
    const formattedMessages = history.flatMap(entry => [
      { 
        text: entry.userMessage, 
        isUser: true, 
        timestamp: entry.timestamp,
        id: entry._id + '_user'
      },
      { 
        text: entry.botReply, 
        isUser: false, 
        timestamp: new Date(entry.timestamp.getTime() + 1000),
        id: entry._id + '_bot'
      }
    ]);

    res.json(formattedMessages);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: "Failed to fetch history" });
  }
};

// Clear conversation history
exports.clearConversationHistory = async (req, res) => {
  try {
    const { userId } = req.body;
    
    // Validate user ID
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Delete all messages for this user
    await Chat.deleteMany({ userId });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error clearing history:', error);
    res.status(500).json({ error: "Failed to clear history" });
  }
};