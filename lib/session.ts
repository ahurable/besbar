import { query } from "./database"
import { cookies } from "next/headers"
import type { NextRequest } from "next/server"
import crypto from "crypto"

export interface SessionUser {
  id: number
  phone_number: string
  session_token: string
}

// Generate a secure session token
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

// Create a new session for user
export async function createSession(phoneNumber: string): Promise<string> {
  const sessionToken = generateSessionToken()
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

  // Get or create user
  const userResult = await query("SELECT id FROM users WHERE phone_number = $1", [phoneNumber])

  let userId: number
  if (userResult.rows.length === 0) {
    // Create new user
    const newUserResult = await query("INSERT INTO users (phone_number) VALUES ($1) RETURNING id", [phoneNumber])
    userId = newUserResult.rows[0].id
  } else {
    userId = userResult.rows[0].id
  }

  // Delete any existing sessions for this user
  await query("DELETE FROM user_sessions WHERE user_id = $1", [userId])

  // Create new session
  await query(
    `INSERT INTO user_sessions (user_id, phone_number, session_token, expires_at) 
     VALUES ($1, $2, $3, $4)`,
    [userId, phoneNumber, sessionToken, expiresAt.toISOString()],
  )

  console.log(`✅ Session created for ${phoneNumber}: ${sessionToken}`)
  return sessionToken
}

// Verify and get session
export async function getSession(sessionToken: string): Promise<SessionUser | null> {
  try {
    const result = await query(
      `SELECT s.id, s.user_id, s.phone_number, s.session_token, s.expires_at, u.id as user_id
       FROM user_sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.session_token = $1 AND s.expires_at > $2`,
      [sessionToken, new Date().toISOString()],
    )

    if (result.rows.length === 0) {
      return null
    }

    const session = result.rows[0]
    return {
      id: session.user_id,
      phone_number: session.phone_number,
      session_token: session.session_token,
    }
  } catch (error) {
    console.error("Session verification error:", error)
    return null
  }
}

// Get session from cookies (server-side)
export async function getSessionFromCookies(): Promise<SessionUser | null> {
  const cookieStore = cookies()
  const sessionToken = cookieStore.get("session_token")?.value

  if (!sessionToken) {
    return null
  }

  return await getSession(sessionToken)
}

// Get session from request (API routes)
export async function getSessionFromRequest(request: NextRequest): Promise<SessionUser | null> {
  const sessionToken = request.cookies.get("session_token")?.value

  if (!sessionToken) {
    return null
  }

  return await getSession(sessionToken)
}

// Delete session (logout)
export async function deleteSession(sessionToken: string): Promise<void> {
  await query("DELETE FROM user_sessions WHERE session_token = $1", [sessionToken])
}

// Clean up expired sessions
export async function cleanupExpiredSessions(): Promise<void> {
  await query("DELETE FROM user_sessions WHERE expires_at < $1", [new Date().toISOString()])
}
