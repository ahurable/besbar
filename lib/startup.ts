import { initializeDatabase } from "./database"

let isInitialized = false
let initializationPromise: Promise<boolean> | null = null

export async function ensureDatabaseInitialized(): Promise<boolean> {
  if (isInitialized) {
    return true
  }

  // If initialization is already in progress, wait for it
  if (initializationPromise) {
    return await initializationPromise
  }

  // Start initialization
  initializationPromise = (async () => {
    try {
      console.log("🚀 Ensuring database is initialized...")
      await initializeDatabase()
      isInitialized = true
      console.log("✅ Database initialization completed")
      return true
    } catch (error) {
      console.error("❌ Failed to initialize database:", error)
      return false
    } finally {
      initializationPromise = null
    }
  })()

  return await initializationPromise
}

// Reset initialization state (useful for testing)
export function resetInitializationState() {
  isInitialized = false
  initializationPromise = null
}
