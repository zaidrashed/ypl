/**
 * Webhook Routes
 * مسارات معالجة webhooks
 */

const express = require("express");
const router = express.Router();
const webhookService = require("../services/webhook-service");
const logger = require("../utils/logger");

/**
 * Middleware للتحقق من توقيع webhook
 */
const verifyWebhookSignature = (req, res, next) => {
  const isValid = webhookService.verifyWebhookSignature(
    req,
    process.env.SHOPIFY_API_SECRET
  );

  if (!isValid) {
    logger.warn("Invalid webhook signature");
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
};

/**
 * Middleware لقراءة الـ raw body
 */
const rawBodyMiddleware = express.raw({ type: "application/json" });

// Order Created Webhook
router.post(
  "/orders",
  rawBodyMiddleware,
  verifyWebhookSignature,
  async (req, res) => {
    try {
      const order = req.body;

      logger.info("Received order webhook", { orderId: order.id });

      const result = await webhookService.handleOrderCreated(order);

      res.status(200).json(result);
    } catch (error) {
      logger.error("Error processing order webhook", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Order Updated Webhook
router.post(
  "/orders/updated",
  rawBodyMiddleware,
  verifyWebhookSignature,
  async (req, res) => {
    try {
      const order = req.body;

      logger.info("Received order updated webhook", { orderId: order.id });

      const result = await webhookService.handleOrderUpdated(order);

      res.status(200).json(result);
    } catch (error) {
      logger.error("Error processing order updated webhook", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// App Uninstalled Webhook
router.post(
  "/app-uninstalled",
  rawBodyMiddleware,
  verifyWebhookSignature,
  async (req, res) => {
    try {
      const { shop } = req.query;

      logger.info("Received app uninstalled webhook", { shop });

      const result = await webhookService.handleAppUninstalled(shop);

      res.status(200).json(result);
    } catch (error) {
      logger.error("Error processing app uninstalled webhook", error);
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
