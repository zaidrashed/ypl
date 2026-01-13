#!/usr/bin/env node

/**
 * OAuth Server Application
 * ========================
 * 
 * A secure OAuth 2.0 server implementation with comprehensive error handling,
 * service health checks, and multi-language support.
 * 
 * Features:
 * - Safe error logging with circular structure protection
 * - Graceful shutdown with cleanup routines
 * - Service health monitoring
 * - Request/response debugging
 * - Signal handling (SIGINT, SIGTERM)
 * - Multi-language error messages (English & Arabic)
 * 
 * Created: 2026-01-13
 * Author: Development Team
 */

'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
const fs = require('fs');

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Safe Error Sanitization Utility
 * Prevents circular structure errors and reduces error object to essential info
 */
class SafeErrorSanitizer {
  /**
   * Sanitize error objects to prevent circular reference issues
   * @param {Error|Object} error - Error object to sanitize
   * @param {number} depth - Maximum depth for nested objects
   * @returns {Object} Safe, serializable error object
   */
  static sanitize(error, depth = 3) {
    if (!error) return null;

    try {
      const sanitized = {};

      // Handle Error objects
      if (error instanceof Error) {
        sanitized.name = error.name || 'Error';
        sanitized.message = String(error.message || '');
        sanitized.stack = error.stack ? error.stack.split('\n').slice(0, 5) : [];
        
        // Include custom error properties
        if (error.code) sanitized.code = error.code;
        if (error.statusCode) sanitized.statusCode = error.statusCode;
        if (error.status) sanitized.status = error.status;
      } else if (typeof error === 'object') {
        // Handle plain objects
        Object.keys(error).slice(0, 20).forEach(key => {
          if (key !== 'password' && key !== 'token' && key !== 'secret') {
            const value = error[key];
            sanitized[key] = this._sanitizeValue(value, depth - 1);
          }
        });
      } else {
        sanitized.value = String(error);
      }

      return sanitized;
    } catch (e) {
      return {
        name: 'SanitizationError',
        message: 'Failed to sanitize error object',
        original: String(error)
      };
    }
  }

  /**
   * Recursively sanitize nested values
   * @private
   */
  static _sanitizeValue(value, depth) {
    if (depth <= 0 || !value) return value;
    if (typeof value !== 'object') return value;

    try {
      if (Array.isArray(value)) {
        return value.slice(0, 5).map(v => this._sanitizeValue(v, depth - 1));
      }
      
      const sanitized = {};
      Object.keys(value).slice(0, 10).forEach(key => {
        if (!['password', 'token', 'secret', 'key'].includes(key)) {
          sanitized[key] = this._sanitizeValue(value[key], depth - 1);
        }
      });
      return sanitized;
    } catch (e) {
      return '[Unable to serialize]';
    }
  }
}

/**
 * Logger with safe error handling
 */
class SafeLogger {
  constructor(prefix = 'OAuth') {
    this.prefix = prefix;
    this.logs = [];
    this.maxLogs = 1000;
  }

  /**
   * Format timestamp
   */
  _getTimestamp() {
    return new Date().toISOString();
  }

  /**
   * Log information
   */
  info(message, data = null) {
    const log = {
      level: 'INFO',
      timestamp: this._getTimestamp(),
      prefix: this.prefix,
      message,
      data: data ? SafeErrorSanitizer.sanitize(data) : null
    };
    this._write(log);
  }

  /**
   * Log error with safe sanitization
   */
  error(message, error = null) {
    const log = {
      level: 'ERROR',
      timestamp: this._getTimestamp(),
      prefix: this.prefix,
      message,
      error: error ? SafeErrorSanitizer.sanitize(error) : null
    };
    this._write(log);
  }

  /**
   * Log warning
   */
  warn(message, data = null) {
    const log = {
      level: 'WARN',
      timestamp: this._getTimestamp(),
      prefix: this.prefix,
      message,
      data: data ? SafeErrorSanitizer.sanitize(data) : null
    };
    this._write(log);
  }

  /**
   * Log debug information
   */
  debug(message, data = null) {
    const log = {
      level: 'DEBUG',
      timestamp: this._getTimestamp(),
      prefix: this.prefix,
      message,
      data: data ? SafeErrorSanitizer.sanitize(data) : null
    };
    this._write(log);
  }

