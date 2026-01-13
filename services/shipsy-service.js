/**
 * Shipsy Service Module
 * Handles interactions with Shipsy API with improved error handling and logging
 */

const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Sanitize objects for logging to prevent circular structure errors
 * @param {any} obj - Object to sanitize
 * @param {number} depth - Current depth of recursion
 * @param {number} maxDepth - Maximum depth to traverse
 * @returns {any} Sanitized object safe for logging
 */
function sanitizeForLogging(obj, depth = 0, maxDepth = 3) {
  // Prevent infinite recursion
  if (depth > maxDepth) {
    return '[Max depth reached]';
  }

  // Handle null and undefined
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle primitives
  if (typeof obj !== 'object') {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.slice(0, 10).map((item) => sanitizeForLogging(item, depth + 1, maxDepth));
  }

  // Handle objects
  const sanitized = {};
  const keys = Object.keys(obj).slice(0, 15); // Limit keys to prevent massive logs

  for (const key of keys) {
    try {
      const value = obj[key];
      // Exclude circular references and certain sensitive fields
      if (typeof value === 'function' || key.includes('password') || key.includes('token')) {
        sanitized[key] = '[redacted]';
      } else {
        sanitized[key] = sanitizeForLogging(value, depth + 1, maxDepth);
      }
    } catch (error) {
      sanitized[key] = '[error reading property]';
    }
  }

  return sanitized;
}

/**
 * Safe logging function that prevents circular reference errors
 * @param {string} message - Log message
 * @param {any} data - Data to log
 * @param {string} level - Log level (info, error, warn, debug)
 */
function safeLog(message, data, level = 'info') {
  try {
    const sanitizedData = data ? sanitizeForLogging(data) : undefined;
    logger[level](message, sanitizedData);
  } catch (error) {
    logger.error('Error while logging:', { originalError: error.message });
  }
}

/**
 * Get Shipsy API instance with configured headers and timeout
 * @returns {AxiosInstance} Configured Axios instance
 */
function getShipsyClient() {
  return axios.create({
    baseURL: process.env.SHIPSY_API_URL || 'https://api.shipsy.io',
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.SHIPSY_API_KEY}`,
    },
  });
}

/**
 * Create a shipment in Shipsy
 * @param {object} shipmentData - Shipment details
 * @returns {Promise<object>} Created shipment response
 * @throws {Error} If shipment creation fails
 */
async function createShipment(shipmentData) {
  const client = getShipsyClient();

  try {
    if (!shipmentData || typeof shipmentData !== 'object') {
      throw new Error('Invalid shipment data: must be a non-null object');
    }

    safeLog('Creating shipment with Shipsy', { shipmentData }, 'info');

    const response = await client.post('/shipments', shipmentData);

    safeLog('Shipment created successfully', { shipmentId: response.data?.id }, 'info');

    return response.data;
  } catch (error) {
    const errorDetails = {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
    };

    safeLog('Error creating shipment in Shipsy', errorDetails, 'error');

    const customError = new Error(
      `Shipsy shipment creation failed: ${error.message}`
    );
    customError.statusCode = error.response?.status || 500;
    customError.originalError = error;

    throw customError;
  }
}

/**
 * Get shipment tracking information
 * @param {string} shipmentId - Shipsy shipment ID
 * @returns {Promise<object>} Shipment tracking details
 * @throws {Error} If tracking fetch fails
 */
async function getShipmentTracking(shipmentId) {
  const client = getShipsyClient();

  try {
    if (!shipmentId || typeof shipmentId !== 'string') {
      throw new Error('Invalid shipment ID: must be a non-empty string');
    }

    safeLog('Fetching shipment tracking', { shipmentId }, 'debug');

    const response = await client.get(`/shipments/${shipmentId}/tracking`);

    safeLog('Shipment tracking retrieved successfully', { shipmentId }, 'info');

    return response.data;
  } catch (error) {
    const errorDetails = {
      message: error.message,
      shipmentId,
      status: error.response?.status,
      statusText: error.response?.statusText,
    };

    safeLog('Error fetching shipment tracking', errorDetails, 'error');

    const customError = new Error(
      `Failed to fetch tracking for shipment ${shipmentId}: ${error.message}`
    );
    customError.statusCode = error.response?.status || 500;
    customError.originalError = error;

    throw customError;
  }
}

/**
 * Cancel a shipment
 * @param {string} shipmentId - Shipsy shipment ID
 * @param {string} reason - Cancellation reason
 * @returns {Promise<object>} Cancellation response
 * @throws {Error} If cancellation fails
 */
async function cancelShipment(shipmentId, reason = '') {
  const client = getShipsyClient();

  try {
    if (!shipmentId || typeof shipmentId !== 'string') {
      throw new Error('Invalid shipment ID: must be a non-empty string');
    }

    safeLog('Cancelling shipment', { shipmentId, reason }, 'info');

    const response = await client.post(`/shipments/${shipmentId}/cancel`, {
      reason: reason || 'Cancelled by system',
    });

    safeLog('Shipment cancelled successfully', { shipmentId }, 'info');

    return response.data;
  } catch (error) {
    const errorDetails = {
      message: error.message,
      shipmentId,
      status: error.response?.status,
      statusText: error.response?.statusText,
    };

    safeLog('Error cancelling shipment', errorDetails, 'error');

    const customError = new Error(
      `Failed to cancel shipment ${shipmentId}: ${error.message}`
    );
    customError.statusCode = error.response?.status || 500;
    customError.originalError = error;

    throw customError;
  }
}

/**
 * Batch create shipments
 * @param {array} shipments - Array of shipment data objects
 * @returns {Promise<object>} Batch creation response
 * @throws {Error} If batch creation fails
 */
async function batchCreateShipments(shipments) {
  const client = getShipsyClient();

  try {
    if (!Array.isArray(shipments) || shipments.length === 0) {
      throw new Error('Invalid shipments: must be a non-empty array');
    }

    safeLog('Creating batch shipments', { count: shipments.length }, 'info');

    const response = await client.post('/shipments/batch', { shipments });

    safeLog('Batch shipments created successfully', { count: response.data?.count }, 'info');

    return response.data;
  } catch (error) {
    const errorDetails = {
      message: error.message,
      shipmentCount: shipments.length,
      status: error.response?.status,
      statusText: error.response?.statusText,
    };

    safeLog('Error creating batch shipments', errorDetails, 'error');

    const customError = new Error(
      `Shipsy batch creation failed: ${error.message}`
    );
    customError.statusCode = error.response?.status || 500;
    customError.originalError = error;

    throw customError;
  }
}

module.exports = {
  createShipment,
  getShipmentTracking,
  cancelShipment,
  batchCreateShipments,
  sanitizeForLogging,
  safeLog,
};
