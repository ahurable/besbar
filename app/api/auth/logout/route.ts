import { type NextRequest, NextResponse } from "next/server"
import { deleteSession } from "@/lib/session"

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("session_token")?.value

    if (sessionToken) {
      await deleteSession(sessionToken)
    }

    const response = NextResponse.json({
      success: true,
      message: "با موفقیت خارج شدید",
    })

    // Clear session cookie
    response.cookies.delete("session_token")

    return response
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "خطا در خروج" }, { status: 500 })
  }
}
