const Database = require("better-sqlite3")
const path = require("path")

const dbPath = path.join(process.cwd(), "freight.db")
const db = new Database(dbPath)

console.log("Initializing SQLite database...")

// Create users table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone_number TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

// Create freight_requests table
db.exec(`
  CREATE TABLE IF NOT EXISTS freight_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    phone_number TEXT NOT NULL,
    source_address TEXT NOT NULL,
    source_lat REAL NOT NULL,
    source_lng REAL NOT NULL,
    destination_address TEXT NOT NULL,
    destination_lat REAL NOT NULL,
    destination_lng REAL NOT NULL,
    distance_km REAL NOT NULL,
    weight_kg REAL NOT NULL,
    calculated_price REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )
`)

// Create admin_users table
db.exec(`
  CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

// Add this after the admin_users table creation
db.exec(`
  CREATE TABLE IF NOT EXISTS otp_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone_number TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    verified_at DATETIME,
    status TEXT DEFAULT 'sent'
  )
`)

// Insert default admin user
const adminExists = db.prepare("SELECT COUNT(*) as count FROM admin_users WHERE username = ?").get("admin")
if (adminExists.count === 0) {
  db.prepare("INSERT INTO admin_users (username, password_hash) VALUES (?, ?)").run("admin", "admin123")
  console.log("Default admin user created")
}

console.log("Database initialized successfully!")
console.log("Tables created:")
console.log("- users")
console.log("- freight_requests")
console.log("- admin_users")
console.log("- otp_logs")

db.close()
