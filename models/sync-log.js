/**
 * Sync Log Model
 * نموذج سجل المزامنة
 */

const fs = require("fs");
const path = require("path");

const LOG_DIR = path.join(__dirname, "../logs");
const SYNC_LOG_FILE = path.join(LOG_DIR, "sync.log");

/**
 * فئة لتسجيل عمليات المزامنة
 */
class SyncLog {
  /**
   * تسجيل عملية مزامنة جديدة
   */
  static logSync(syncData) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: "sync",
      status: syncData.status, // success, failed, partial
      orderId: syncData.orderId,
      consignmentId: syncData.consignmentId || null,
      synced: syncData.synced || 0,
      failed: syncData.failed || 0,
      total: syncData.total || 0,
      message: syncData.message || "",
      error: syncData.error || null,
      duration: syncData.duration || 0,
    };

    this.writeLog(logEntry);
    return logEntry;
  }

  /**
   * تسجيل تحديث حالة
   */
  static logStatusUpdate(updateData) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: "status_update",
      status: updateData.status,
      orderId: updateData.orderId,
      consignmentId: updateData.consignmentId,
      oldStatus: updateData.oldStatus || null,
      newStatus: updateData.newStatus || null,
      message: updateData.message || "",
      error: updateData.error || null,
    };

    this.writeLog(logEntry);
    return logEntry;
  }

  /**
   * تسجيل خطأ
   */
  static logError(errorData) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: "error",
      orderId: errorData.orderId || null,
      consignmentId: errorData.consignmentId || null,
      message: errorData.message || "",
      stack: errorData.stack || "",
      severity: errorData.severity || "medium", // low, medium, high, critical
    };

    this.writeLog(logEntry);
    return logEntry;
  }

  /**
   * كتابة السجل إلى الملف
   */
  static writeLog(logEntry) {
    try {
      if (!fs.existsSync(LOG_DIR)) {
        fs.mkdirSync(LOG_DIR, { recursive: true });
      }

      const logLine = JSON.stringify(logEntry) + "\n";
      fs.appendFileSync(SYNC_LOG_FILE, logLine);
    } catch (error) {
      console.error("Failed to write sync log:", error);
    }
  }

  /**
   * قراءة السجلات
   */
  static getLogs(options = {}) {
    try {
      if (!fs.existsSync(SYNC_LOG_FILE)) {
        return [];
      }

      const content = fs.readFileSync(SYNC_LOG_FILE, "utf8");
      let logs = content
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => {
          try {
            return JSON.parse(line);
          } catch (e) {
            return null;
          }
        })
        .filter((log) => log !== null);

      // تطبيق الفلاتر
      if (options.type) {
        logs = logs.filter((log) => log.type === options.type);
      }

      if (options.orderId) {
        logs = logs.filter((log) => log.orderId === options.orderId);
      }

      if (options.status) {
        logs = logs.filter((log) => log.status === options.status);
      }

      if (options.limit) {
        logs = logs.slice(-options.limit);
      }

      return logs;
    } catch (error) {
      console.error("Error reading sync logs:", error);
      return [];
    }
  }

  /**
   * الحصول على إحصائيات المزامنة
   */
  static getStats() {
    const logs = this.getLogs();

    const stats = {
      total: logs.length,
      successful: logs.filter((l) => l.status === "success").length,
      failed: logs.filter((l) => l.status === "failed").length,
      partial: logs.filter((l) => l.status === "partial").length,
      totalSynced: 0,
      totalFailed: 0,
      lastSync: logs.length > 0 ? logs[logs.length - 1].timestamp : null,
    };

    logs.forEach((log) => {
      if (log.type === "sync") {
        stats.totalSynced += log.synced || 0;
        stats.totalFailed += log.failed || 0;
      }
    });

    return stats;
  }

  /**
   * مسح السجلات القديمة
   */
  static clearOldLogs(daysOld = 30) {
    try {
      const logs = this.getLogs();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const recentLogs = logs.filter((log) => {
        const logDate = new Date(log.timestamp);
        return logDate > cutoffDate;
      });

      if (!fs.existsSync(LOG_DIR)) {
        fs.mkdirSync(LOG_DIR, { recursive: true });
      }

      const content =
        recentLogs.map((log) => JSON.stringify(log)).join("\n") + "\n";
      fs.writeFileSync(SYNC_LOG_FILE, content);

      return {
        success: true,
        removed: logs.length - recentLogs.length,
        remaining: recentLogs.length,
      };
    } catch (error) {
      console.error("Error clearing old logs:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = SyncLog;
