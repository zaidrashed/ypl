/**
 * Sync Cron Job
 * مهمة المزامنة المجدولة
 */

const cron = require("node-cron");
const logger = require("../utils/logger");
const syncService = require("../services/sync-service");
const settings = require("../config/settings");

let syncCronJob = null;

/**
 * إنشاء مهمة المزامنة المجدولة
 */
function startSyncCron() {
  if (!settings.sync.enableAutoSync) {
    logger.info("Auto sync is disabled");
    return;
  }

  if (syncCronJob) {
    logger.warn("Sync cron job is already running");
    return;
  }

  try {
    syncCronJob = cron.schedule(settings.sync.syncInterval, async () => {
      try {
        logger.info("Starting scheduled order sync...");

        const result = await syncService.syncPendingOrders({
          limit: 50,
        });

        logger.info("Scheduled order sync completed", result);
      } catch (error) {
        logger.error("Scheduled order sync failed", error);
      }
    });

    logger.info("Sync cron job started", {
      interval: settings.sync.syncInterval,
    });
  } catch (error) {
    logger.error("Failed to start sync cron job", error);
  }
}

/**
 * إيقاف مهمة المزامنة المجدولة
 */
function stopSyncCron() {
  if (syncCronJob) {
    syncCronJob.stop();
    syncCronJob = null;
    logger.info("Sync cron job stopped");
  }
}

/**
 * إعادة تشغيل مهمة المزامنة
 */
function restartSyncCron() {
  stopSyncCron();
  startSyncCron();
  logger.info("Sync cron job restarted");
}

module.exports = {
  startSyncCron,
  stopSyncCron,
  restartSyncCron,
};
