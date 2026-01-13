/**
 * Database Connection Module
 * اتصال قاعدة البيانات PostgreSQL
 */

const { Pool } = require("pg");
const logger = require("../utils/logger");

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "shipsy_econnect",
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

pool.on("error", (err) => {
  logger.error("Unexpected error on idle client", err);
});

// Initialize database tables
async function initializeTables() {
  try {
    const client = await pool.connect();

    // Create shops table
    await client.query(`
      CREATE TABLE IF NOT EXISTS shops (
        id SERIAL PRIMARY KEY,
        shop_url VARCHAR(255) UNIQUE NOT NULL,
        access_token VARCHAR(255) NOT NULL,
        scopes TEXT,
        shop_name VARCHAR(255),
        shop_email VARCHAR(255),
        shop_phone VARCHAR(20),
        shipsy_org_id VARCHAR(255),
        shipsy_api_key VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        installed_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        last_sync TIMESTAMP,
        CONSTRAINT unique_shop_url UNIQUE (shop_url)
      );
    `);

    // Create sync_logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sync_logs (
        id SERIAL PRIMARY KEY,
        shop_url VARCHAR(255) NOT NULL,
        order_id VARCHAR(255),
        shipsy_consignment_id VARCHAR(255),
        status VARCHAR(50),
        sync_type VARCHAR(20),
        error_message TEXT,
        response_data JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (shop_url) REFERENCES shops(shop_url) ON DELETE CASCADE
      );
    `);

    // Create orders table
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        shop_url VARCHAR(255) NOT NULL,
        order_id VARCHAR(255) UNIQUE NOT NULL,
        order_data JSONB,
        sync_status VARCHAR(50),
        shipsy_consignment_id VARCHAR(255),
        tracking_number VARCHAR(255),
        synced_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (shop_url) REFERENCES shops(shop_url) ON DELETE CASCADE,
        CONSTRAINT unique_order UNIQUE (shop_url, order_id)
      );
    `);

    // Create shipments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS shipments (
        id SERIAL PRIMARY KEY,
        shop_url VARCHAR(255) NOT NULL,
        shipsy_consignment_id VARCHAR(255) UNIQUE NOT NULL,
        order_id VARCHAR(255),
        status VARCHAR(50),
        tracking_number VARCHAR(255),
        pickup_location VARCHAR(255),
        delivery_location VARCHAR(255),
        shipment_data JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (shop_url) REFERENCES shops(shop_url) ON DELETE CASCADE
      );
    `);

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_shops_active ON shops(is_active);
      CREATE INDEX IF NOT EXISTS idx_sync_logs_shop ON sync_logs(shop_url);
      CREATE INDEX IF NOT EXISTS idx_sync_logs_created ON sync_logs(created_at);
      CREATE INDEX IF NOT EXISTS idx_orders_shop ON orders(shop_url);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(sync_status);
      CREATE INDEX IF NOT EXISTS idx_shipments_shop ON shipments(shop_url);
      CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
    `);

    client.release();
    logger.info("✅ Database tables initialized successfully");
  } catch (error) {
    logger.error("❌ Error initializing database tables:", error);
    throw error;
  }
}

// Query function
async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (duration > 1000) {
      logger.warn(
        `Slow query detected (${duration}ms): ${text.substring(0, 50)}...`
      );
    }
    return result;
  } catch (error) {
    logger.error("Database query error:", error);
    throw error;
  }
}

// Get single row
async function getOne(text, params) {
  const result = await query(text, params);
  return result.rows[0];
}

// Get all rows
async function getAll(text, params) {
  const result = await query(text, params);
  return result.rows;
}

// Insert and return
async function insertOne(text, params) {
  const result = await query(text, params);
  return result.rows[0];
}

// Get pool for transactions
function getPool() {
  return pool;
}

module.exports = {
  query,
  getOne,
  getAll,
  insertOne,
  getPool,
  initializeTables,
};
