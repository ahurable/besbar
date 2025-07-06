import { createPool, PoolOptions } from 'mysql2/promise';
import { type NextRequest, NextResponse } from "next/server";

// Properly typed pool configuration
const poolConfig: PoolOptions = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000, // 10 seconds
};

const pool = createPool(poolConfig);

// Connection test function
async function testConnection() {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.ping();
    console.log('✅ Database connection established');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

// Initialize during application startup
testConnection().catch(error => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});

export async function POST(request: NextRequest) {
  let connection;
  try {
    connection = await pool.getConnection();
    const body = await request.json();
    
    // Your route logic here...
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Database operation failed' },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}