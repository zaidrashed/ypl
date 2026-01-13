/**
 * Auth Middleware
 * التحقق من صحة التوكن والمتجر
 */

const logger = require("../utils/logger");
const shopService = require("../services/shop-service");

/**
 * استخراج shop URL من الطلب
 */
const extractShopFromRequest = (req) => {
  // محاولة الحصول على shop من مصادر مختلفة
  return (
    req.query?.shop ||
    req.body?.shop ||
    req.headers["x-shopify-shop-api-access-token"]?.split("-")[0] ||
    req.path.split("/")[3]
  );
};

/**
 * Middleware للتحقق من التوكن
 */
const shopAuthMiddleware = async (req, res, next) => {
  try {
    const shopUrl = extractShopFromRequest(req);

    if (!shopUrl) {
      return res.status(400).json({
        error: "Shop URL is required",
        message: "يجب توفير رابط المتجر",
      });
    }

    // الحصول على متجر من قاعدة البيانات
    const shop = await shopService.getShopByUrl(shopUrl);

    if (!shop) {
      return res.status(401).json({
        error: "Shop not found",
        message: "المتجر غير موجود أو لم يتم تثبيت التطبيق عليه",
      });
    }

    if (!shop.is_active) {
      return res.status(403).json({
        error: "Shop is inactive",
        message: "المتجر غير نشط حالياً",
      });
    }

    // إضافة معلومات المتجر للطلب
    req.shop = shop;
    req.shopUrl = shopUrl;
    req.accessToken = shop.access_token;

    logger.info(`✅ Auth verified for shop: ${shopUrl}`);
    next();
  } catch (error) {
    logger.error("Auth middleware error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "حدث خطأ في خادم المصادقة",
    });
  }
};

/**
 * Middleware للتحقق من توكن API
 */
const apiKeyMiddleware = async (req, res, next) => {
  try {
    const apiKey = req.headers["x-api-key"] || req.query?.api_key;

    if (!apiKey) {
      return res.status(401).json({
        error: "API Key is required",
        message: "يجب توفير مفتاح API",
      });
    }

    // التحقق من توكن API (يمكن تخزينها في قاعدة البيانات لاحقاً)
    if (apiKey !== process.env.INTERNAL_API_KEY) {
      return res.status(403).json({
        error: "Invalid API Key",
        message: "مفتاح API غير صحيح",
      });
    }

    next();
  } catch (error) {
    logger.error("API Key middleware error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "حدث خطأ في خادم التحقق",
    });
  }
};

/**
 * Middleware لتسجيل الطلبات
 */
const requestLoggerMiddleware = (req, res, next) => {
  logger.info(`📨 ${req.method} ${req.path}`, {
    shop: req.shop?.shop_url || "unknown",
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });
  next();
};

/**
 * Middleware لمعالجة الأخطاء
 */
const errorHandlerMiddleware = (err, req, res, next) => {
  logger.error("Unhandled error:", err);

  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
    message: "حدث خطأ غير متوقع",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = {
  shopAuthMiddleware,
  apiKeyMiddleware,
  requestLoggerMiddleware,
  errorHandlerMiddleware,
  extractShopFromRequest,
};
