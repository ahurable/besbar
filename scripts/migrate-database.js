const { initializeDatabase } = require("./database")

async function runMigration() {
  try {
    console.log("🚀 Starting database migration...")
    await initializeDatabase()
    console.log("✅ Database migration completed successfully!")
    process.exit(0)
  } catch (error) {
    console.error("❌ Database migration failed:", error.message)
    process.exit(1)
  }
}

runMigration()