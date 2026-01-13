/**
 * Shopify API Service
 * خدمة التكامل مع Shopify API
 */

const axios = require("axios");
const logger = require("../utils/logger");
const settings = require("../config/settings");

class ShopifyService {
  constructor() {
    this.store = settings.shopify.store;
    this.accessToken = settings.shopify.accessToken;
    this.apiVersion = settings.shopify.apiVersion;

    this.client = axios.create({
      baseURL: `https://${this.store}/admin/api/${this.apiVersion}`,
      headers: {
        "X-Shopify-Access-Token": this.accessToken,
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * الحصول على جميع الطلبات
   */
  async getAllOrders(filters = {}) {
    try {
      const params = {
        limit: filters.limit || 50,
        status: filters.status || "any",
        ...filters,
      };

      const response = await this.client.get("/orders.json", { params });
      return response.data.orders;
    } catch (error) {
      logger.error("Failed to get orders", error);
      throw error;
    }
  }

  /**
   * الحصول على طلب محدد
   */
  async getOrder(orderId) {
    try {
      const response = await this.client.get(`/orders/${orderId}.json`);
      return response.data.order;
    } catch (error) {
      logger.error("Failed to get order", { orderId, error: error.message });
      throw error;
    }
  }

  /**
   * تحديث ملاحظات الطلب (إضافة معرف الشحنة)
   */
  async updateOrderNote(orderId, note) {
    try {
      const response = await this.client.put(`/orders/${orderId}.json`, {
        order: {
          id: orderId,
          note: note,
        },
      });
      return response.data.order;
    } catch (error) {
      logger.error("Failed to update order note", {
        orderId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * إضافة tag للطلب
   */
  async addOrderTag(orderId, tag) {
    try {
      const order = await this.getOrder(orderId);
      const tags = order.tags ? order.tags.split(", ") : [];

      if (!tags.includes(tag)) {
        tags.push(tag);
      }

      const response = await this.client.put(`/orders/${orderId}.json`, {
        order: {
          id: orderId,
          tags: tags.join(", "),
        },
      });
      return response.data.order;
    } catch (error) {
      logger.error("Failed to add order tag", {
        orderId,
        tag,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * إنشاء تنفيذ (Fulfillment) - تغيير حالة الطلب
   */
  async createFulfillment(orderId, lineItemIds, trackingInfo = {}) {
    try {
      const fulfillmentPayload = {
        fulfillment: {
          line_items_by_fulfillment_order: [
            {
              fulfillment_order_line_items: lineItemIds.map((id) => ({ id })),
            },
          ],
        },
      };

      if (trackingInfo.number || trackingInfo.company) {
        fulfillmentPayload.fulfillment.tracking_info = {
          number: trackingInfo.number || "",
          company: trackingInfo.company || "OTHER",
          url: trackingInfo.url || "",
        };
      }

      const response = await this.client.post(
        `/orders/${orderId}/fulfillments.json`,
        fulfillmentPayload
      );

      logger.info("Fulfillment created", { orderId });
      return response.data.fulfillment;
    } catch (error) {
      logger.error("Failed to create fulfillment", {
        orderId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * تحديث حالة الطلب
   */
  async updateOrderStatus(orderId, status) {
    try {
      const response = await this.client.put(`/orders/${orderId}.json`, {
        order: {
          id: orderId,
          financial_status: status,
        },
      });
      return response.data.order;
    } catch (error) {
      logger.error("Failed to update order status", {
        orderId,
        status,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * إرسال رسالة للعميل
   */
  async sendOrderMessage(orderId, message) {
    try {
      const response = await this.client.post(
        `/orders/${orderId}/fulfillment_orders.json`,
        {
          fulfillment_orders: {
            id: orderId,
            note: message,
          },
        }
      );
      logger.info("Order message sent", { orderId });
      return response.data;
    } catch (error) {
      logger.error("Failed to send order message", {
        orderId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * الحصول على بيانات متجر
   */
  async getShopInfo() {
    try {
      const response = await this.client.get("/shop.json");
      return response.data.shop;
    } catch (error) {
      logger.error("Failed to get shop info", error);
      throw error;
    }
  }

  /**
   * الحصول على جميع المنتجات
   */
  async getProducts(filters = {}) {
    try {
      const params = {
        limit: filters.limit || 50,
        ...filters,
      };

      const response = await this.client.get("/products.json", { params });
      return response.data.products;
    } catch (error) {
      logger.error("Failed to get products", error);
      throw error;
    }
  }
}

module.exports = new ShopifyService();
