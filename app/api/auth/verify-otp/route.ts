import { type NextRequest, NextResponse } from "next/server";
import { verifyOTP } from "@/lib/otp";
import { createSession } from "@/lib/session";
import { query, initializeDatabase } from "@/lib/database";

let dbInitialized = false;

export async function POST(request: NextRequest) {
  try {
    if (!dbInitialized) {
      await initializeDatabase();
      dbInitialized = true;
    }

    const { phone_number, otp_code } = await request.json();

    if (!phone_number || !otp_code) {
      return NextResponse.json(
        { error: "شماره تلفن و کد تایید الزامی است" },
        { status: 400 }
      );
    }

    // Verify the OTP first
    const isValid = await verifyOTP(phone_number, otp_code);
    if (!isValid) {
      return NextResponse.json(
        { error: "کد تایید اشتباه یا منقضی شده است" },
        { status: 400 }
      );
    }

    // Check if user already exists
    let users = await query("SELECT * FROM users WHERE phone_number = ?", [
      phone_number,
    ]);
    let user = users[0];

    if (!user) {
      try {
        // Insert user if not exists
        await query("INSERT INTO users (phone_number) VALUES (?)", [
          phone_number,
        ]);
      } catch (insertError: any) {
        // Handle duplicate entry error in case of race conditions
        if (insertError.code === "ER_DUP_ENTRY") {
          // User was inserted by another concurrent request, ignore
        } else {
          throw insertError; // rethrow other errors
        }
      }

      // Fetch the user after insert (or if duplicate caught)
      users = await query("SELECT * FROM users WHERE phone_number = ?", [
        phone_number,
      ]);
      user = users[0];
    }

    // Create a session token
    const sessionToken = await createSession(phone_number);

    const response = NextResponse.json({
      success: true,
      message: "کد تایید با موفقیت تایید شد",
      user,
    });

    // Set session cookie
    response.cookies.set("session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60, // 1 hour
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error in verify-otp API:", error);
    return NextResponse.json({ error: "خطا در تایید کد" }, { status: 500 });
  }
}
