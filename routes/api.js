/**
 * Main API Routes
 * مسارات API الرئيسية
 */

const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order-controller");
const settingsController = require("../controllers/settings-controller");
const syncLogController = require("../controllers/sync-log-controller");

// Order Routes
router.get("/orders", orderController.getAllOrders.bind(orderController));
router.get("/orders/:orderId", orderController.getOrder.bind(orderController));
router.post(
  "/orders/:orderId/sync",
  orderController.syncOrder.bind(orderController)
);
router.post(
  "/orders/sync-all",
  orderController.syncAllOrders.bind(orderController)
);
router.get(
  "/orders/:orderId/label",
  orderController.downloadLabel.bind(orderController)
);
router.get(
  "/orders/:orderId/status",
  orderController.getShipmentStatus.bind(orderController)
);
router.post(
  "/orders/:orderId/cancel",
  orderController.cancelShipment.bind(orderController)
);

// Settings Routes
router.get(
  "/settings",
  settingsController.getSettings.bind(settingsController)
);
router.put(
  "/settings",
  settingsController.updateSettings.bind(settingsController)
);
router.post(
  "/settings/test-connection",
  settingsController.testConnection.bind(settingsController)
);
router.get(
  "/settings/service-types",
  settingsController.getServiceTypes.bind(settingsController)
);
router.get(
  "/settings/pickup-points",
  settingsController.getPickupPoints.bind(settingsController)
);

// Sync Logs Routes
router.get("/logs", syncLogController.getLogs.bind(syncLogController));
router.get("/logs/stats", syncLogController.getStats.bind(syncLogController));
router.post(
  "/logs/clear-old",
  syncLogController.clearOldLogs.bind(syncLogController)
);
router.post(
  "/logs/clear-all",
  syncLogController.clearAllLogs.bind(syncLogController)
);

module.exports = router;
