import { query } from "./database";

// Type definitions
interface OtpRecord {
  otp_code: string;
  sent_at: string;  // MySQL returns string datetime by default
  status?: 'sent' | 'verified' | 'expired' | 'failed';
}

const OTP_EXPIRATION_MINUTES = 5;
const OTP_LENGTH = 4;
const SMS_API_ENABLED = process.env.SMS_API_KEY !== undefined;

export function generateOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString().padStart(OTP_LENGTH, '0');
}

// Since you don't have getConnection, remove transaction logic here or implement a new way.
// For now, simplify storeOTP to a single insert (you may add transaction support later).
export async function storeOTP(phoneNumber: string, code: string): Promise<void> {
  if (!phoneNumber?.trim() || !code?.trim()) {
    throw new Error('Phone number and OTP code are required');
  }

  const cleanedPhone = phoneNumber.trim();
  const cleanedCode = code.trim();

  // Delete old OTPs
  await query(
    "DELETE FROM otp_logs WHERE phone_number = ? AND status = 'sent'",
    [cleanedPhone]
  );

  // Insert new OTP
  await query(
    `INSERT INTO otp_logs (phone_number, otp_code, status, sent_at) 
     VALUES (?, ?, 'sent', NOW())`,
    [cleanedPhone, cleanedCode]
  );

  // Verify insertion
  const verificationResult = await query(
    "SELECT COUNT(*) as count FROM otp_logs WHERE phone_number = ? AND status = 'sent'",
    [cleanedPhone]
  );

  const count = verificationResult.rows[0]?.count || 0;
  if (count === 0) {
    throw new Error("Failed to verify OTP storage");
  }

  console.log(`🔐 OTP Stored: ${cleanedPhone} -> ${cleanedCode} at ${new Date().toISOString()}`);
}

export async function verifyOTP(phoneNumber: string, code: string): Promise<boolean> {
  if (!phoneNumber?.trim() || !code?.trim()) {
    console.log('❌ Phone number and OTP code are required');
    return false;
  }

  const cleanedPhone = phoneNumber.trim();
  const cleanedCode = code.trim();

  try {
    console.log(`🔍 Verifying OTP for ${cleanedPhone}`);
    console.log(`   Input code: ${cleanedCode}`);

    // Query latest OTP record from database
    const result = await query(
      `SELECT otp_code, sent_at FROM otp_logs 
       WHERE phone_number = ? AND status = 'sent' 
       ORDER BY sent_at DESC 
       LIMIT 1`,
      [cleanedPhone]
    );

    if (!result || !result.rows || result.rows.length === 0) {
      console.log(`❌ No OTP found for ${cleanedPhone}`);
      return false;
    }

    const stored: OtpRecord = result.rows[0];

    if (!stored.otp_code || !stored.sent_at) {
      console.log(`❌ Invalid OTP record format for ${cleanedPhone}`);
      return false;
    }

    console.log(`   Stored code: ${stored.otp_code}`);

    const expirationTime = OTP_EXPIRATION_MINUTES * 60 * 1000;
    const isExpired = Date.now() - new Date(stored.sent_at).getTime() > expirationTime;

    if (isExpired) {
      console.log(`❌ OTP expired for ${cleanedPhone}`);
      await markOtpStatus(cleanedPhone, stored.otp_code, 'expired');
      return false;
    }

    if (cleanedCode !== stored.otp_code.trim()) {
      console.log(`❌ OTP mismatch for ${cleanedPhone}`);
      await markOtpStatus(cleanedPhone, stored.otp_code, 'failed');
      return false;
    }

    console.log(`✅ OTP verified successfully for ${cleanedPhone}`);
    await markOtpStatus(cleanedPhone, stored.otp_code, 'verified');
    return true;
  } catch (error) {
    console.error('OTP verification failed:', error instanceof Error ? error.message : error);
    return false;
  }
}

async function markOtpStatus(phoneNumber: string, code: string, status: OtpRecord['status']): Promise<void> {
  try {
    const queryText = status === 'verified'
      ? `UPDATE otp_logs SET status = ?, verified_at = NOW() 
         WHERE phone_number = ? AND otp_code = ? AND status = 'sent'`
      : `UPDATE otp_logs SET status = ? 
         WHERE phone_number = ? AND otp_code = ? AND status = 'sent'`;

    await query(queryText, [status, phoneNumber, code]);
  } catch (error) {
    console.error(`Error updating OTP status to ${status}:`, error instanceof Error ? error.message : error);
  }
}

export async function sendSMS(phoneNumber: string, message: string): Promise<boolean> {
  if (!phoneNumber?.trim() || !message?.trim()) {
    console.error('❌ Phone number and message are required');
    return false;
  }

  const cleanedPhone = phoneNumber.trim();
  const cleanedMessage = message.trim();

  logSmsRequest(cleanedPhone, cleanedMessage);

  if (!SMS_API_ENABLED) {
    console.log('ℹ️ SMS API is disabled - running in development mode');
    return true;
  }

  try {
    const smsApiKey = process.env.SMS_API_KEY;
    if (!smsApiKey) throw new Error('SMS API key is not configured');

    const response = await fetch('https://api.sms.ir/v1/send/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/plain',
        'x-api-key': smsApiKey
      },
      body: JSON.stringify({
        mobile: cleanedPhone,
        templateId: "158488",
        parameters: [{ name: 'code', value: cleanedMessage }],
      }),
    });

    const result = await response.json();

    if (!response.ok) throw new Error(result.message || `SMS API responded with status ${response.status}`);

    console.log('SMS API response:', result);
    console.log(`✅ SMS sent successfully to ${cleanedPhone}`);
    return true;
  } catch (error) {
    console.error('Failed to send SMS:', error instanceof Error ? error.message : error);
    return false;
  }
}

function logSmsRequest(phoneNumber: string, message: string): void {
  console.log("=".repeat(50));
  console.log("📱 SMS GATEWAY - SENDING MESSAGE");
  console.log("=".repeat(50));
  console.log(`📞 Phone Number: ${phoneNumber}`);
  console.log(`💬 Message: ${message}`);
  console.log(`⏰ Timestamp: ${new Date().toLocaleString("fa-IR")}`);
  console.log("=".repeat(50));
}
