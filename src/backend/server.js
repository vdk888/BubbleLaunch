const express = require("express");
const env = require("./config/env");
const configureExpress = require("./config/express");
const routes = require("./routes");
const errorHandler = require("./middleware/error-handler");
const freepikService = require("./services/freepikService");

const app = express();
const port = env.PORT;

// Configure middleware
configureExpress(app);

// Mount all routes
app.use(routes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log("Server running at http://localhost:" + port);
});

// Graceful shutdown to save cache
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down gracefully...");
  freepikService.savePersistentCache();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Shutting down gracefully...");
  freepikService.savePersistentCache();
  process.exit(0);
});
