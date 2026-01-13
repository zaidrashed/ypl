/**
 * Updated Server Entry Point
 * نقطة دخول الخادم مع دعم OAuth متعدد المتاجر
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Import Database
const db = require("./database/connection");

// Import Middleware
const {
  shopAuthMiddleware,
  apiKeyMiddleware,
  requestLoggerMiddleware,
  errorHandlerMiddleware,
} = require("./middleware/auth-middleware");

// Import Services
const shopifyService = require("./services/shopify-service");
const shipsyService = require("./services/shipsy-service");
const webhookService = require("./services/webhook-service");

// Import Routes
const authRoutes = require("./routes/auth");
const apiRoutes = require("./routes/api");
const webhookRoutes = require("./routes/webhooks");

// Import Cron Jobs
const { startSyncCron } = require("./crons/sync-cron");
const { startStatusUpdateCron } = require("./crons/status-update-cron");

// Global Middleware
app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));
app.use(express.static(path.join(__dirname, "views")));
app.use(requestLoggerMiddleware);

// Public Routes (بدون تفويض)
app.use("/api/auth", authRoutes);

// Webhook Routes (بدون تفويض - محمية بتوقيع Shopify)
app.use("/api/webhooks", webhookRoutes);

// Protected Routes (تحتاج تفويض)
app.use("/api/", shopAuthMiddleware, apiRoutes);

// Health Check
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Dashboard (مثال بسيط)
app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "dashboard.html"));
});

// Error Handler
app.use(errorHandlerMiddleware);

// Initialize Application
(async () => {
  try {
    console.log("🚀 Initializing Shipsy Econnect Multi-Store App...");

    // Initialize Database Tables
    await db.initializeTables();
    console.log("✅ Database initialized");

    // Verify Shipsy Connection
    const shipsyStatus = await shipsyService.verifyConnection();
    if (shipsyStatus) {
      console.log("✅ Connected to Shipsy API");
    }

    // Start Cron Jobs
    startSyncCron();
    startStatusUpdateCron();
    console.log("✅ Cron jobs started");

    // Start Server
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════╗
║   Shipsy Econnect Multi-Store App          ║
║   Version: 2.0.0                          ║
╠════════════════════════════════════════════╣
║   Server running on port: ${PORT}              ║
║   Environment: ${process.env.NODE_ENV || "development"}         ║
║   OAuth: Enabled (Multi-Store)            ║
║   Database: PostgreSQL                    ║
╚════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error("❌ Fatal error during initialization:", error);
    process.exit(1);
  }
})();

// Handle Graceful Shutdown
process.on("SIGINT", async () => {
  console.log("\n⛔ Shutting down gracefully...");
  try {
    await db.getPool().end();
    console.log("✅ Database connection closed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during shutdown:", error);
    process.exit(1);
  }
});

module.exports = app;
