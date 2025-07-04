import { NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET() {
  try {
    const result = await query(`
      SELECT * FROM otp_logs 
      ORDER BY sent_at DESC
      LIMIT 100
    `)

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to fetch OTP logs" }, { status: 500 })
  }
}
