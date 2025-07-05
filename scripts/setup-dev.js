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
console.log("📝 Database Configuration:")
console.log("  • Development: Uses SQLite automatically (no setup needed)")
console.log("  • Production: Set MySQL environment variables in .env.local:")
console.log("    - DB_HOST=your_mysql_host")
console.log("    - DB_PORT=3306")
console.log("    - DB_USER=your_username")
console.log("    - DB_PASSWORD=your_password")
console.log("    - DB_NAME=freight_db")
console.log("")
console.log("🐬 MySQL Setup Instructions:")
console.log("  1. Install MySQL Server")
console.log("  2. Create database: CREATE DATABASE freight_db;")
console.log("  3. Update .env.local with your MySQL credentials")
console.log("  4. Run: npm run db:init")
