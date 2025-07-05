import { db } from "./database"
import { generateOTP, sendSMS } from "./otp"

export async function sendOTPToPhone(phoneNumber: string): Promise<{ success: boolean; message: string }> {
  try {
    // Generate OTP
    const otpCode = generateOTP()

    // Log OTP to database
    const logStmt = db.prepare(`
      INSERT INTO otp_logs (phone_number, otp_code, status) 
      VALUES (?, ?, 'sent')
    `)
    logStmt.run(phoneNumber, otpCode)

    // Store in memory for verification
    const { storeOTP } = await import("./otp")
    storeOTP(phoneNumber, otpCode)

    // Send SMS (logs to terminal)
    await sendSMS(phoneNumber, otpCode)

    // Log successful send
    console.log(`🚀 OTP Generated and Logged:`)
    console.log(`   Phone: ${phoneNumber}`)
    console.log(`   Code: ${otpCode}`)
    console.log(`   Time: ${new Date().toLocaleString("fa-IR")}`)

    return {
      success: true,
      message: "کد تایید با موفقیت ارسال شد",
    }
  } catch (error) {
    console.error("❌ Error in OTP service:", error)
    return {
      success: false,
      message: "خطا در ارسال کد تایید",
    }
  }
}

export async function verifyOTPCode(
  phoneNumber: string,
  otpCode: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const { verifyOTP } = await import("./otp")
    const isValid = verifyOTP(phoneNumber, otpCode)

    if (isValid) {
      // Update database log
      const updateStmt = db.prepare(`
        UPDATE otp_logs 
        SET verified_at = CURRENT_TIMESTAMP, status = 'verified'
        WHERE phone_number = ? AND otp_code = ? AND status = 'sent'
      `)
      updateStmt.run(phoneNumber, otpCode)

      console.log(`✅ OTP Verified Successfully:`)
      console.log(`   Phone: ${phoneNumber}`)
      console.log(`   Code: ${otpCode}`)
      console.log(`   Time: ${new Date().toLocaleString("fa-IR")}`)

      return {
        success: true,
        message: "کد تایید با موفقیت تایید شد",
      }
    } else {
      // Log failed attempt
      const updateStmt = db.prepare(`
        UPDATE otp_logs 
        SET status = 'failed'
        WHERE phone_number = ? AND otp_code = ? AND status = 'sent'
      `)
      updateStmt.run(phoneNumber, otpCode)

      console.log(`❌ OTP Verification Failed:`)
      console.log(`   Phone: ${phoneNumber}`)
      console.log(`   Code: ${otpCode}`)
      console.log(`   Time: ${new Date().toLocaleString("fa-IR")}`)

      return {
        success: false,
        message: "کد تایید اشتباه یا منقضی شده است",
      }
    }
  } catch (error) {
    console.error("❌ Error in OTP verification:", error)
    return {
      success: false,
      message: "خطا در تایید کد",
    }
  }
}
