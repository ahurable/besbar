import { type NextRequest, NextResponse } from "next/server"
import { sendOTPToPhone } from "@/lib/otp-service"

export async function POST(request: NextRequest) {
  try {
    const { phone_number } = await request.json()

    if (!phone_number || phone_number.length < 11) {
      return NextResponse.json({ error: "شماره تلفن معتبر نیست" }, { status: 400 })
    }

    const result = await sendOTPToPhone(phone_number)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
      })
    } else {
      return NextResponse.json({ error: result.message }, { status: 500 })
    }
  } catch (error) {
    console.error("Error in send-otp API:", error)
    return NextResponse.json({ error: "خطا در ارسال کد تایید" }, { status: 500 })
  }
}
