/**
 * Configuration Settings
 * إعدادات التطبيق والثوابت
 */

module.exports = {
  // Shopify Configuration
  shopify: {
    apiKey: process.env.SHOPIFY_API_KEY,
    apiSecret: process.env.SHOPIFY_API_SECRET,
    accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
    store: process.env.SHOPIFY_STORE,
    apiVersion: "2024-01",
  },

  // Shipsy Configuration
  shipsy: {
    baseUrl: process.env.SHIPSY_BASE_URL || "https://yemenapi.shipsy.io",
    apiKey: process.env.SHIPSY_API_KEY,
    organisation: process.env.SHIPSY_ORGANISATION,
    timeout: 30000,
  },

  // App Configuration
  app: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || "development",
    host: process.env.HOST || "localhost",
  },

  // Sync Configuration
  sync: {
    enableAutoSync: process.env.ENABLE_AUTO_SYNC !== "false",
    syncInterval: process.env.SYNC_INTERVAL || "*/15 * * * *", // Every 15 minutes
    statusUpdateInterval: process.env.STATUS_UPDATE_INTERVAL || "0 * * * *", // Every hour
    maxRetries: 3,
    retryDelay: 5000,
  },

  // Order Statuses
  orderStatuses: {
    pending: "pending",
    processing: "processing",
    completed: "completed",
    cancelled: "cancelled",
    failed: "failed",
  },

  // Shipment Statuses (from Shipsy)
  shipmentStatuses: {
    pickup_scheduled: {
      name: "جدول الاستلام",
      shopifyStatus: "pending",
      notify: true,
    },
    out_for_pickup: {
      name: "جاري الاستلام",
      shopifyStatus: "processing",
      notify: true,
    },
    reached_at_hub: {
      name: "وصل المركز",
      shopifyStatus: "processing",
      notify: false,
    },
    outfordelivery: {
      name: "جاري التوصيل",
      shopifyStatus: "processing",
      notify: true,
    },
    attempted: {
      name: "محاولة توصيل",
      shopifyStatus: "processing",
      notify: true,
    },
    delivered: {
      name: "تم التسليم",
      shopifyStatus: "completed",
      notify: true,
    },
    cancelled: {
      name: "ملغى",
      shopifyStatus: "cancelled",
      notify: true,
    },
  },

  // API Endpoints
  endpoints: {
    shopifyOrders: "/admin/api/2024-01/orders",
    shopifyFulfillments: "/admin/api/2024-01/fulfillments",
    shipsyConsignments: "/api/customer/integration/consignment",
    shipsyStatus: "/api/customer/integration/consignment/status",
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || "info",
    format: process.env.LOG_FORMAT || "json",
  },
};
