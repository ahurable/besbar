import { type NextRequest, NextResponse } from "next/server"
import { query, initializeDatabase } from "@/lib/database"

// Initialize database on first request
let dbInitialized = false

export async function GET() {
  try {
    if (!dbInitialized) {
      await initializeDatabase()
      dbInitialized = true
    }

    const result = await query(`
      SELECT * FROM freight_requests 
      ORDER BY created_at DESC
    `)

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!dbInitialized) {
      await initializeDatabase()
      dbInitialized = true
    }

    const body = await request.json()

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

    // Insert user if not exists
    await query(
      `INSERT INTO users (phone_number) 
       VALUES ($1) 
       ON CONFLICT (phone_number) DO NOTHING`,
      [phone_number],
    )

    // Get user id
    const userResult = await query("SELECT id FROM users WHERE phone_number = $1", [phone_number])
    const userId = userResult.rows[0].id

    // Insert freight request
    const requestResult = await query(
      `INSERT INTO freight_requests (
        user_id, phone_number, source_address, source_lat, source_lng,
        destination_address, destination_lat, destination_lng,
        distance_km, weight_kg, calculated_price
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
      RETURNING *`,
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
      ],
    )

    return NextResponse.json(requestResult.rows[0], { status: 201 })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to create request" }, { status: 500 })
  }
}
