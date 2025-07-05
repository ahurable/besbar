const fs = require("fs")
const path = require("path")

// Create .env.local for development if it doesn't exist
const envPath = path.join(process.cwd(), ".env.local")

if (!fs.existsSync(envPath)) {
  const envContent = `# Development Environment Variables
NODE_ENV=development

# MySQL Database Configuration (for production)
# Uncomment and configure these when you want to use MySQL:
# DB_HOST=localhost
# DB_PORT=3306
# DB_USER=root
# DB_PASSWORD=your_password
# DB_NAME=freight_db

# Development uses SQLite automatically when MySQL config is not provided
`

  fs.writeFileSync(envPath, envContent)
  console.log("✅ Created .env.local for development")
} else {
  console.log("✅ .env.local already exists")
}

console.log("🚀 Development setup complete!")
console.log("")
console.log("📝 Next Steps:")
console.log("  1. Run 'npm run db:migrate' to set up database")
console.log("  2. Run 'npm run dev' to start development server")
console.log("  3. Run 'npm run build' to build for production")
console.log("")
console.log("🗃️ Database Modes:")
console.log("  • Development: SQLite (automatic, no setup needed)")
console.log("  • Production: MySQL (configure environment variables)")
console.log("")
console.log("🔧 Build Process:")
console.log("  • 'npm run build' automatically migrates database")
console.log("  • Database tables created before Next.js build")
console.log("  • Ready for deployment after successful build")
