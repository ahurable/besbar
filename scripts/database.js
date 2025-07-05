const mysql = require("mysql2/promise")
const Database = require("better-sqlite3")
const path = require("path")

// Database abstraction layer
class MySQLAdapter {
  constructor() {
    this.pool = mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      port: Number.parseInt(process.env.DB_PORT || "3306"),
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "freight_db",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      timezone: "+00:00",
      acquireTimeout: 60000,
      timeout: 60000,
    })
  }

  async testConnection() {
    try {
      const connection = await this.pool.getConnection()
      await connection.ping()
      connection.release()
      console.log("✅ MySQL connection successful")
      return true
    } catch (error) {
      console.error("❌ MySQL connection failed:", error.message)
      return false
    }
  }

  async query(text, params = []) {
    // Convert PostgreSQL-style parameters ($1, $2) to MySQL-style (?)
    const mysqlQuery = text.replace(/\$(\d+)/g, "?")

    try {
      const [rows] = await this.pool.execute(mysqlQuery, params)
      return { rows: Array.isArray(rows) ? rows : [rows] }
    } catch (error) {
      console.error("MySQL query error:", error.message)
      console.error("Query:", mysqlQuery)
      console.error("Params:", params)
      throw error
    }
  }

  async close() {
    await this.pool.end()
  }
}

class SQLiteAdapter {
  constructor() {
    const dbPath = path.join(process.cwd(), "freight.db")
    this.db = new Database(dbPath)
    console.log(`📁 SQLite database path: ${dbPath}`)
  }

  async testConnection() {
    try {
      this.db.prepare("SELECT 1").get()
      console.log("✅ SQLite connection successful")
      return true
    } catch (error) {
      console.error("❌ SQLite connection failed:", error.message)
      return false
    }
  }

  async query(text, params = []) {
    // Convert PostgreSQL syntax to SQLite
    const sqliteQuery = text
      .replace(/\$(\d+)/g, "?") // Replace $1, $2, etc. with ?
      .replace(/SERIAL PRIMARY KEY/g, "INTEGER PRIMARY KEY AUTOINCREMENT")
      .replace(/AUTO_INCREMENT PRIMARY KEY/g, "INTEGER PRIMARY KEY AUTOINCREMENT")
      .replace(/INT AUTO_INCREMENT PRIMARY KEY/g, "INTEGER PRIMARY KEY AUTOINCREMENT")
      .replace(/TIMESTAMP WITH TIME ZONE/g, "DATETIME")
      .replace(/TIMESTAMP/g, "DATETIME")
      .replace(/NOW$$$$/g, "datetime('now')")
      .replace(/CURRENT_TIMESTAMP/g, "datetime('now')")

    try {
      if (sqliteQuery.trim().toUpperCase().startsWith("SELECT")) {
        const stmt = this.db.prepare(sqliteQuery)
        const rows = params.length > 0 ? stmt.all(...params) : stmt.all()
        return { rows: Array.isArray(rows) ? rows : [rows] }
      } else if (sqliteQuery.trim().toUpperCase().startsWith("INSERT")) {
        const stmt = this.db.prepare(sqliteQuery.replace(/RETURNING \*/g, ""))
        const result = params.length > 0 ? stmt.run(...params) : stmt.run()
        return { rows: [{ id: result.lastInsertRowid, changes: result.changes }] }
      } else {
        const stmt = this.db.prepare(sqliteQuery)
        const result = params.length > 0 ? stmt.run(...params) : stmt.run()
        return { rows: [{ changes: result.changes }] }
      }
    } catch (error) {
      console.error("SQLite query error:", error.message)
      console.error("Query:", sqliteQuery)
      console.error("Params:", params)
      throw error
    }
  }

  async close() {
    this.db.close()
  }
}

// Create database instance based on environment
function createDatabase() {
  if (process.env.DB_HOST || (process.env.NODE_ENV === "production" && process.env.DB_NAME)) {
    console.log("🐬 Using MySQL database")
    return new MySQLAdapter()
  } else {
    console.log("🗃️ Using SQLite database for development")
    return new SQLiteAdapter()
  }
}

// Initialize database tables
async function initializeDatabase() {
  const db = createDatabase()

  try {
    console.log("🔧 Initializing database...")

    // Test connection first
    const isConnected = await db.testConnection()
    if (!isConnected) {
      throw new Error("Database connection failed")
    }

    // Create users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        phone_number VARCHAR(15) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log("✅ Users table ready")

    // Create freight_requests table
    await db.query(`
      CREATE TABLE IF NOT EXISTS freight_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        phone_number VARCHAR(15) NOT NULL,
        source_address TEXT NOT NULL,
        source_lat DECIMAL(10, 8) NOT NULL,
        source_lng DECIMAL(11, 8) NOT NULL,
        destination_address TEXT NOT NULL,
        destination_lat DECIMAL(10, 8) NOT NULL,
        destination_lng DECIMAL(11, 8) NOT NULL,
        distance_km DECIMAL(8, 2) NOT NULL,
        weight_kg DECIMAL(8, 2) NOT NULL,
        calculated_price DECIMAL(10, 2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `)
    console.log("✅ Freight requests table ready")

    // Create admin_users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log("✅ Admin users table ready")

    // Create otp_logs table
    await db.query(`
      CREATE TABLE IF NOT EXISTS otp_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        phone_number VARCHAR(15) NOT NULL,
        otp_code VARCHAR(10) NOT NULL,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        verified_at TIMESTAMP NULL,
        status VARCHAR(20) DEFAULT 'sent'
      )
    `)
    console.log("✅ OTP logs table ready")

    // Create user_sessions table for session management
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        phone_number VARCHAR(15) NOT NULL,
        session_token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `)
    console.log("✅ User sessions table ready")

    // Insert default admin user if not exists
    const adminResult = await db.query("SELECT COUNT(*) as count FROM admin_users WHERE username = $1", ["admin"])
    const adminCount = adminResult.rows[0].count || adminResult.rows[0]["COUNT(*)"]

    if (Number.parseInt(adminCount) === 0) {
      await db.query("INSERT INTO admin_users (username, password_hash) VALUES ($1, $2)", ["admin", "admin123"])
      console.log("✅ Default admin user created")
    } else {
      console.log("✅ Default admin user already exists")
    }

    console.log("🎉 Database initialization completed successfully!")
    await db.close()
    return true
  } catch (error) {
    console.error("❌ Database initialization error:", error.message)
    await db.close()
    throw error
  }
}

module.exports = { initializeDatabase }
