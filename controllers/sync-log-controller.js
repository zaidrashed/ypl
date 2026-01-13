/**
 * Sync Log Controller
 * متحكم سجل المزامنة
 */

const SyncLog = require("../models/sync-log");
const logger = require("../utils/logger");

class SyncLogController {
  /**
   * الحصول على السجلات
   */
  async getLogs(req, res) {
    try {
      const options = {
        type: req.query.type,
        orderId: req.query.orderId,
        status: req.query.status,
        limit: parseInt(req.query.limit) || 100,
      };

      const logs = SyncLog.getLogs(options);

      res.json({
        success: true,
        data: logs,
        count: logs.length,
      });
    } catch (error) {
      logger.error("Error getting logs", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * الحصول على إحصائيات المزامنة
   */
  async getStats(req, res) {
    try {
      const stats = SyncLog.getStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error("Error getting stats", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * مسح السجلات القديمة
   */
  async clearOldLogs(req, res) {
    try {
      const daysOld = req.body.daysOld || 30;
      const result = SyncLog.clearOldLogs(daysOld);

      res.json({
        success: result.success,
        data: result,
      });
    } catch (error) {
      logger.error("Error clearing old logs", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * حذف جميع السجلات
   */
  async clearAllLogs(req, res) {
    try {
      const result = SyncLog.clearOldLogs(0);

      res.json({
        success: result.success,
        message: "تم حذف جميع السجلات",
      });
    } catch (error) {
      logger.error("Error clearing all logs", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = new SyncLogController();
