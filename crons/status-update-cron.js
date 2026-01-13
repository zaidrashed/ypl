/**
 * Status Update Cron Job
 * مهمة تحديث حالة الشحنات المجدولة
 */

const cron = require("node-cron");
const logger = require("../utils/logger");
const syncService = require("../services/sync-service");
const settings = require("../config/settings");

let statusUpdateCronJob = null;

/**
 * إنشاء مهمة تحديث الحالة المجدولة
 */
function startStatusUpdateCron() {
  if (!settings.sync.enableAutoSync) {
    logger.info("Auto status update is disabled");
    return;
  }

  if (statusUpdateCronJob) {
    logger.warn("Status update cron job is already running");
    return;
  }

  try {
    statusUpdateCronJob = cron.schedule(
      settings.sync.statusUpdateInterval,
      async () => {
        try {
          logger.info("Starting scheduled status update...");

          const result = await syncService.updateConsignmentStatuses();

          logger.info("Scheduled status update completed", result);
        } catch (error) {
          logger.error("Scheduled status update failed", error);
        }
      }
    );

    logger.info("Status update cron job started", {
      interval: settings.sync.statusUpdateInterval,
    });
  } catch (error) {
    logger.error("Failed to start status update cron job", error);
  }
}

/**
 * إيقاف مهمة تحديث الحالة المجدولة
 */
function stopStatusUpdateCron() {
  if (statusUpdateCronJob) {
    statusUpdateCronJob.stop();
    statusUpdateCronJob = null;
    logger.info("Status update cron job stopped");
  }
}

/**
 * إعادة تشغيل مهمة تحديث الحالة
 */
function restartStatusUpdateCron() {
  stopStatusUpdateCron();
  startStatusUpdateCron();
  logger.info("Status update cron job restarted");
}

module.exports = {
  startStatusUpdateCron,
  stopStatusUpdateCron,
  restartStatusUpdateCron,
};
