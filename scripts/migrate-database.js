const path = require("path")

// Import database functions
async function runMigration() {
  try {
    console.log("🚀 Starting database migration...")

    // Dynamically import the database module
    const { initializeDatabase } = await import(path.join(process.cwd(), "lib", "database.ts"))

    // Run database initialization
    await initializeDatabase()

    console.log("✅ Database migration completed successfully!")
    process.exit(0)
  } catch (error) {
    console.error("❌ Database migration failed:", error)
    process.exit(1)
  }
}

runMigration()
