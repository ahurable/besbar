import { query } from "./database"

export function generateOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

export async function storeOTP(phoneNumber: string, code: string): Promise<void> {
  // Delete any existing OTP for this phone number
  await query("DELETE FROM otp_logs WHERE phone_number = $1 AND status = 'sent'", [phoneNumber])

  // Insert new OTP
  await query(
    `INSERT INTO otp_logs (phone_number, otp_code, status) 
     VALUES ($1, $2, 'sent')`,
    [phoneNumber, code],
  )

  console.log(`🔐 OTP Stored in database: ${phoneNumber} -> ${code} (expires in 5 min)`)
}

export async function verifyOTP(phoneNumber: string, code: string): Promise<boolean> {
  console.log(`🔍 Verifying OTP for ${phoneNumber}:`)
  console.log(`   Input code: ${code}`)

  // Get the most recent OTP for this phone number
  const result = await query(
    `SELECT otp_code, sent_at FROM otp_logs 
     WHERE phone_number = $1 AND status = 'sent' 
     ORDER BY sent_at DESC 
     LIMIT 1`,
    [phoneNumber],
  )

  if (result.rows.length === 0) {
    console.log(`❌ No OTP found for ${phoneNumber}`)
    return false
  }

  const stored = result.rows[0]
  console.log(`   Stored code: ${stored.otp_code}`)

  // Check if OTP is expired (5 minutes)
  const sentTime = new Date(stored.sent_at).getTime()
  const now = Date.now()
  const fiveMinutes = 5 * 60 * 1000

  if (now - sentTime > fiveMinutes) {
    console.log(`❌ OTP expired for ${phoneNumber}`)
    // Mark as expired
    await query(
      `UPDATE otp_logs 
       SET status = 'expired' 
       WHERE phone_number = $1 AND otp_code = $2 AND status = 'sent'`,
      [phoneNumber, stored.otp_code],
    )
    return false
  }

  // Trim whitespace and compare as strings
  const inputCode = code.toString().trim()
  const storedCode = stored.otp_code.toString().trim()

  if (inputCode === storedCode) {
    console.log(`✅ OTP verified successfully for ${phoneNumber}`)
    // Mark as verified
    await query(
      `UPDATE otp_logs 
       SET status = 'verified', verified_at = NOW() 
       WHERE phone_number = $1 AND otp_code = $2 AND status = 'sent'`,
      [phoneNumber, stored.otp_code],
    )
    return true
  }

  console.log(`❌ OTP mismatch for ${phoneNumber}: '${inputCode}' !== '${storedCode}'`)
  // Mark as failed
  await query(
    `UPDATE otp_logs 
     SET status = 'failed' 
     WHERE phone_number = $1 AND otp_code = $2 AND status = 'sent'`,
    [phoneNumber, stored.otp_code],
  )
  return false
}

export function sendSMS(phoneNumber: string, message: string): Promise<boolean> {
  // Log to terminal (simulating SMS gateway)
  console.log("=".repeat(50))
  console.log("📱 SMS GATEWAY - SENDING MESSAGE")
  console.log("=".repeat(50))
  console.log(`📞 Phone Number: ${phoneNumber}`)
  console.log(`💬 Message: ${message}`)
  console.log(`⏰ Timestamp: ${new Date().toLocaleString("fa-IR")}`)
  console.log("=".repeat(50))

  // Simulate network delay
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`✅ SMS sent successfully to ${phoneNumber}`)
      resolve(true)
    }, 1000)
  })
}
