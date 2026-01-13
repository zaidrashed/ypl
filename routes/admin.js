/**
 * Admin Dashboard Routes
 * مسارات لوحة التحكم
 */

const express = require("express");
const router = express.Router();
const path = require("path");
const syncService = require("../services/sync-service");
const logger = require("../utils/logger");

/**
 * الصفحة الرئيسية
 */
router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/index.html"));
});

/**
 * صفحة لوحة التحكم الرئيسية
 */
router.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/dashboard.html"));
});

/**
 * صفحة الإعدادات
 */
router.get("/settings", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/settings.html"));
});

/**
 * صفحة سجل المزامنة
 */
router.get("/sync-history", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/sync-history.html"));
});

/**
 * API للحصول على إحصائيات المزامنة
 */
router.get("/api/stats", async (req, res) => {
  try {
    const stats = await syncService.getSyncStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error("Error getting stats", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * API لتشغيل المزامنة اليدوية
 */
router.post("/api/sync-now", async (req, res) => {
  try {
    logger.info("Manual sync started");

    const result = await syncService.syncPendingOrders({
      limit: req.body.limit || 50,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error("Error running manual sync", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
