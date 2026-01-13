/**
 * Webhook Service
 * معالج webhooks من Shopify
 */

const logger = require("../utils/logger");
const syncService = require("./sync-service");
const shopifyService = require("./shopify-service");
const shipsyService = require("./shipsy-service");

class WebhookService {
  /**
   * معالجة webhook عند إنشاء طلب جديد
   */
  async handleOrderCreated(order) {
    try {
      logger.info("Handling order created webhook", { orderId: order.id });

      // مزامنة الطلب تلقائياً إذا كانت المزامنة التلقائية مفعلة
      if (process.env.ENABLE_AUTO_SYNC !== "false") {
        await syncService.syncOrder(order);
      } else {
        logger.info("Auto sync is disabled, order not synced");
      }

      return { success: true };
    } catch (error) {
      logger.error("Error handling order created webhook", error);
      throw error;
    }
  }

  /**
   * معالجة webhook عند تحديث طلب
   */
  async handleOrderUpdated(order) {
    try {
      logger.info("Handling order updated webhook", { orderId: order.id });

      // التحقق من تغيير حالة الدفع
      if (order.financial_status === "paid") {
        // قد نريد إعادة مزامنة الطلب إذا لم يتم مزامنته
        const consignmentId = syncService.extractConsignmentId(order.note);

        if (!consignmentId && process.env.ENABLE_AUTO_SYNC !== "false") {
          await syncService.syncOrder(order);
        }
      }

      return { success: true };
    } catch (error) {
      logger.error("Error handling order updated webhook", error);
      throw error;
    }
  }

  /**
   * معالجة webhook عند حذف التطبيق
   */
  async handleAppUninstalled(shop) {
    try {
      logger.info("Handling app uninstalled webhook", { shop });

      // يمكن إضافة عمليات التنظيف هنا
      // مثل حذف البيانات المخزنة عن المتجر

      return { success: true };
    } catch (error) {
      logger.error("Error handling app uninstalled webhook", error);
      throw error;
    }
  }

  /**
   * التحقق من توقيع webhook
   */
  verifyWebhookSignature(req, secret) {
    const hmac = req.get("X-Shopify-Hmac-SHA256");
    const body = req.rawBody;

    if (!hmac || !body) {
      return false;
    }

    const crypto = require("crypto");
    const hash = crypto
      .createHmac("sha256", secret)
      .update(body, "utf8")
      .digest("base64");

    return hash === hmac;
  }
}

module.exports = new WebhookService();
