import { createPool, PoolOptions, RowDataPacket } from 'mysql2/promise';
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

// GET method to retrieve all freight requests
export async function GET() {
  let connection;
  try {
    connection = await pool.getConnection();
    
    // Get all freight requests ordered by creation date (newest first)
    const [requests] = await connection.query<[]>(`
      SELECT * FROM freight_requests 
      ORDER BY created_at DESC
    `);

    return NextResponse.json(requests);
    
  } catch (error) {
    console.error('Failed to fetch freight requests:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve freight requests' },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}

interface UserRow extends RowDataPacket {
  id: number;
  phone_number: string;
}

export async function POST(request: NextRequest) {
  let connection;
  try {
    connection = await pool.getConnection();
    const body = await request.json();
    console.log(body)
    const {
      phone_number,
      source_address,
      source_lat,
      source_lng,
      destination_address,
      destination_lat,
      destination_lng,
      distance_km,
      weight_kg,
      calculated_price,
    } = body
    const [userRows] = await connection.query<UserRow[]>(
      "SELECT id FROM users WHERE phone_number = ? LIMIT 1",
      [phone_number]
    );

    const userId = userRows[0]?.id;
    const [result] = await connection.query(
      `INSERT INTO freight_requests (
        user_id, phone_number, source_address, source_lat, source_lng,
        destination_address, destination_lat, destination_lng,
        distance_km, weight_kg, calculated_price
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        phone_number,
        source_address,
        source_lat,
        source_lng,
        destination_address,
        destination_lat,
        destination_lng,
        distance_km,
        weight_kg,
        calculated_price,
      ])
    // Your route logic here...
    // Get the inserted record separately for MySQL
    const [insertedRequest] = await connection.query(
      "SELECT * FROM freight_requests WHERE id = LAST_INSERT_ID()"
    )
    console.log(insertedRequest)
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