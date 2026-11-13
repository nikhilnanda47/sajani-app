import { Injectable, Logger } from '@nestjs/common';
import { OtpProvider } from './otp-provider.interface';
import { AUTH } from '@sajani/shared';

/**
 * Mock OTP provider for development.
 * Always generates OTP "123456" and logs it to console.
 * Replace with real SMS provider (MSG91/Gupshup) for production.
 */
@Injectable()
export class MockOtpProvider implements OtpProvider {
  private readonly logger = new Logger(MockOtpProvider.name);

  async sendOtp(phone: string): Promise<{ otp: string; expiresAt: Date }> {
    const otp = '123456'; // Fixed OTP for dev
    const expiresAt = new Date(Date.now() + AUTH.OTP_EXPIRY_SECONDS * 1000);

    this.logger.warn(`[MOCK OTP] Phone: ${phone} → OTP: ${otp} (expires: ${expiresAt.toISOString()})`);

    return { otp, expiresAt };
  }
}
