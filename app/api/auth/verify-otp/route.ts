// Update your database query function's return type
// In your database library file (e.g., lib/database.ts):


// Then in your route file:
import { type NextRequest, NextResponse } from "next/server"
import { verifyOTP } from "@/lib/otp"
import { createSession } from "@/lib/session"
import { query, initializeDatabase } from "@/lib/database"

let dbInitialized = false

export async function POST(request: NextRequest) {
  try {
    if (!dbInitialized) {
      await initializeDatabase()
      dbInitialized = true
    }

    const { phone_number, otp_code } = await request.json()

    if (!phone_number || !otp_code) {
      return NextResponse.json(
        { error: "شماره تلفن و کد تایید الزامی است" }, 
        { status: 400 }
      )
    }

    const isValid = await verifyOTP(phone_number, otp_code)

    if (!isValid) {
      return NextResponse.json(
        { error: "کد تایید اشتباه یا منقضی شده است" }, 
        { status: 400 }
      )
    }

    // Query now returns array directly
    let users = await query(
      "SELECT * FROM users WHERE phone_number = ?", 
      [phone_number]
    )

    let user = users[0] // Access first element directly

    if (!user) {
      await query(
        "INSERT INTO users (phone_number) VALUES (?)",
        [phone_number]
      )
      
      // Get the newly created user
      users = await query(
        "SELECT * FROM users WHERE phone_number = ?",
        [phone_number]
      )
      user = users[0]
    }

    const sessionToken = await createSession(phone_number)

    const response = NextResponse.json({
      success: true,
      message: "کد تایید با موفقیت تایید شد",
      user,
    })

    response.cookies.set("session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60,
      path: "/",
    })

    return response

  } catch (error) {
    console.error("Error in verify-otp API:", error)
    return NextResponse.json(
      { error: "خطا در تایید کد" }, 
      { status: 500 }
    )
  }
}