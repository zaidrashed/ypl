/**
 * Shipsy API Service
 * خدمة التكامل مع Shipsy API
 */

const axios = require("axios");
const logger = require("../utils/logger");
const settings = require("../config/settings");

class ShipsyService {
  constructor() {
    this.baseUrl = settings.shipsy.baseUrl;
    this.apiKey = settings.shipsy.apiKey;
    this.organisation = settings.shipsy.organisation;

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: settings.shipsy.timeout,
      headers: {
        "Content-Type": "application/json",
        "api-key": this.apiKey,
      },
    });
  }

  /**
   * التحقق من اتصال API
   */
  async verifyConnection() {
    try {
      const response = await this.client.get("/api/customer/ping");
      logger.info("Shipsy API connection verified");
      return response.status === 200;
    } catch (error) {
      logger.error("Shipsy API connection failed", error);
      return false;
    }
  }

  /**
   * إرسال بيانات الطلب إلى Shipsy
   * Upload Consignment/Softdata
   */
  async createConsignment(orderData) {
    try {
      const payload = this.transformOrderToConsignment(orderData);

      logger.info("Creating consignment in Shipsy", {
        orderId: orderData.id,
        email: orderData.email,
      });

      const response = await this.client.post(
        "/api/customer/integration/consignment/upload/softdata/v2",
        payload
      );

      if (response.data && response.data.consignment_id) {
        logger.info("Consignment created successfully", {
          consignmentId: response.data.consignment_id,
          orderId: orderData.id,
        });
        return {
          success: true,
          consignmentId: response.data.consignment_id,
          data: response.data,
        };
      }

      throw new Error("No consignment ID in response");
    } catch (error) {
      logger.error("Failed to create consignment", {
        orderId: orderData.id,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * الحصول على حالة الشحنة
   */
  async getConsignmentStatus(consignmentId) {
    try {
      const response = await this.client.get(
        `/api/customer/integration/consignment/status/${consignmentId}`
      );

      return response.data;
    } catch (error) {
      logger.error("Failed to get consignment status", {
        consignmentId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * تحويل بيانات طلب Shopify إلى صيغة Shipsy
   */
  transformOrderToConsignment(order) {
    const shippingAddress = order.shipping_address;
    const lineItems = order.line_items;

    // حساب الوزن والأبعاد
    let totalWeight = 0;
    lineItems.forEach((item) => {
      if (item.grams) {
        totalWeight += (item.grams * item.quantity) / 1000; // تحويل إلى كجم
      }
    });

    // القيمة المعلنة
    const declaredValue = parseFloat(order.total_price);

    const consignment = {
      load_type: "NON-DOCUMENT",
      service_type_id: process.env.SHIPSY_SERVICE_TYPE || "express",
      weight: totalWeight.toString(),
      weight_unit: "kg",
      declared_value: Math.round(declaredValue),
      customer_reference_number: order.order_number.toString(),
      hub_code: process.env.SHIPSY_HUB_CODE || "default",

      origin_details: {
        name: process.env.STORE_NAME || "Store",
        phone: process.env.STORE_PHONE || "",
        address_line_1: process.env.STORE_ADDRESS_1 || "",
        address_line_2: process.env.STORE_ADDRESS_2 || "",
        pincode: process.env.STORE_PINCODE || "",
      },

      destination_details: {
        name: shippingAddress?.first_name + " " + shippingAddress?.last_name,
        phone: shippingAddress?.phone || order.customer?.phone || "",
        address_line_1: shippingAddress?.address1 || "",
        address_line_2: shippingAddress?.address2 || "",
        pincode: shippingAddress?.zip || "",
        city: shippingAddress?.city || "",
        state: shippingAddress?.province || "",
        country: shippingAddress?.country || "",
      },

      items: lineItems.map((item) => ({
        sku: item.sku || item.id,
        name: item.title,
        quantity: item.quantity,
        unit_value: item.price,
      })),
    };

    return consignment;
  }

  /**
   * الحصول على قائمة الخدمات المتاحة
   */
  async getServiceTypes() {
    try {
      const response = await this.client.get(
        "/api/customer/integration/serviceType"
      );
      return response.data;
    } catch (error) {
      logger.error("Failed to get service types", error);
      throw error;
    }
  }

  /**
   * الحصول على نقاط الاستلام
   */
  async getPickupPoints(pincode) {
    try {
      const response = await this.client.get(
        `/api/customer/integration/pickup/points?pincode=${pincode}`
      );
      return response.data;
    } catch (error) {
      logger.error("Failed to get pickup points", error);
      throw error;
    }
  }

  /**
   * تحميل AWB (رقم التتبع)
   */
  async downloadLabel(consignmentId) {
    try {
      const response = await this.client.get(
        `/api/customer/integration/consignment/label/${consignmentId}`,
        { responseType: "arraybuffer" }
      );
      return response.data;
    } catch (error) {
      logger.error("Failed to download label", error);
      throw error;
    }
  }

  /**
   * إلغاء شحنة
   */
  async cancelConsignment(consignmentId) {
    try {
      const response = await this.client.post(
        `/api/customer/integration/consignment/${consignmentId}/cancel`
      );
      logger.info("Consignment cancelled", { consignmentId });
      return response.data;
    } catch (error) {
      logger.error("Failed to cancel consignment", error);
      throw error;
    }
  }
}

module.exports = new ShipsyService();
