const express = require("express");
const env = require("./config/env");
const configureExpress = require("./config/express");
const routes = require("./routes");
const errorHandler = require("./middleware/error-handler");
const imageService = require("./services/imageService");
const cacheScheduler = require("./services/cacheScheduler");
const blogStatusScheduler = require("./services/blogStatusScheduler");

const app = express();
const port = env.PORT;

// Configure middleware
configureExpress(app);

// Mount all routes
app.use(routes);

// 404 handler - must be after all other routes
app.use((req, res) => {
  res.status(404).sendFile(require("path").join(__dirname, "../frontend/pages/404.html"));
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log("Server running at http://localhost:" + port);

  // Initialize cache scheduler (monthly regeneration on last Sunday at 2 AM UTC)
  cacheScheduler.initialize();

  // Initialize blog status sync (hourly Scheduled -> Published sweep)
  blogStatusScheduler.initialize();
});

// Graceful shutdown to save cache
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down gracefully...");
  imageService.savePersistentCache();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Shutting down gracefully...");
  imageService.savePersistentCache();
  process.exit(0);
});
