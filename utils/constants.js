/**
 * Constants
 * الثوابت والقيم الافتراضية
 */

module.exports = {
  // أنواع الحمل
  LOAD_TYPES: {
    DOCUMENT: "DOCUMENT",
    NON_DOCUMENT: "NON-DOCUMENT",
  },

  // أنواع الدفع عند الاستلام
  COD_COLLECTION_MODES: {
    CASH: "cash",
    CHEQUE: "cheque",
    DD: "dd",
  },

  // وحدات القياس
  MEASUREMENT_UNITS: {
    KG: "kg",
    GRAM: "gram",
    CM: "cm",
    INCH: "inch",
  },

  // حالات الطلبات في Shopify
  SHOPIFY_ORDER_STATUSES: {
    PENDING: "pending",
    PROCESSING: "processing",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
    FAILED: "failed",
  },

  // حالات الشحن المدعومة
  SUPPORTED_SHIPMENT_STATUSES: [
    "pickup_scheduled",
    "out_for_pickup",
    "reached_at_hub",
    "outfordelivery",
    "attempted",
    "delivered",
    "cancelled",
  ],

  // الدول المدعومة
  SUPPORTED_COUNTRIES: [
    { code: "AE", name: "الإمارات العربية المتحدة" },
    { code: "SA", name: "المملكة العربية السعودية" },
    { code: "YE", name: "اليمن" },
    { code: "OM", name: "عمان" },
    { code: "QA", name: "قطر" },
    { code: "KW", name: "الكويت" },
    { code: "BH", name: "البحرين" },
  ],

  // الأخطاء الشائعة
  ERRORS: {
    INVALID_API_KEY: "مفتاح API غير صحيح",
    CONNECTION_FAILED: "فشل الاتصال بخادم Shipsy",
    INVALID_ORDER_DATA: "بيانات الطلب غير صحيحة",
    CONSIGNMENT_NOT_FOUND: "الشحنة غير موجودة",
    SYNC_FAILED: "فشل المزامنة",
    INVALID_PHONE_NUMBER: "رقم الهاتف غير صحيح",
    INVALID_EMAIL: "البريد الإلكتروني غير صحيح",
    MISSING_REQUIRED_FIELDS: "حقول مطلوبة غير موجودة",
  },

  // الرسائل الناجحة
  SUCCESS_MESSAGES: {
    ORDER_SYNCED: "تم مزامنة الطلب بنجاح",
    CONSIGNMENT_CREATED: "تم إنشاء الشحنة بنجاح",
    SETTINGS_UPDATED: "تم تحديث الإعدادات بنجاح",
    CONNECTION_SUCCESS: "تم الاتصال بنجاح",
  },

  // حدود المعالجة
  LIMITS: {
    MAX_ORDERS_PER_SYNC: 100,
    MAX_RETRIES: 3,
    SYNC_TIMEOUT_MS: 30000,
    MAX_PHONE_LENGTH: 15,
    MIN_PHONE_LENGTH: 10,
  },

  // التنسيقات
  FORMATS: {
    DATE: "YYYY-MM-DD",
    DATETIME: "YYYY-MM-DD HH:mm:ss",
    PHONE: "+966XX-XXX-XXXX",
  },
};
