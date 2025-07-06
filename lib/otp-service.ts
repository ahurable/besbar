import { db } from "./database";
import { generateOTP, sendSMS, storeOTP, verifyOTP } from "./otp";

export async function sendOTPToPhone(phoneNumber: string): Promise<{ success: boolean; message: string }> {
  try {
    const otpCode = generateOTP();

    // Store OTP in DB with storeOTP (already deletes old OTPs)
    await storeOTP(phoneNumber, otpCode);

    // Send SMS (logs to terminal)
    await sendSMS(phoneNumber, otpCode);

    console.log(`🚀 OTP Generated and Logged:`);
    console.log(`   Phone: ${phoneNumber}`);
    console.log(`   Code: ${otpCode}`);
    console.log(`   Time: ${new Date().toLocaleString("fa-IR")}`);

    return {
      success: true,
      message: "کد تایید با موفقیت ارسال شد",
    };
  } catch (error) {
    console.error("❌ Error in OTP service:", error instanceof Error ? error.message : error);
    return {
      success: false,
      message: "خطا در ارسال کد تایید",
    };
  }
}

export async function verifyOTPCode(
  phoneNumber: string,
  otpCode: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const isValid = await verifyOTP(phoneNumber, otpCode);

    if (isValid) {
      // Update database log (already done inside verifyOTP markOtpStatus, but safe to update here as well)
      await db.query(
        `UPDATE otp_logs 
         SET verified_at = CURRENT_TIMESTAMP, status = 'verified'
         WHERE phone_number = ? AND otp_code = ? AND status = 'sent'`,
        [phoneNumber, otpCode]
      );

      console.log(`✅ OTP Verified Successfully:`);
      console.log(`   Phone: ${phoneNumber}`);
      console.log(`   Code: ${otpCode}`);
      console.log(`   Time: ${new Date().toLocaleString("fa-IR")}`);

      return {
        success: true,
        message: "کد تایید با موفقیت تایید شد",
      };
    } else {
      // Mark as failed if not already done
      await db.query(
        `UPDATE otp_logs 
         SET status = 'failed'
         WHERE phone_number = ? AND otp_code = ? AND status = 'sent'`,
        [phoneNumber, otpCode]
      );

      console.log(`❌ OTP Verification Failed:`);
      console.log(`   Phone: ${phoneNumber}`);
      console.log(`   Code: ${otpCode}`);
      console.log(`   Time: ${new Date().toLocaleString("fa-IR")}`);

      return {
        success: false,
        message: "کد تایید اشتباه یا منقضی شده است",
      };
    }
  } catch (error) {
    console.error("❌ Error in OTP verification:", error instanceof Error ? error.message : error);
    return {
      success: false,
      message: "خطا در تایید کد",
    };
  }
}
