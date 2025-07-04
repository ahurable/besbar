import { type NextRequest, NextResponse } from "next/server"
import { getSessionFromRequest } from "@/lib/session"

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)

    if (session) {
      return NextResponse.json({
        authenticated: true,
        user: {
          id: session.id,
          phone_number: session.phone_number,
        },
      })
    } else {
      return NextResponse.json({
        authenticated: false,
      })
    }
  } catch (error) {
    console.error("Session check error:", error)
    return NextResponse.json(
      {
        authenticated: false,
      },
      { status: 500 },
    )
  }
}
