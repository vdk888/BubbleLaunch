const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);

// Validate SESSION_SECRET at startup - fail fast if missing
if (!process.env.SESSION_SECRET) {
  console.error("FATAL: SESSION_SECRET environment variable is required.");
  console.error("Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"");
  process.exit(1);
}

const isProduction = process.env.NODE_ENV === "production";

/**
 * Session middleware configuration
 * Security hardened: SQLite store (survives restarts), no fallback secret, secure cookies in production
 */
const sessionMiddleware = session({
  store: new SQLiteStore({
    dir: "./sessions",
    db: "sessions.db",
    concurrentDB: true, // Enable concurrent access
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false, // Don't create sessions for unauthenticated users
  name: "bubble.sid", // Custom name to avoid fingerprinting
  cookie: {
    secure: isProduction, // HTTPS only in production
    httpOnly: true, // Prevent JavaScript access to cookie
    sameSite: "strict", // CSRF protection
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
});

module.exports = sessionMiddleware;