  /**
   * Internal write function
   * @private
   */
  _write(log) {
    // Console output
    const prefix = `[${log.timestamp}] [${log.level}] [${log.prefix}]`;
    const message = log.message;
    const dataStr = log.data ? ` ${JSON.stringify(log.data)}` : '';
    const errorStr = log.error ? ` ${JSON.stringify(log.error)}` : '';

    console.log(`${prefix} ${message}${dataStr}${errorStr}`);

    // Store in memory (with circular buffer behavior)
    this.logs.push(log);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  /**
   * Get recent logs
   */
  getRecentLogs(count = 50) {
    return this.logs.slice(-count);
  }

  /**
   * Export logs to file
   */
  exportLogs(filePath) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(this.logs, null, 2));
      return true;
    } catch (e) {
      console.error('Failed to export logs:', e.message);
      return false;
    }
  }
}

/**
 * Service Health Monitor
 */
class ServiceHealthMonitor {
  constructor(logger) {
    this.logger = logger;
    this.status = {
      server: 'initializing',
      database: 'unknown',
      memory: 'ok',
      uptime: 0,
      startTime: Date.now(),
      requestCount: 0,
      errorCount: 0,
      lastError: null
    };
  }

  /**
   * Check service health
   */
  check() {
    this.status.uptime = Math.round((Date.now() - this.status.startTime) / 1000);
    
    // Memory check
    const memUsage = process.memoryUsage();
    const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    this.status.memory = heapUsedPercent > 90 ? 'critical' : 
                        heapUsedPercent > 75 ? 'warning' : 'ok';

    return this.status;
  }

  /**
   * Update server status
   */
  setServerStatus(status) {
    this.status.server = status;
    this.logger.info(`Server status: ${status}`);
  }

  /**
   * Record error
   */
  recordError(error) {
    this.status.errorCount++;
    this.status.lastError = {
      message: error.message,
      time: new Date().toISOString()
    };
  }

  /**
   * Increment request count
   */
  incrementRequestCount() {
    this.status.requestCount++;
  }

