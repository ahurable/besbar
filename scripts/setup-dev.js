const fs = require("fs")
const path = require("path")

// Create .env.local for development if it doesn't exist
const envPath = path.join(process.cwd(), ".env.local")

if (!fs.existsSync(envPath)) {
  const envContent = `# Development Environment Variables
NODE_ENV=development

# For production, replace with your PostgreSQL URL:
# DATABASE_URL=postgresql://username:password@localhost:5432/freight_db

# Development uses SQLite automatically
`

  fs.writeFileSync(envPath, envContent)
  console.log("✅ Created .env.local for development")
} else {
  console.log("✅ .env.local already exists")
}

console.log("🚀 Development setup complete!")
console.log("📝 To use PostgreSQL in production, set DATABASE_URL environment variable")
