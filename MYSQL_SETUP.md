# MySQL Setup Guide

## For Development (Windows/Mac/Linux)

### Option 1: XAMPP (Easiest for Windows)
1. Download and install [XAMPP](https://www.apachefriends.org/)
2. Start Apache and MySQL from XAMPP Control Panel
3. Open phpMyAdmin (http://localhost/phpmyadmin)
4. Create database: `freight_db`
5. Update `.env.local`:
\`\`\`env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=freight_db
\`\`\`

### Option 2: MySQL Server Direct Install
1. Download [MySQL Server](https://dev.mysql.com/downloads/mysql/)
2. Install and set root password
3. Create database:
\`\`\`sql
CREATE DATABASE freight_db;
\`\`\`
4. Update `.env.local` with your credentials

### Option 3: Docker (Cross-platform)
\`\`\`bash
docker run --name mysql-freight -e MYSQL_ROOT_PASSWORD=password -e MYSQL_DATABASE=freight_db -p 3306:3306 -d mysql:8.0
\`\`\`

## For Production

### Popular MySQL Hosting Services:
- **PlanetScale** (Free tier available)
- **Railway** (MySQL addon)
- **DigitalOcean Managed Databases**
- **AWS RDS**
- **Google Cloud SQL**

### Environment Variables for Production:
\`\`\`env
NODE_ENV=production
DB_HOST=your-mysql-host.com
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=freight_db
\`\`\`

## Testing the Connection

Run this command to test your database connection:
\`\`\`bash
npm run db:init
\`\`\`

If successful, you'll see:
\`\`\`
🐬 Using MySQL database
✅ Database initialized successfully!
