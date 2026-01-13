/**
 * Sync Service
 * خدمة مزامنة الطلبات بين Shopify و Shipsy
 */

const shipsyService = require("./shipsy-service");
const shopifyService = require("./shopify-service");
const logger = require("../utils/logger");
const settings = require("../config/settings");

class SyncService {
  /**
   * مزامنة جميع الطلبات المعلقة
   */
  async syncPendingOrders(options = {}) {
    try {
      logger.info("Starting order sync...");

      // الحصول على الطلبات من Shopify
      const orders = await shopifyService.getAllOrders({
        status: "any",
        limit: options.limit || 50,
        created_at_min: options.createdAfter,
      });

      let synced = 0;
      let failed = 0;

      for (const order of orders) {
        try {
          // تخطي الطلبات المكتملة والملغاة
          if (
            order.financial_status === "refunded" ||
            order.fulfillment_status === "cancelled"
          ) {
            continue;
          }

          // تحويل وإرسال إلى Shipsy
          const result = await this.syncOrder(order);
          if (result.success) {
            synced++;
          }
        } catch (error) {
          logger.error("Error syncing order", {
            orderId: order.id,
            error: error.message,
          });
          failed++;
        }
      }

      logger.info("Order sync completed", {
        synced,
        failed,
        total: orders.length,
      });
      return { synced, failed, total: orders.length };
    } catch (error) {
      logger.error("Order sync failed", error);
      throw error;
    }
  }

  /**
   * مزامنة طلب واحد
   */
  async syncOrder(order) {
    try {
      // التحقق من عدم مزامنة الطلب مسبقاً
      if (order.note && order.note.includes("SHIPSY_ID:")) {
        logger.info("Order already synced", { orderId: order.id });
        return { success: false, reason: "already_synced" };
      }

      // إنشاء شحنة في Shipsy
      const consignment = await shipsyService.createConsignment(order);

      if (consignment.success) {
        // تحديث الطلب في Shopify بمعرف الشحنة
        const note = `SHIPSY_ID: ${
          consignment.consignmentId
        }\nCreated: ${new Date().toISOString()}`;
        await shopifyService.updateOrderNote(order.id, note);

        // إضافة tag
        await shopifyService.addOrderTag(order.id, "shipsy-synced");

        logger.info("Order synced successfully", {
          orderId: order.id,
          consignmentId: consignment.consignmentId,
        });

        return {
          success: true,
          orderId: order.id,
          consignmentId: consignment.consignmentId,
        };
      }
    } catch (error) {
      logger.error("Failed to sync order", {
        orderId: order.id,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * تحديث حالات الشحنات
   */
  async updateConsignmentStatuses() {
    try {
      logger.info("Starting consignment status update...");

      // الحصول على جميع الطلبات التي تم مزامنتها
      const orders = await shopifyService.getAllOrders({ limit: 100 });

      let updated = 0;
      let failed = 0;

      for (const order of orders) {
        try {
          // استخراج معرف الشحنة من ملاحظات الطلب
          const consignmentId = this.extractConsignmentId(order.note);

          if (!consignmentId) {
            continue;
          }

          // الحصول على حالة الشحنة من Shipsy
          const status = await shipsyService.getConsignmentStatus(
            consignmentId
          );

          if (status && status.current_status) {
            // تحديث حالة الطلب في Shopify
            await this.updateOrderFromShipmentStatus(order.id, status);
            updated++;
          }
        } catch (error) {
          logger.error("Error updating status", {
            orderId: order.id,
            error: error.message,
          });
          failed++;
        }
      }

      logger.info("Status update completed", { updated, failed });
      return { updated, failed };
    } catch (error) {
      logger.error("Status update failed", error);
      throw error;
    }
  }

  /**
   * استخراج معرف الشحنة من ملاحظات الطلب
   */
  extractConsignmentId(note) {
    if (!note) return null;

    const match = note.match(/SHIPSY_ID:\s*(\d+)/);
    return match ? match[1] : null;
  }

  /**
   * تحديث الطلب بناءً على حالة الشحنة
   */
  async updateOrderFromShipmentStatus(orderId, shipmentStatus) {
    const statusMapping =
      settings.shipmentStatuses[shipmentStatus.current_status];

    if (!statusMapping) {
      logger.warn("Unknown shipment status", {
        status: shipmentStatus.current_status,
      });
      return;
    }

    try {
      // تحديث حالة الطلب
      await shopifyService.updateOrderStatus(
        orderId,
        statusMapping.shopifyStatus
      );

      // إرسال إشعار إذا كانت الحالة تتطلب ذلك
      if (statusMapping.notify) {
        const message = `تحديث الشحنة: ${statusMapping.name}`;
        await shopifyService.sendOrderMessage(orderId, message);
      }

      logger.info("Order status updated", {
        orderId,
        newStatus: statusMapping.shopifyStatus,
      });
    } catch (error) {
      logger.error("Failed to update order status", {
        orderId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * الحصول على إحصائيات المزامنة
   */
  async getSyncStats() {
    try {
      const orders = await shopifyService.getAllOrders({ limit: 100 });

      const stats = {
        total: orders.length,
        synced: 0,
        notSynced: 0,
        pending: 0,
        completed: 0,
      };

      orders.forEach((order) => {
        if (order.note && order.note.includes("SHIPSY_ID:")) {
          stats.synced++;
        } else {
          stats.notSynced++;
        }

        if (
          order.fulfillment_status === "pending" ||
          order.fulfillment_status === "partial"
        ) {
          stats.pending++;
        } else if (order.fulfillment_status === "fulfilled") {
          stats.completed++;
        }
      });

      return stats;
    } catch (error) {
      logger.error("Failed to get sync stats", error);
      throw error;
    }
  }
}

module.exports = new SyncService();
