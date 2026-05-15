const chatbotService = require('../services/chatbotService');

// GET /api/chatbot/context
async function getContext(req, res, next) {
  try {
    const user = req.user;
    if (!user || !user.uuid) return res.status(400).json({ message: 'Missing user identifier' });

    const context = await chatbotService.buildContext(user);
    return res.json({ context });
  } catch (err) {
    next(err);
  }
}

// POST /api/chatbot/message
async function postMessage(req, res, next) {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'Message text required' });
    const user = req.user;
    const context = await chatbotService.buildContext(user).catch(() => null);
    const reply = chatbotService.generateReply(message, context, user && user.role);
    return res.json({ reply });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getContext,
  postMessage
};
