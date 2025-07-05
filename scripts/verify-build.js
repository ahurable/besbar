const fs = require("fs")
const path = require("path")

console.log("🔍 Verifying build setup...")

// Check if database file exists (for SQLite)
const dbPath = path.join(process.cwd(), "freight.db")
if (fs.existsSync(dbPath)) {
  console.log("✅ SQLite database file found")
} else if (process.env.DB_HOST) {
  console.log("✅ MySQL configuration detected")
} else {
  console.log("ℹ️ No database found - will be created on first run")
}

// Check if Next.js build exists
const buildPath = path.join(process.cwd(), ".next")
if (fs.existsSync(buildPath)) {
  console.log("✅ Next.js build found")
} else {
  console.log("❌ Next.js build not found")
}

console.log("🎉 Build verification completed")
