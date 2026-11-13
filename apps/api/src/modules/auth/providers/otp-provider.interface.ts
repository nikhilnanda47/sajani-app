export interface OtpProvider {
  sendOtp(phone: string): Promise<{ otp: string; expiresAt: Date }>;
}

export const OTP_PROVIDER = 'OTP_PROVIDER';
