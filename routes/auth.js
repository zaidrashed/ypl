/**
 * OAuth Routes
 * مسارات المصادقة والتفويض
 */

const express = require("express");
const router = express.Router();
const oauthService = require("../services/oauth-service");
const shopService = require("../services/shop-service");
const logger = require("../utils/logger");

/**
 * POST /api/auth
 * بدء عملية المصادقة
 * التاجر ينقر "Install" → يتم إعادة توجيهه للموافقة على Shopify
 */
router.post("/auth", (req, res) => {
  try {
    const { shop } = req.body;

    if (!shop) {
      return res.status(400).json({
        error: "Shop URL is required",
        message: "رابط المتجر مطلوب",
      });
    }

    const { authUrl, state, shopUrl } = oauthService.generateAuthUrl(shop);

    // حفظ state مؤقتاً (في إنتاج، استخدم Redis أو session)
    // يمكن تحسين هذا لاحقاً بـ Session Storage
    res.json({
      success: true,
      authUrl: authUrl,
      state: state,
      message: "تم توليد رابط المصادقة بنجاح",
    });
  } catch (error) {
    logger.error("Error in auth route:", error);
    res.status(500).json({
      error: error.message,
      message: "حدث خطأ في بدء عملية المصادقة",
    });
  }
});

/**
 * GET /api/auth/callback
 * إعادة التوجيه من Shopify بعد الموافقة
 * شوبيفاي يرسل: code, shop, state
 */
router.get("/auth/callback", async (req, res) => {
  try {
    const { code, shop, state, hmac, timestamp } = req.query;

    // التحقق من أن المعاملات قادمة من Shopify
    const isValid = oauthService.verifyShopifyRequest(req.query, hmac);

    if (!isValid) {
      logger.warn(`⚠️ Invalid HMAC for shop: ${shop}`);
      return res.status(403).json({
        error: "Invalid request signature",
        message: "التوقيع الرقمي غير صحيح",
      });
    }

    // التحقق من التوقيت (يجب أن يكون الطلب خلال 10 دقائق)
    const requestTime = parseInt(timestamp) * 1000;
    const currentTime = Date.now();
    const timeDiff = Math.abs(currentTime - requestTime) / 1000 / 60;

    if (timeDiff > 10) {
      logger.warn(`⚠️ Request timestamp too old: ${timeDiff} minutes`);
      return res.status(403).json({
        error: "Request expired",
        message: "انتهت صلاحية الطلب",
      });
    }

    // تبديل الكود بـ Access Token
    const result = await oauthService.exchangeCodeForToken(code, shop, state);

    logger.info(`✅ OAuth callback successful for: ${shop}`);

    // إعادة التوجيه لصفحة النجاح أو لوحة المتحكم
    const dashboardUrl = `${process.env.HOST}/dashboard?shop=${result.shop.shop_url}&installed=true`;

    res.redirect(dashboardUrl);
  } catch (error) {
    logger.error("Error in auth callback:", error);

    // إعادة التوجيه لصفحة الخطأ
    const errorUrl = `${process.env.HOST}/error?message=${encodeURIComponent(
      error.message
    )}`;
    res.redirect(errorUrl);
  }
});

/**
 * POST /api/auth/verify
 * التحقق من أن المتجر مثبت التطبيق
 */
router.post("/auth/verify", async (req, res) => {
  try {
    const { shop } = req.body;

    if (!shop) {
      return res.status(400).json({
        error: "Shop URL is required",
        message: "رابط المتجر مطلوب",
      });
    }

    const formattedShop = oauthService.formatShopUrl(shop);
    const shopData = await shopService.getShopByUrl(formattedShop);

    if (!shopData) {
      return res.status(404).json({
        error: "Shop not found",
        message: "المتجر غير مثبت عليه التطبيق",
        installed: false,
      });
    }

    // التحقق من صحة التوكن
    const isValid = await oauthService.validateAccessToken(
      formattedShop,
      shopData.access_token
    );

    res.json({
      success: true,
      installed: shopData.is_active,
      isTokenValid: isValid,
      shop: {
        shop_url: shopData.shop_url,
        shop_name: shopData.shop_name,
        shop_email: shopData.shop_email,
        installed_at: shopData.installed_at,
      },
    });
  } catch (error) {
    logger.error("Error in verify route:", error);
    res.status(500).json({
      error: error.message,
      message: "حدث خطأ في التحقق",
    });
  }
});

/**
 * POST /api/auth/uninstall
 * إلغاء تثبيت التطبيق
 */
router.post("/auth/uninstall", async (req, res) => {
  try {
    const { shop } = req.body;

    if (!shop) {
      return res.status(400).json({
        error: "Shop URL is required",
        message: "رابط المتجر مطلوب",
      });
    }

    const formattedShop = oauthService.formatShopUrl(shop);

    // حذف المتجر من قاعدة البيانات
    await shopService.deleteShop(formattedShop);

    logger.info(`🗑️ App uninstalled from: ${formattedShop}`);

    res.json({
      success: true,
      message: "تم حذف التطبيق بنجاح",
    });
  } catch (error) {
    logger.error("Error in uninstall route:", error);
    res.status(500).json({
      error: error.message,
      message: "حدث خطأ في حذف التطبيق",
    });
  }
});

/**
 * GET /api/auth/shops
 * الحصول على جميع المتاجر المثبتة (للإدارة فقط)
 */
router.get("/auth/shops", async (req, res) => {
  try {
    const shops = await shopService.getActiveShops();

    res.json({
      success: true,
      count: shops.length,
      shops: shops.map((shop) => ({
        shop_url: shop.shop_url,
        shop_name: shop.shop_name,
        shop_email: shop.shop_email,
        installed_at: shop.installed_at,
        last_sync: shop.last_sync,
        is_active: shop.is_active,
      })),
    });
  } catch (error) {
    logger.error("Error fetching shops:", error);
    res.status(500).json({
      error: error.message,
      message: "حدث خطأ في جلب المتاجر",
    });
  }
});

module.exports = router;
