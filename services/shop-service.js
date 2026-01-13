/**
 * Shop Service
 * إدارة بيانات المتاجر وتخزين التوكنات
 */

const db = require("../database/connection");
const logger = require("../utils/logger");

class ShopService {
  /**
   * تخزين متجر جديد أو تحديثه
   */
  async saveShop(shopData) {
    try {
      const {
        shop_url,
        access_token,
        scopes,
        shop_name,
        shop_email,
        shop_phone,
      } = shopData;

      const query = `
        INSERT INTO shops
        (shop_url, access_token, scopes, shop_name, shop_email, shop_phone, is_active, installed_at)
        VALUES ($1, $2, $3, $4, $5, $6, true, NOW())
        ON CONFLICT (shop_url)
        DO UPDATE SET
          access_token = $2,
          scopes = $3,
          shop_name = $4,
          shop_email = $5,
          shop_phone = $6,
          updated_at = NOW()
        RETURNING *;
      `;

      const shop = await db.insertOne(query, [
        shop_url,
        access_token,
        scopes,
        shop_name,
        shop_email,
        shop_phone,
      ]);

      logger.info(`✅ Shop saved: ${shop_url}`);
      return shop;
    } catch (error) {
      logger.error("Error saving shop:", error);
      throw error;
    }
  }

  /**
   * الحصول على متجر بواسطة shop_url
   */
  async getShopByUrl(shopUrl) {
    try {
      const shop = await db.getOne("SELECT * FROM shops WHERE shop_url = $1", [
        shopUrl,
      ]);
      return shop;
    } catch (error) {
      logger.error("Error getting shop:", error);
      throw error;
    }
  }

  /**
   * الحصول على توكن المتجر
   */
  async getAccessToken(shopUrl) {
    try {
      const shop = await this.getShopByUrl(shopUrl);
      if (!shop) {
        throw new Error(`Shop not found: ${shopUrl}`);
      }
      return shop.access_token;
    } catch (error) {
      logger.error("Error getting access token:", error);
      throw error;
    }
  }

  /**
   * الحصول على جميع المتاجر النشطة
   */
  async getActiveShops() {
    try {
      const shops = await db.getAll(
        "SELECT * FROM shops WHERE is_active = true ORDER BY installed_at DESC",
        []
      );
      return shops;
    } catch (error) {
      logger.error("Error getting active shops:", error);
      throw error;
    }
  }

  /**
   * تحديث إعدادات Shipsy للمتجر
   */
  async updateShipsySettings(shopUrl, shipsySettings) {
    try {
      const { shipsy_org_id, shipsy_api_key } = shipsySettings;

      const query = `
        UPDATE shops
        SET shipsy_org_id = $1, shipsy_api_key = $2, updated_at = NOW()
        WHERE shop_url = $3
        RETURNING *;
      `;

      const shop = await db.insertOne(query, [
        shipsy_org_id,
        shipsy_api_key,
        shopUrl,
      ]);
      logger.info(`✅ Shipsy settings updated for: ${shopUrl}`);
      return shop;
    } catch (error) {
      logger.error("Error updating Shipsy settings:", error);
      throw error;
    }
  }

  /**
   * تحديث آخر وقت مزامنة
   */
  async updateLastSync(shopUrl) {
    try {
      const query = `
        UPDATE shops
        SET last_sync = NOW()
        WHERE shop_url = $1
        RETURNING *;
      `;

      const shop = await db.insertOne(query, [shopUrl]);
      return shop;
    } catch (error) {
      logger.error("Error updating last sync:", error);
      throw error;
    }
  }

  /**
   * تعطيل متجر
   */
  async deactivateShop(shopUrl) {
    try {
      const query = `
        UPDATE shops
        SET is_active = false, updated_at = NOW()
        WHERE shop_url = $1
        RETURNING *;
      `;

      const shop = await db.insertOne(query, [shopUrl]);
      logger.info(`⚠️ Shop deactivated: ${shopUrl}`);
      return shop;
    } catch (error) {
      logger.error("Error deactivating shop:", error);
      throw error;
    }
  }

  /**
   * حذف متجر
   */
  async deleteShop(shopUrl) {
    try {
      const query = `
        DELETE FROM shops
        WHERE shop_url = $1
        RETURNING *;
      `;

      const shop = await db.insertOne(query, [shopUrl]);
      logger.info(`🗑️ Shop deleted: ${shopUrl}`);
      return shop;
    } catch (error) {
      logger.error("Error deleting shop:", error);
      throw error;
    }
  }

  /**
   * الحصول على إحصائيات المتاجر
   */
  async getShopsStats() {
    try {
      const stats = await db.getOne(
        `SELECT
          COUNT(*) as total_shops,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active_shops,
          MAX(installed_at) as latest_installation
         FROM shops`,
        []
      );
      return stats;
    } catch (error) {
      logger.error("Error getting shops stats:", error);
      throw error;
    }
  }
}

module.exports = new ShopService();
