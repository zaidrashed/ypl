/**
 * Settings Controller
 * متحكم الإعدادات
 */

const logger = require("../utils/logger");
const shipsyService = require("../services/shipsy-service");

class SettingsController {
  /**
   * الحصول على الإعدادات
   */
  async getSettings(req, res) {
    try {
      // يمكن حفظ الإعدادات في قاعدة بيانات
      // هنا نعيد الإعدادات من متغيرات البيئة
      const settings = {
        shipsy: {
          baseUrl: process.env.SHIPSY_BASE_URL,
          organisation: process.env.SHIPSY_ORGANISATION,
          // لا نعيد المفتاح للأمان
        },
        sync: {
          enableAutoSync: process.env.ENABLE_AUTO_SYNC !== "false",
          syncInterval: process.env.SYNC_INTERVAL || "*/15 * * * *",
          statusUpdateInterval:
            process.env.STATUS_UPDATE_INTERVAL || "0 * * * *",
        },
        store: {
          name: process.env.STORE_NAME,
          phone: process.env.STORE_PHONE,
          address: {
            line1: process.env.STORE_ADDRESS_1,
            line2: process.env.STORE_ADDRESS_2,
            pincode: process.env.STORE_PINCODE,
          },
        },
      };

      res.json({
        success: true,
        data: settings,
      });
    } catch (error) {
      logger.error("Error getting settings", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * تحديث الإعدادات
   */
  async updateSettings(req, res) {
    try {
      const { settings } = req.body;

      // التحقق من صحة البيانات
      if (!settings || typeof settings !== "object") {
        return res.status(400).json({
          success: false,
          error: "بيانات الإعدادات غير صحيحة",
        });
      }

      // حفظ الإعدادات (يمكن حفظها في قاعدة بيانات أو ملف إعدادات)
      if (settings.shipsy) {
        process.env.SHIPSY_BASE_URL =
          settings.shipsy.baseUrl || process.env.SHIPSY_BASE_URL;
        process.env.SHIPSY_ORGANISATION =
          settings.shipsy.organisation || process.env.SHIPSY_ORGANISATION;
      }

      if (settings.sync) {
        process.env.ENABLE_AUTO_SYNC = settings.sync.enableAutoSync
          ? "true"
          : "false";
        process.env.SYNC_INTERVAL =
          settings.sync.syncInterval || process.env.SYNC_INTERVAL;
      }

      if (settings.store) {
        process.env.STORE_NAME = settings.store.name || process.env.STORE_NAME;
        process.env.STORE_PHONE =
          settings.store.phone || process.env.STORE_PHONE;
        process.env.STORE_ADDRESS_1 =
          settings.store.address?.line1 || process.env.STORE_ADDRESS_1;
        process.env.STORE_ADDRESS_2 =
          settings.store.address?.line2 || process.env.STORE_ADDRESS_2;
        process.env.STORE_PINCODE =
          settings.store.address?.pincode || process.env.STORE_PINCODE;
      }

      logger.info("Settings updated");

      res.json({
        success: true,
        message: "تم تحديث الإعدادات بنجاح",
      });
    } catch (error) {
      logger.error("Error updating settings", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * التحقق من الاتصال مع Shipsy
   */
  async testConnection(req, res) {
    try {
      const isConnected = await shipsyService.verifyConnection();

      res.json({
        success: isConnected,
        message: isConnected ? "تم الاتصال بنجاح" : "فشل الاتصال",
      });
    } catch (error) {
      logger.error("Error testing connection", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * الحصول على أنواع الخدمات المتاحة
   */
  async getServiceTypes(req, res) {
    try {
      const services = await shipsyService.getServiceTypes();

      res.json({
        success: true,
        data: services,
      });
    } catch (error) {
      logger.error("Error getting service types", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * الحصول على نقاط الاستلام
   */
  async getPickupPoints(req, res) {
    try {
      const { pincode } = req.query;

      if (!pincode) {
        return res.status(400).json({
          success: false,
          error: "الرمز البريدي مطلوب",
        });
      }

      const points = await shipsyService.getPickupPoints(pincode);

      res.json({
        success: true,
        data: points,
      });
    } catch (error) {
      logger.error("Error getting pickup points", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = new SettingsController();
