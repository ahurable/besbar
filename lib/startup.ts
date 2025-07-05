import { initializeDatabase } from "./database"

let isInitialized = false

export async function ensureDatabaseInitialized() {
  if (isInitialized) {
    return true
  }

  try {
    console.log("🚀 Ensuring database is initialized...")
    await initializeDatabase()
    isInitialized = true
    return true
  } catch (error) {
    console.error("❌ Failed to initialize database:", error)
    return false
  }
}

// Auto-initialize in production
if (typeof window === "undefined" && process.env.NODE_ENV === "production") {
  ensureDatabaseInitialized()
}