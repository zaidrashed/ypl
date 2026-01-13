/**
 * Order Controller
 * متحكم الطلبات
 */

const syncService = require("../services/sync-service");
const shopifyService = require("../services/shopify-service");
const shipsyService = require("../services/shipsy-service");
const logger = require("../utils/logger");

class OrderController {
  /**
   * الحصول على جميع الطلبات
   */
  async getAllOrders(req, res) {
    try {
      const filters = {
        status: req.query.status || "any",
        limit: parseInt(req.query.limit) || 50,
        createdAfter: req.query.created_after,
      };

      const orders = await shopifyService.getAllOrders(filters);

      res.json({
        success: true,
        data: orders,
        count: orders.length,
      });
    } catch (error) {
      logger.error("Error getting orders", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * الحصول على طلب محدد
   */
  async getOrder(req, res) {
    try {
      const { orderId } = req.params;
      const order = await shopifyService.getOrder(orderId);

      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      logger.error("Error getting order", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * مزامنة طلب واحد
   */
  async syncOrder(req, res) {
    try {
      const { orderId } = req.params;
      const order = await shopifyService.getOrder(orderId);

      const result = await syncService.syncOrder(order);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error("Error syncing order", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * مزامنة جميع الطلبات
   */
  async syncAllOrders(req, res) {
    try {
      const options = {
        limit: req.body.limit || 50,
        createdAfter: req.body.created_after,
      };

      const result = await syncService.syncPendingOrders(options);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error("Error syncing orders", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * تحميل بطاقة الشحن
   */
  async downloadLabel(req, res) {
    try {
      const { orderId } = req.params;
      const order = await shopifyService.getOrder(orderId);

      const consignmentId = syncService.extractConsignmentId(order.note);
      if (!consignmentId) {
        return res.status(400).json({
          success: false,
          error: "الشحنة لم تتم مزامنتها بعد",
        });
      }

      const labelData = await shipsyService.downloadLabel(consignmentId);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="label-${consignmentId}.pdf"`
      );
      res.send(labelData);
    } catch (error) {
      logger.error("Error downloading label", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * الحصول على حالة الشحنة
   */
  async getShipmentStatus(req, res) {
    try {
      const { orderId } = req.params;
      const order = await shopifyService.getOrder(orderId);

      const consignmentId = syncService.extractConsignmentId(order.note);
      if (!consignmentId) {
        return res.status(400).json({
          success: false,
          error: "الشحنة لم تتم مزامنتها بعد",
        });
      }

      const status = await shipsyService.getConsignmentStatus(consignmentId);

      res.json({
        success: true,
        data: {
          orderId,
          consignmentId,
          status,
        },
      });
    } catch (error) {
      logger.error("Error getting shipment status", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * إلغاء شحنة
   */
  async cancelShipment(req, res) {
    try {
      const { orderId } = req.params;
      const order = await shopifyService.getOrder(orderId);

      const consignmentId = syncService.extractConsignmentId(order.note);
      if (!consignmentId) {
        return res.status(400).json({
          success: false,
          error: "الشحنة لم تتم مزامنتها بعد",
        });
      }

      await shipsyService.cancelConsignment(consignmentId);

      res.json({
        success: true,
        message: "تم إلغاء الشحنة بنجاح",
      });
    } catch (error) {
      logger.error("Error cancelling shipment", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = new OrderController();
