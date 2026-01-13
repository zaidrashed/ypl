/**
 * Sanitizes objects to prevent circular structure errors during JSON stringification
 * @param {*} obj - The object to sanitize
 * @param {Set} seen - Set of already processed objects (for circular reference detection)
 * @returns {*} Sanitized object safe for JSON stringification
 */
function sanitizeObject(obj, seen = new Set()) {
  // Handle primitives
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Handle circular references
  if (seen.has(obj)) {
    return '[Circular Reference]';
  }

  seen.add(obj);

  // Handle Date objects
  if (obj instanceof Date) {
    return obj.toISOString();
  }

  // Handle Error objects
  if (obj instanceof Error) {
    const errorObj = {
      name: obj.name,
      message: obj.message,
      stack: obj.stack,
    };
    // Add custom properties
    Object.keys(obj).forEach(key => {
      if (!errorObj[key]) {
        try {
          errorObj[key] = sanitizeObject(obj[key], new Set(seen));
        } catch (e) {
          errorObj[key] = '[Unable to serialize]';
        }
      }
    });
    seen.delete(obj);
    return errorObj;
  }

  // Handle Arrays
  if (Array.isArray(obj)) {
    const sanitized = obj.map(item => {
      try {
        return sanitizeObject(item, new Set(seen));
      } catch (e) {
        return '[Unable to serialize]';
      }
    });
    seen.delete(obj);
    return sanitized;
  }

  // Handle Objects
  const sanitized = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      try {
        sanitized[key] = sanitizeObject(obj[key], new Set(seen));
      } catch (e) {
        sanitized[key] = '[Unable to serialize]';
      }
    }
  }
  seen.delete(obj);
  return sanitized;
}

/**
 * Safely converts data to JSON string with error handling
 * @param {*} data - Data to stringify
 * @returns {string} JSON string representation
 */
function safeStringify(data) {
  try {
    const sanitized = sanitizeObject(data);
    return JSON.stringify(sanitized);
  } catch (error) {
    // Fallback to string conversion if all else fails
    try {
      return String(data);
    } catch (e) {
      return '[Object]';
    }
  }
}

/**
 * Logger utility for application logging with error prevention
 */
const logger = {
  /**
   * Log informational messages
   * @param {string} message - Log message
   * @param {*} data - Optional data to log
   */
  info: function(message, data) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      level: 'INFO',
      timestamp,
      message,
    };
    
    if (data !== undefined) {
      logEntry.data = safeStringify(data);
    }
    
    console.log(JSON.stringify(logEntry));
  },

  /**
   * Log warning messages
   * @param {string} message - Log message
   * @param {*} data - Optional data to log
   */
  warn: function(message, data) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      level: 'WARN',
      timestamp,
      message,
    };
    
    if (data !== undefined) {
      logEntry.data = safeStringify(data);
    }
    
    console.warn(JSON.stringify(logEntry));
  },

  /**
   * Log error messages with safe object serialization
   * @param {string} message - Log message
   * @param {Error|*} error - Error object or data
   * @param {*} context - Optional context data
   */
  error: function(message, error, context) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      level: 'ERROR',
      timestamp,
      message,
    };
    
    if (error !== undefined) {
      if (error instanceof Error) {
        logEntry.error = sanitizeObject(error);
      } else {
        logEntry.error = safeStringify(error);
      }
    }
    
    if (context !== undefined) {
      logEntry.context = safeStringify(context);
    }
    
    console.error(JSON.stringify(logEntry));
  },

  /**
   * Log debug messages
   * @param {string} message - Log message
   * @param {*} data - Optional data to log
   */
  debug: function(message, data) {
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true') {
      const timestamp = new Date().toISOString();
      const logEntry = {
        level: 'DEBUG',
        timestamp,
        message,
      };
      
      if (data !== undefined) {
        logEntry.data = safeStringify(data);
      }
      
      console.log(JSON.stringify(logEntry));
    }
  },

  /**
   * Log with custom level
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {*} data - Optional data to log
   */
  log: function(level, message, data) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      level: level.toUpperCase(),
      timestamp,
      message,
    };
    
    if (data !== undefined) {
      logEntry.data = safeStringify(data);
    }
    
    console.log(JSON.stringify(logEntry));
  },
};

module.exports = logger;
