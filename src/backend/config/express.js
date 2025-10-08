const express = require("express");
const path = require("path");
const sessionMiddleware = require("../middleware/session");

/**
 * Configure Express middleware
 * @param {express.Application} app - Express app instance
 */
function configureExpress(app) {
  // Body parser
  app.use(express.json());

  // Session middleware
  app.use(sessionMiddleware);

  // Serve static files (CSS, JS, images) but not index.html
  app.use(
    express.static(path.join(__dirname, "../../frontend"), {
      index: false, // This prevents express.static from serving index.html
    })
  );
}

module.exports = configureExpress;
