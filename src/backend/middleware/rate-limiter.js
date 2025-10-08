/**
 * Rate limiting middleware for chat endpoint
 * Limits users to 10 messages per session
 */
const chatRateLimiter = (req, res, next) => {
  if (!req.session.messageCount) {
    req.session.messageCount = 0;
  }

  if (req.session.messageCount >= 10) {
    return res.status(429).json({ error: "Message limit reached" });
  }

  req.session.messageCount++;
  next();
};

module.exports = chatRateLimiter;
