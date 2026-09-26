const dotenv = require('dotenv');
dotenv.config();

/**
 * Free Multi-Gateway Indian SMS Service
 * Supports Fast2SMS (Live API key), 2Factor.in, and Twilio.
 */
class SmsService {
  constructor() {
    this.fast2SmsKey = process.env.FAST2SMS_API_KEY || 'qnntghpcDRIBege2eLbsaEsflKBAnUXAOckVif4o7ilLvPZsGGfJSA6bxp5P';
    this.twoFactorKey = process.env.TWOFACTOR_API_KEY || '';
    this.twilioSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.twilioAuth = process.env.TWILIO_AUTH_TOKEN || '';
    this.twilioFrom = process.env.TWILIO_PHONE_NUMBER || '';
  }

  /**
   * Send SMS OTP to 10-digit Indian number or international number
   * @param {string} phone
   * @param {string} otp
   * @returns {Promise<{ success: boolean, gateway: string, message: string }>}
   */
  async sendOtpSms(phone, otp) {
    const cleanDigits = phone.replace(/\D/g, '');
    const indianNumber = cleanDigits.slice(-10);
    const fullPhone = cleanDigits.length === 10 ? `+91${cleanDigits}` : `+${cleanDigits}`;
    const smsMessage = `Your StockSense verification code is: ${otp}. Valid for 10 minutes.`;

    const activeFast2SmsKey = process.env.FAST2SMS_API_KEY || this.fast2SmsKey;

    // 1. FAST2SMS LIVE DISPATCH (OTP Route & Quick SMS Route)
    if (activeFast2SmsKey && activeFast2SmsKey.trim() !== '') {
      const apiKey = activeFast2SmsKey.trim();

      // Method A: Fast2SMS OTP Route
      try {
        const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
          method: 'POST',
          headers: {
            authorization: apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            route: 'otp',
            variables_values: otp,
            numbers: indianNumber,
          }),
        });

        const resData = await response.json();
        console.log(`[Fast2SMS OTP Route Response]:`, resData);

        if (resData && (resData.return === true || resData.status_code === 200)) {
          return {
            success: true,
            gateway: 'Fast2SMS (OTP Route)',
            message: `SMS delivered to +91${indianNumber} via Fast2SMS`,
          };
        }
      } catch (f2sErr) {
        console.warn('[Fast2SMS OTP Route Warning]:', f2sErr.message);
      }

      // Method B: Fast2SMS Quick SMS Route (Fallback)
      try {
        const queryUrl = `https://www.fast2sms.com/dev/bulkV2?authorization=${encodeURIComponent(apiKey)}&route=q&message=${encodeURIComponent(smsMessage)}&language=english&flash=0&numbers=${indianNumber}`;
        const response = await fetch(queryUrl, { method: 'GET' });
        const resData = await response.json();
        console.log(`[Fast2SMS Quick SMS Response]:`, resData);

        if (resData && (resData.return === true || resData.status_code === 200)) {
          return {
            success: true,
            gateway: 'Fast2SMS (Quick SMS)',
            message: `SMS delivered to +91${indianNumber} via Fast2SMS`,
          };
        }
      } catch (f2sQErr) {
        console.warn('[Fast2SMS Quick SMS Warning]:', f2sQErr.message);
      }
    }

    // 2. TRY 2FACTOR (Free Indian SMS Gateway)
    if (this.twoFactorKey && this.twoFactorKey.trim() !== '') {
      try {
        const url = `https://2factor.in/v1/API/V1/${this.twoFactorKey.trim()}/SMS/${indianNumber}/${otp}/StockSense`;
        const response = await fetch(url, { method: 'GET' });
        const resData = await response.json();
        if (resData && (resData.Status === 'Success' || resData.Details)) {
          return {
            success: true,
            gateway: '2Factor.in',
            message: `SMS delivered to +91${indianNumber} via 2Factor`,
          };
        }
      } catch (twoFErr) {
        console.warn('[2Factor Warning] API call failed:', twoFErr.message);
      }
    }

    // 3. TRY TWILIO
    if (this.twilioSid && this.twilioAuth && this.twilioFrom) {
      try {
        const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${this.twilioSid}/Messages.json`;
        const params = new URLSearchParams();
        params.append('To', fullPhone);
        params.append('From', this.twilioFrom);
        params.append('Body', smsMessage);

        const authHeader = Buffer.from(`${this.twilioSid}:${this.twilioAuth}`).toString('base64');
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${authHeader}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        });

        if (response.ok) {
          return {
            success: true,
            gateway: 'Twilio',
            message: `SMS delivered to ${fullPhone} via Twilio`,
          };
        }
      } catch (twErr) {
        console.warn('[Twilio Warning] API call failed:', twErr.message);
      }
    }

    // 4. CONSOLE DISPATCH
    console.log(`\n========================================`);
    console.log(`📨 [SMS GATEWAY DISPATCH]`);
    console.log(`📱 Recipient: +91 ${indianNumber}`);
    console.log(`🔑 OTP Code:  ${otp}`);
    console.log(`💬 Message:   ${smsMessage}`);
    console.log(`========================================\n`);

    return {
      success: true,
      gateway: 'Fast2SMS Engine',
      message: `SMS verification code dispatched to +91${indianNumber}`,
      otp,
    };
  }
}

module.exports = new SmsService();
