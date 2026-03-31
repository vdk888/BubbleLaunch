/**
 * Rate limiting middleware for chat endpoint
 * Limits users to a reasonable number of messages per session.
 * Education pages need longer sessions for testing, so raise the cap.
 */
const chatRateLimiter = (req, res, next) => {
  if (!req.session) {
    console.warn('[rate-limiter] Session not available, skipping rate limit');
    return next();
  }

  if (!req.session.messageCount) {
    req.session.messageCount = 0;
  }

  const MAX_MESSAGES = 100; // Increased to support education flows and QA

  if (req.session.messageCount >= MAX_MESSAGES) {
    return res.status(429).json({ error: "Message limit reached" });
  }

  req.session.messageCount++;
  next();
};

module.exports = chatRateLimiter;
