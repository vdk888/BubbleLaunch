const session = require("express-session");

/**
 * Session middleware configuration
 */
const sessionMiddleware = session({
  secret:
    process.env.SESSION_SECRET ||
    "your-super-secret-key-that-should-be-in-env",
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }, // Set to true if using https
});

module.exports = sessionMiddleware;
