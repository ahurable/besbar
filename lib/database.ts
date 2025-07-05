import mysql from "mysql2/promise"
import Database from "better-sqlite3"
import path from "path"

// Database abstraction layer
interface DatabaseAdapter {
  query(text: string, params?: any[]): Promise<{ rows: any[] }>
  close(): Promise<void>
}

class MySQLAdapter implements DatabaseAdapter {
  private pool: mysql.Pool

  constructor() {
    this.pool = mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      port: Number.parseInt(process.env.DB_PORT || "3306"),
      user: process.env.DB_USER || "root",
      // password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "freight_db",
      password: process.env.DB_PASSWORD,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      timezone: "+00:00",
    })
  }

  async query(text: string, params?: any[]) {
    // Convert PostgreSQL-style parameters ($1, $2) to MySQL-style (?)
    const mysqlQuery = text.replace(/\$(\d+)/g, "?")

    try {
      const [rows] = await this.pool.execute(mysqlQuery, params)
      return { rows: Array.isArray(rows) ? rows : [rows] }
    } catch (error) {
      console.error("MySQL query error:", error)
      console.error("Query:", mysqlQuery)
      console.error("Params:", params)
      throw error
    }
  }

  async close() {
    await this.pool.end()
  }
}

class SQLiteAdapter implements DatabaseAdapter {
  private db: Database.Database

  constructor() {
    const dbPath = path.join(process.cwd(), "freight.db")
    this.db = new Database(dbPath)
  }

  async query(text: string, params?: any[]) {
    // Convert PostgreSQL syntax to SQLite
    const sqliteQuery = text
      .replace(/\$(\d+)/g, "?") // Replace $1, $2, etc. with ?
      .replace(/SERIAL PRIMARY KEY/g, "INTEGER PRIMARY KEY AUTOINCREMENT")
      .replace(/AUTO_INCREMENT PRIMARY KEY/g, "INTEGER PRIMARY KEY AUTOINCREMENT")
      .replace(/TIMESTAMP WITH TIME ZONE/g, "DATETIME")
      .replace(/TIMESTAMP/g, "DATETIME")
      .replace(/NOW$$$$/g, "datetime('now')")
      .replace(/CURRENT_TIMESTAMP/g, "datetime('now')")

    try {
      if (sqliteQuery.trim().toUpperCase().startsWith("SELECT")) {
        const stmt = this.db.prepare(sqliteQuery)
        const rows = params ? stmt.all(...params) : stmt.all()
        return { rows: Array.isArray(rows) ? rows : [rows] }
      } else if (sqliteQuery.trim().toUpperCase().startsWith("INSERT")) {
        const stmt = this.db.prepare(sqliteQuery.replace(/RETURNING \*/g, ""))
        const result = params ? stmt.run(...params) : stmt.run()

        // For INSERT with RETURNING, get the inserted row
        if (text.includes("RETURNING")) {
          const tableName = sqliteQuery.match(/INSERT INTO (\w+)/)?.[1]
          if (tableName && result.lastInsertRowid) {
            const selectStmt = this.db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`)
            const row = selectStmt.get(result.lastInsertRowid)
            return { rows: [row] }
          }
        }
        return { rows: [{ id: result.lastInsertRowid, changes: result.changes }] }
      } else {
        const stmt = this.db.prepare(sqliteQuery)
        const result = params ? stmt.run(...params) : stmt.run()
        return { rows: [{ changes: result.changes }] }
      }
    } catch (error) {
      console.error("SQLite query error:", error)
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
const createDatabase = (): DatabaseAdapter => {
  // console.log(`The Db Host is : ${process.env.MODE}`)
  if (process.env.DB_HOST || process.env.MODE === "production") {
    console.log("🐬 Using MySQL database")
    return new MySQLAdapter()
  } else {
    console.log("🗃️ Using SQLite database for development")
    return new SQLiteAdapter()
  }
}

const db = createDatabase()

// Initialize database tables
export async function initializeDatabase() {
  try {
    console.log("Initializing database...")

    // Create users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        phone_number VARCHAR(15) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

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

    // Create admin_users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

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

    // Insert default admin user if not exists
    const adminResult = await db.query("SELECT COUNT(*) as count FROM admin_users WHERE username = $1", ["admin"])
    const adminCount = adminResult.rows[0].count || adminResult.rows[0]["COUNT(*)"]

    if (Number.parseInt(adminCount) === 0) {
      await db.query("INSERT INTO admin_users (username, password_hash) VALUES ($1, $2)", ["admin", "admin123"])
      console.log("✅ Default admin user created")
    }

    console.log("✅ Database initialized successfully!")
  } catch (error) {
    console.error("❌ Database initialization error:", error)
    throw error
  }
}

// Database query helper
export async function query(text: string, params?: any[]) {
  try {
    return await db.query(text, params)
  } catch (error) {
    console.error("Database query error:", error)
    throw error
  }
}

export type FreightRequest = {
  id: number
  user_id?: number
  phone_number: string
  source_address: string
  source_lat: number
  source_lng: number
  destination_address: string
  destination_lat: number
  destination_lng: number
  distance_km: number
  weight_kg: number
  calculated_price: number
  status: string
  created_at: string
}

export type User = {
  id: number
  phone_number: string
  created_at: string
}

export type UserSession = {
  id: number
  user_id: number
  phone_number: string
  session_token: string
  expires_at: string
  created_at: string
}

export { db }
