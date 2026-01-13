/**
 * OAuth Service
 * مسارات المصادقة والتفويض الآمنة
 */

const axios = require("axios");
const crypto = require("crypto");
const logger = require("../utils/logger");
const shopService = require("./shop-service");

class OAuthService {
  constructor() {
    this.shopifyApiKey = process.env.SHOPIFY_API_KEY;
    this.shopifyApiSecret = process.env.SHOPIFY_API_SECRET;
    this.scopes =
      process.env.SCOPES ||
      "write_orders,read_orders,write_fulfillments,read_fulfillments";
    this.redirectUri =
      process.env.REDIRECT_URI || `${process.env.HOST}/api/auth/callback`;
  }

  /**
   * توليد رابط التفويض
   */
  generateAuthUrl(shopUrl) {
    try {
      if (!shopUrl) {
        throw new Error("Shop URL is required");
      }

      // تنسيق shop URL
      const formattedShopUrl = this.formatShopUrl(shopUrl);

      const state = crypto.randomBytes(16).toString("hex");

      const authUrl = `https://${formattedShopUrl}/admin/oauth/authorize`;
      const params = new URLSearchParams({
        client_id: this.shopifyApiKey,
        scope: this.scopes,
        redirect_uri: this.redirectUri,
        state: state,
      });

      logger.info(`🔐 Auth URL generated for: ${formattedShopUrl}`);

      return {
        authUrl: `${authUrl}?${params.toString()}`,
        state: state,
        shopUrl: formattedShopUrl,
      };
    } catch (error) {
      logger.error("Error generating auth URL:", error);
      throw error;
    }
  }

  /**
   * تبديل الكود بـ Access Token
   */
  async exchangeCodeForToken(code, shopUrl, state) {
    try {
      if (!code || !shopUrl) {
        throw new Error("Code and Shop URL are required");
      }

      const formattedShopUrl = this.formatShopUrl(shopUrl);

      const response = await axios.post(
        `https://${formattedShopUrl}/admin/oauth/access_token`,
        {
          client_id: this.shopifyApiKey,
          client_secret: this.shopifyApiSecret,
          code: code,
          redirect_uri: this.redirectUri,
        }
      );

      const { access_token, scope } = response.data;

      if (!access_token) {
        throw new Error("Failed to obtain access token");
      }

      // الحصول على معلومات المتجر
      const shopData = await this.getShopData(formattedShopUrl, access_token);

      // حفظ المتجر في قاعدة البيانات
      const savedShop = await shopService.saveShop({
        shop_url: formattedShopUrl,
        access_token: access_token,
        scopes: scope,
        shop_name: shopData.shop.name,
        shop_email: shopData.shop.email,
        shop_phone: shopData.shop.phone,
      });

      logger.info(`✅ Access token obtained for: ${formattedShopUrl}`);

      return {
        success: true,
        shop: savedShop,
        accessToken: access_token,
      };
    } catch (error) {
      logger.error("Error exchanging code for token:", error);
      throw error;
    }
  }

  /**
   * الحصول على معلومات المتجر
   */
  async getShopData(shopUrl, accessToken) {
    try {
      const formattedShopUrl = this.formatShopUrl(shopUrl);

      const response = await axios.get(
        `https://${formattedShopUrl}/admin/api/2024-01/shop.json`,
        {
          headers: {
            "X-Shopify-Access-Token": accessToken,
          },
        }
      );

      return response.data;
    } catch (error) {
      logger.error("Error getting shop data:", error);
      throw error;
    }
  }

  /**
   * تنسيق shop URL
   */
  formatShopUrl(shopUrl) {
    if (!shopUrl) {
      throw new Error("Shop URL is required");
    }

    // إزالة البروتوكول إن وجد
    let formatted = shopUrl.replace(/^https?:\/\//, "");

    // التأكد من انتهاء الدومين بـ myshopify.com
    if (!formatted.includes("myshopify.com") && !formatted.includes(".")) {
      formatted = `${formatted}.myshopify.com`;
    }

    return formatted;
  }

  /**
   * التحقق من صحة الطلب من Shopify
   */
  verifyShopifyRequest(query, hmac) {
    try {
      const { code, shop, state, timestamp, ...rest } = query;

      // إنشء نسخة من query بدون hmac
      const params = new URLSearchParams();
      Object.entries(rest).forEach(([key, value]) => {
        if (key !== "hmac") {
          params.append(key, value);
        }
      });

      // فرز المعاملات وإنشاء السلسلة
      const encoded = params.toString();
      const message = encoded;

      // توليد HMAC
      const hash = crypto
        .createHmac("sha256", this.shopifyApiSecret)
        .update(message, "utf8")
        .digest("base64");

      logger.info(`🔒 Verifying Shopify request HMAC`);

      return hash === hmac;
    } catch (error) {
      logger.error("Error verifying Shopify request:", error);
      return false;
    }
  }

  /**
   * فحص صحة التوكن
   */
  async validateAccessToken(shopUrl, accessToken) {
    try {
      const formattedShopUrl = this.formatShopUrl(shopUrl);

      const response = await axios.get(
        `https://${formattedShopUrl}/admin/api/2024-01/shop.json`,
        {
          headers: {
            "X-Shopify-Access-Token": accessToken,
          },
        }
      );

      return response.status === 200;
    } catch (error) {
      logger.error("Error validating access token:", error);
      return false;
    }
  }
}

module.exports = new OAuthService();
