/**
 * Logger Utility
 * نظام التسجيل المركزي
 */

const fs = require("fs");
const path = require("path");

const LOG_DIR = path.join(__dirname, "../logs");
const LOG_LEVEL = process.env.LOG_LEVEL || "info";

// التأكد من وجود مجلد السجلات
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

class Logger {
  constructor() {
    this.level = levels[LOG_LEVEL] || levels.info;
  }

  /**
   * تسجيل رسالة خطأ
   */
  error(message, data = {}) {
    if (this.level >= levels.error) {
      this.log("ERROR", message, data);
    }
  }

  /**
   * تسجيل تحذير
   */
  warn(message, data = {}) {
    if (this.level >= levels.warn) {
      this.log("WARN", message, data);
    }
  }

  /**
   * تسجيل معلومة
   */
  info(message, data = {}) {
    if (this.level >= levels.info) {
      this.log("INFO", message, data);
    }
  }

  /**
   * تسجيل تفاصيل (Debug)
   */
  debug(message, data = {}) {
    if (this.level >= levels.debug) {
      this.log("DEBUG", message, data);
    }
  }

  /**
   * التسجيل الفعلي
   */
  log(level, message, data) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...data,
    };

    // طباعة في Console
    console.log(`[${timestamp}] ${level}: ${message}`, data);

    // كتابة في ملف السجل
    const logFile = path.join(LOG_DIR, "app.log");
    const logLine = JSON.stringify(logEntry) + "\n";

    fs.appendFileSync(logFile, logLine, (err) => {
      if (err) {
        console.error("Failed to write to log file:", err);
      }
    });
  }

  /**
   * قراءة السجلات
   */
  getLogs(limit = 100) {
    try {
      const logFile = path.join(LOG_DIR, "app.log");
      if (!fs.existsSync(logFile)) {
        return [];
      }

      const content = fs.readFileSync(logFile, "utf8");
      const lines = content.split("\n").filter((line) => line.trim());

      return lines.slice(-limit).map((line) => {
        try {
          return JSON.parse(line);
        } catch (e) {
          return { message: line };
        }
      });
    } catch (error) {
      console.error("Error reading logs:", error);
      return [];
    }
  }

  /**
   * مسح السجلات
   */
  clearLogs() {
    try {
      const logFile = path.join(LOG_DIR, "app.log");
      if (fs.existsSync(logFile)) {
        fs.unlinkSync(logFile);
      }
    } catch (error) {
      console.error("Error clearing logs:", error);
    }
  }
}

module.exports = new Logger();
