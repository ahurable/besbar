import { type NextRequest, NextResponse } from "next/server"
import { verifyOTP } from "@/lib/otp"
import { createSession } from "@/lib/session"
import { query, initializeDatabase } from "@/lib/database"

// Initialize database on first request
let dbInitialized = false

export async function POST(request: NextRequest) {
  try {
    // Initialize database if not already done
    if (!dbInitialized) {
      await initializeDatabase()
      dbInitialized = true
    }

    const { phone_number, otp_code } = await request.json()

    if (!phone_number || !otp_code) {
      return NextResponse.json({ error: "شماره تلفن و کد تایید الزامی است" }, { status: 400 })
    }

    const isValid = await verifyOTP(phone_number, otp_code)

    if (isValid) {
      // Create or get user
      let userResult = await query("SELECT * FROM users WHERE phone_number = $1", [phone_number])

      if (userResult.rows.length === 0) {
        userResult = await query("INSERT INTO users (phone_number) VALUES ($1) RETURNING *", [phone_number])
      }

      const user = userResult.rows[0]

      // Create session
      const sessionToken = await createSession(phone_number)

      // Create response with session cookie
      const response = NextResponse.json({
        success: true,
        message: "کد تایید با موفقیت تایید شد",
        user,
      })

      // Set session cookie (1 hour expiry)
      response.cookies.set("session_token", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60, // 1 hour
        path: "/",
      })

      return response
    } else {
      return NextResponse.json({ error: "کد تایید اشتباه یا منقضی شده است" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error in verify-otp API:", error)
    return NextResponse.json({ error: "خطا در تایید کد" }, { status: 500 })
  }
}
