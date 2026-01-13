/**
 * Server Entry Point
 * تطبيق Shopify لمزامنة الطلبات مع Shipsy
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));
app.use(express.static(path.join(__dirname, "views")));

// Import services
const shopifyService = require("./services/shopify-service");
const shipsyService = require("./services/shipsy-service");
const webhookService = require("./services/webhook-service");

// Import Cron Jobs
const { startSyncCron } = require("./crons/sync-cron");
const { startStatusUpdateCron } = require("./crons/status-update-cron");

// Initialize services and crons
(async () => {
  try {
    console.log("Initializing Shopify Econnect App...");

    // Verify Shipsy connection
    const shipsyStatus = await shipsyService.verifyConnection();
    if (shipsyStatus) {
      console.log("✅ Connected to Shipsy API");
    }

    // Start scheduled cron jobs
    startSyncCron();
    startStatusUpdateCron();
    console.log("✅ Cron jobs started");
  } catch (error) {
    console.error("⚠️ Error initializing app:", error.message);
  }
})();

// Routes
app.use("/api", require("./routes/api"));
app.use("/api/webhooks", require("./routes/webhooks"));
app.use("/admin", require("./routes/admin"));

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    error: err.message || "Internal Server Error",
    timestamp: new Date().toISOString(),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Shipsy Econnect Shopify App listening on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `🛍️  Shopify Store: ${process.env.SHOPIFY_STORE || "Not configured"}`
  );
});

module.exports = app;