  /**
   * Get health report
   */
  getReport() {
    this.check();
    return {
      ...this.status,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Multi-language message utility
 */
class MessageTranslator {
  static messages = {
    'server.starting': {
      en: 'OAuth Server is starting...',
      ar: 'خادم OAuth جاري التشغيل...'
    },
    'server.started': {
      en: 'OAuth Server started successfully',
      ar: 'بدأ خادم OAuth بنجاح'
    },
    'server.failed': {
      en: 'OAuth Server failed to start',
      ar: 'فشل بدء خادم OAuth'
    },
    'server.stopping': {
      en: 'OAuth Server is shutting down...',
      ar: 'خادم OAuth جاري الإيقاف...'
    },
    'server.stopped': {
      en: 'OAuth Server stopped successfully',
      ar: 'توقف خادم OAuth بنجاح'
    },
    'error.internal': {
      en: 'Internal Server Error',
      ar: 'خطأ في الخادم الداخلي'
    },
    'error.unauthorized': {
      en: 'Unauthorized access',
      ar: 'وصول غير مصرح'
    },
    'error.invalid_request': {
      en: 'Invalid request',
      ar: 'طلب غير صحيح'
    },
    'service.health': {
      en: 'Service Health Check',
      ar: 'فحص صحة الخدمة'
    }
  };

  static translate(key, language = 'en') {
    const msg = this.messages[key];
    return msg ? (msg[language] || msg.en) : key;
  }
}

// ============================================================================
// APPLICATION INITIALIZATION
// ============================================================================

const logger = new SafeLogger('OAuthServer');
const healthMonitor = new ServiceHealthMonitor(logger);
let server = null;
let isShuttingDown = false;

/**
 * Initialize Express application with error handling
 */
function initializeApp() {
  logger.info(MessageTranslator.translate('server.starting', 'en'));

  try {
    const app = express();

    // Configure middleware with error handling
    try {
      app.use(bodyParser.json({ limit: '10mb' }));
      app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
      logger.info('Body parser middleware configured successfully');
    } catch (e) {
      logger.error('Failed to configure body parser', e);
      throw e;
    }

    // Request logging middleware
    app.use((req, res, next) => {
      const startTime = Date.now();
      healthMonitor.incrementRequestCount();

      // Log request
      logger.debug(`Incoming ${req.method} request`, {
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('user-agent')
      });

      // Log response
      const originalSend = res.send;
      res.send = function(data) {
        const duration = Date.now() - startTime;
        logger.debug(`Response for ${req.method} ${req.path}`, {
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          size: Buffer.byteLength(JSON.stringify(data))
        });
        return originalSend.call(this, data);
      };

      next();
    });

    // ========================================================================
    // API ENDPOINTS WITH COMPREHENSIVE DOCUMENTATION
    // ========================================================================

    /**
     * GET /health
     * Health check endpoint
     * Returns service health status
     */
    app.get('/health', (req, res) => {
      try {
        const health = healthMonitor.getReport();
        res.status(200).json({
          status: 'ok',
          message: MessageTranslator.translate('service.health', 'en'),
          health
        });
      } catch (e) {
        logger.error('Health check failed', e);
        healthMonitor.recordError(e);
        res.status(500).json({
          status: 'error',
          message: MessageTranslator.translate('error.internal', 'en'),
          error: SafeErrorSanitizer.sanitize(e)
        });
      }
    });

    /**
     * GET /api/status
     * Detailed status endpoint
     * Returns comprehensive service information
     */
    app.get('/api/status', (req, res) => {
      try {
        const status = {
          service: 'OAuth Server',
          version: '1.0.0',
          environment: process.env.NODE_ENV || 'development',
          health: healthMonitor.getReport(),
          timestamp: new Date().toISOString()
        };
        res.status(200).json(status);
      } catch (e) {
        logger.error('Status endpoint error', e);
        healthMonitor.recordError(e);
        res.status(500).json({
          error: MessageTranslator.translate('error.internal', 'en')
        });
      }
    });

    /**
     * GET /api/oauth/authorize
     * OAuth authorization endpoint
     * Query parameters: client_id, response_type, redirect_uri, scope, state
     */
    app.get('/api/oauth/authorize', (req, res) => {
      try {
        const { client_id, redirect_uri, response_type, scope, state } = req.query;

        if (!client_id || !redirect_uri) {
          return res.status(400).json({
            error: 'invalid_request',
            error_description: MessageTranslator.translate('error.invalid_request', 'en'),
            error_description_ar: MessageTranslator.translate('error.invalid_request', 'ar')
          });
        }

        logger.info('Authorization request received', {
          client_id,
          scope,
          response_type
        });

        res.status(200).json({
          message: 'Authorization endpoint - implementation pending',
          received: { client_id, redirect_uri, response_type, scope, state }
        });
      } catch (e) {
        logger.error('Authorization endpoint error', e);
        healthMonitor.recordError(e);
        res.status(500).json({
          error: 'server_error',
          error_description: MessageTranslator.translate('error.internal', 'en')
        });
      }
    });

    /**
     * POST /api/oauth/token
     * Token endpoint
     * Body parameters: grant_type, client_id, client_secret, code, redirect_uri
     */
    app.post('/api/oauth/token', (req, res) => {
      try {
        const { grant_type, client_id, client_secret, code, redirect_uri } = req.body;

        if (!grant_type || !client_id) {
          return res.status(400).json({
            error: 'invalid_request',
            error_description: MessageTranslator.translate('error.invalid_request', 'en')
          });
        }

        logger.info('Token request received', {
          grant_type,
          client_id
        });

        res.status(200).json({
          message: 'Token endpoint - implementation pending',
          received: { grant_type, client_id, code, redirect_uri }
        });
      } catch (e) {
        logger.error('Token endpoint error', e);
        healthMonitor.recordError(e);
        res.status(500).json({
          error: 'server_error',
          error_description: MessageTranslator.translate('error.internal', 'en')
        });
      }
    });

    /**
     * GET /api/logs
     * Retrieve recent logs (admin only - in production use authentication)
     * Query parameters: count (default: 50)
     */
    app.get('/api/logs', (req, res) => {
      try {
        const count = parseInt(req.query.count) || 50;
        const logs = logger.getRecentLogs(Math.min(count, 200));
        
        res.status(200).json({
          count: logs.length,
          logs
        });
      } catch (e) {
        logger.error('Logs endpoint error', e);
        res.status(500).json({
          error: MessageTranslator.translate('error.internal', 'en')
        });
      }
    });

    /**
     * POST /api/logs/export
     * Export logs to file
     * Body parameters: filepath (optional)
     */
    app.post('/api/logs/export', (req, res) => {
      try {
        const filepath = req.body.filepath || `logs/oauth-${Date.now()}.json`;
        const success = logger.exportLogs(filepath);

        if (success) {
          res.status(200).json({
            message: 'Logs exported successfully',
            filepath
          });
        } else {
          res.status(500).json({
            error: 'Failed to export logs'
          });
        }
      } catch (e) {
        logger.error('Logs export error', e);
        res.status(500).json({
          error: MessageTranslator.translate('error.internal', 'en')
        });
      }
    });

    /**
     * GET /api/info
     * Server information endpoint
     * Returns comprehensive service documentation
     */
    app.get('/api/info', (req, res) => {
      try {
        const info = {
          service: 'OAuth 2.0 Server',
          version: '1.0.0',
          description: 'Secure OAuth 2.0 authorization server with comprehensive error handling',
          endpoints: {
            health: {
              path: '/health',
              method: 'GET',
              description: 'Basic health check',
              response: 'Health status with uptime'
            },
            status: {
              path: '/api/status',
              method: 'GET',
              description: 'Detailed status information',
              response: 'Complete service status'
            },
            authorize: {
              path: '/api/oauth/authorize',
              method: 'GET',
              description: 'OAuth authorization endpoint',
              parameters: ['client_id', 'redirect_uri', 'response_type', 'scope', 'state']
            },
            token: {
              path: '/api/oauth/token',
              method: 'POST',
              description: 'OAuth token endpoint',
              parameters: ['grant_type', 'client_id', 'client_secret', 'code', 'redirect_uri']
            },
            logs: {
              path: '/api/logs',
              method: 'GET',
              description: 'Retrieve recent logs',
              parameters: ['count']
            },
            logsExport: {
              path: '/api/logs/export',
              method: 'POST',
              description: 'Export logs to file',
              body: ['filepath']
            }
          },
          documentation: 'See endpoint descriptions above'
        };

        res.status(200).json(info);
      } catch (e) {
        logger.error('Info endpoint error', e);
        res.status(500).json({
          error: MessageTranslator.translate('error.internal', 'en')
        });
      }
    });

    // 404 handler
    app.use((req, res) => {
      logger.warn(`Unhandled request: ${req.method} ${req.path}`);
      res.status(404).json({
        error: 'not_found',
        message: `Endpoint ${req.path} not found`,
        available_endpoints: '/api/info'
      });
    });

    // Global error handler
    app.use((err, req, res, next) => {
      logger.error('Express error handler', err);
      healthMonitor.recordError(err);

      res.status(err.status || 500).json({
        error: 'internal_server_error',
        message: MessageTranslator.translate('error.internal', 'en'),
        error_ar: MessageTranslator.translate('error.internal', 'ar'),
        ...(process.env.NODE_ENV === 'development' && {
          details: SafeErrorSanitizer.sanitize(err)
        })
      });
    });

    return app;
  } catch (e) {
    logger.error(MessageTranslator.translate('server.failed', 'en'), e);
    healthMonitor.recordError(e);
    throw e;
  }
}

/**
 * Start the server with comprehensive error handling
 */
function startServer(port = 3000) {
  return new Promise((resolve, reject) => {
    try {
      const app = initializeApp();
      
      server = http.createServer(app);

      server.on('error', (e) => {
        logger.error('Server error event', e);
        healthMonitor.recordError(e);
        healthMonitor.setServerStatus('error');
        reject(e);
      });

      server.listen(port, () => {
        healthMonitor.setServerStatus('running');
        logger.info(MessageTranslator.translate('server.started', 'en'), {
          port,
          environment: process.env.NODE_ENV || 'development',
          timestamp: new Date().toISOString()
        });

        // Print startup banner
        printStartupBanner(port);
        resolve(server);
      });

      // Handle server close
      server.on('close', () => {
        logger.info('Server closed');
        healthMonitor.setServerStatus('stopped');
      });

    } catch (e) {
      logger.error('Failed to start server', e);
      healthMonitor.recordError(e);
      reject(e);
    }
  });
}

/**
 * Print detailed startup banner
 */
function printStartupBanner(port) {
  const banner = `
╔════════════════════════════════════════════════════════════════╗
║                   OAuth Server Started                         ║
╠════════════════════════════════════════════════════════════════╣
║  Service:     OAuth 2.0 Server                                 ║
║  Version:     1.0.0                                            ║
║  Port:        ${String(port).padEnd(55)}║
║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(50)}║
║  Started:     ${new Date().toISOString().padEnd(55)}║
╠════════════════════════════════════════════════════════════════╣
║  Available Endpoints:                                          ║
║    • GET  /health                    - Health check            ║
║    • GET  /api/status                - Service status          ║
║    • GET  /api/info                  - API documentation       ║
║    • GET  /api/oauth/authorize       - Authorization endpoint  ║
║    • POST /api/oauth/token           - Token endpoint          ║
║    • GET  /api/logs                  - View logs               ║
║    • POST /api/logs/export           - Export logs             ║
╠════════════════════════════════════════════════════════════════╣
║  Shutdown: Press CTRL+C (SIGINT) or send SIGTERM              ║
╚════════════════════════════════════════════════════════════════╝
`;
  console.log(banner);
}

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(signal) {
  if (isShuttingDown) {
    logger.warn(`Shutdown already in progress, ignoring ${signal}`);
    return;
  }

  isShuttingDown = true;
  logger.info(`Received ${signal}, initiating graceful shutdown...`);
  logger.info(MessageTranslator.translate('server.stopping', 'en'));

  const shutdownTimeout = setTimeout(() => {
    logger.error('Graceful shutdown timeout, forcing exit');
    process.exit(1);
  }, 10000);

  try {
    // Log final health status
    const finalHealth = healthMonitor.getReport();
    logger.info('Final service health', finalHealth);

    // Close server if running
    if (server) {
      await new Promise((resolve) => {
        server.close(() => {
          logger.info('Server closed successfully');
          resolve();
        });

        // Force close after timeout
        setTimeout(() => {
          logger.warn('Server did not close gracefully, forcing');
          resolve();
        }, 5000);
      });
    }

    // Export logs before shutdown
    try {
      if (!fs.existsSync('logs')) {
        fs.mkdirSync('logs', { recursive: true });
      }
      const logFile = `logs/oauth-shutdown-${Date.now()}.json`;
      logger.exportLogs(logFile);
      logger.info(`Logs exported to ${logFile}`);
    } catch (e) {
      logger.warn('Failed to export logs on shutdown', e);
    }

    clearTimeout(shutdownTimeout);
    logger.info(MessageTranslator.translate('server.stopped', 'en'));
    process.exit(0);
  } catch (e) {
    logger.error('Error during graceful shutdown', e);
    clearTimeout(shutdownTimeout);
    process.exit(1);
  }
}

/**
 * Setup signal handlers
 */
function setupSignalHandlers() {
  // SIGINT (Ctrl+C)
  process.on('SIGINT', () => {
    logger.info('SIGINT signal received');
    gracefulShutdown('SIGINT');
  });

  // SIGTERM
  process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received');
    gracefulShutdown('SIGTERM');
  });

  // Uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', error);
    healthMonitor.recordError(error);
    gracefulShutdown('uncaughtException');
  });

  // Unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled promise rejection', {
      reason: SafeErrorSanitizer.sanitize(reason),
      promise: String(promise)
    });
    healthMonitor.recordError(new Error(String(reason)));
  });
}

/**
 * Main application entry point
 */
async function main() {
  try {
    const port = process.env.PORT || 3000;
    
    logger.info('Initializing OAuth Server application');
    
    // Setup signal handlers before starting
    setupSignalHandlers();
    logger.info('Signal handlers registered');

    // Start server
    await startServer(port);
    logger.info(`Server is ready to accept requests on port ${port}`);

  } catch (e) {
    logger.error('Fatal error during initialization', e);
    healthMonitor.recordError(e);
    process.exit(1);
  }
}

// ============================================================================
// APPLICATION STARTUP
// ============================================================================

// Only start if this is the main module
if (require.main === module) {
  main().catch(error => {
    logger.error('Application crashed', error);
    process.exit(1);
  });
}

// Export for testing
module.exports = {
  startServer,
  gracefulShutdown,
  SafeErrorSanitizer,
  SafeLogger,
  ServiceHealthMonitor,
  MessageTranslator
};
