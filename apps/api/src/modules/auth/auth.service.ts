import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Inject,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { OtpProvider, OTP_PROVIDER } from './providers/otp-provider.interface';
import { RequestOtpDto, VerifyOtpDto } from './dto';
import { AUTH } from '@sajani/shared';
import * as crypto from 'crypto';

interface OtpRecord {
  hashedOtp: string;
  expiresAt: Date;
  attempts: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  // In-memory OTP store for dev. Production should use Redis.
  private readonly otpStore = new Map<string, OtpRecord>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(OTP_PROVIDER) private readonly otpProvider: OtpProvider,
  ) {}

  /**
   * Request OTP for a phone number.
   * Rate limiting is handled by ThrottlerGuard at controller level.
   */
  async requestOtp(dto: RequestOtpDto) {
    const { phone } = dto;

    // Check if there's a recent unexpired OTP
    const existing = this.otpStore.get(phone);
    if (existing && existing.expiresAt > new Date()) {
      const secondsLeft = Math.ceil((existing.expiresAt.getTime() - Date.now()) / 1000);
      if (secondsLeft > AUTH.OTP_EXPIRY_SECONDS - 30) {
        // OTP was sent less than 30 seconds ago
        throw new BadRequestException({
          code: 'AUTH_001',
          message: `Please wait ${secondsLeft} seconds before requesting a new OTP`,
        });
      }
    }

    // Send OTP via provider
    const { otp, expiresAt } = await this.otpProvider.sendOtp(phone);

    // Store hashed OTP
    const hashedOtp = this.hashOtp(otp);
    this.otpStore.set(phone, { hashedOtp, expiresAt, attempts: 0 });

    return {
      message: 'OTP sent successfully',
      expiresInSeconds: AUTH.OTP_EXPIRY_SECONDS,
    };
  }

  /**
   * Verify OTP and issue JWT tokens.
   * Creates user if first-time login.
   */
  async verifyOtp(dto: VerifyOtpDto) {
    const { phone, otp } = dto;

    const record = this.otpStore.get(phone);

    if (!record) {
      throw new UnauthorizedException({
        code: 'AUTH_002',
        message: 'OTP expired or not requested. Please request a new OTP.',
      });
    }

    // Check expiry
    if (record.expiresAt < new Date()) {
      this.otpStore.delete(phone);
      throw new UnauthorizedException({
        code: 'AUTH_002',
        message: 'OTP has expired. Please request a new OTP.',
      });
    }

    // Check max attempts (5 per OTP)
    if (record.attempts >= 5) {
      this.otpStore.delete(phone);
      throw new UnauthorizedException({
        code: 'AUTH_004',
        message: 'Too many failed attempts. Please request a new OTP.',
      });
    }

    // Verify OTP
    const hashedInput = this.hashOtp(otp);
    if (hashedInput !== record.hashedOtp) {
      record.attempts++;
      throw new UnauthorizedException({
        code: 'AUTH_003',
        message: 'Invalid OTP. Please try again.',
      });
    }

    // OTP valid — clean up
    this.otpStore.delete(phone);

    // Upsert user (create if new, update verified_at)
    let user = await this.prisma.user.findUnique({ where: { phone } });
    let isNewUser = false;

    if (!user) {
      user = await this.prisma.user.create({
        data: { phone, verifiedAt: new Date() },
      });
      isNewUser = true;
      this.logger.log(`New user created: ${user.id}`);
    } else {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { verifiedAt: new Date() },
      });
    }

    // Check if user is also an admin
    const adminUser = await this.prisma.adminUser.findUnique({ where: { phone } });

    // Issue tokens
    const tokenPayload = {
      sub: user.id,
      phone: user.phone,
      type: adminUser ? 'admin' : 'customer',
      ...(adminUser ? { role: adminUser.role } : {}),
    };

    const accessToken = this.jwtService.sign(tokenPayload, {
      expiresIn: AUTH.ACCESS_TOKEN_EXPIRY,
    });

    const refreshToken = this.jwtService.sign(
      { sub: user.id, type: 'refresh' },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: AUTH.REFRESH_TOKEN_EXPIRY,
      },
    );

    return {
      accessToken,
      refreshToken,
      isNewUser,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        verifiedAt: user.verifiedAt,
        createdAt: user.createdAt,
      },
    };
  }

  /**
   * Refresh access token using a valid refresh token.
   */
  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      if (payload.type !== 'refresh') {
        throw new Error('Not a refresh token');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.status !== 'active') {
        throw new Error('User not found or suspended');
      }

      // Check if admin
      const adminUser = await this.prisma.adminUser.findUnique({
        where: { phone: user.phone },
      });

      const tokenPayload = {
        sub: user.id,
        phone: user.phone,
        type: adminUser ? 'admin' : 'customer',
        ...(adminUser ? { role: adminUser.role } : {}),
      };

      const accessToken = this.jwtService.sign(tokenPayload, {
        expiresIn: AUTH.ACCESS_TOKEN_EXPIRY,
      });

      return { accessToken };
    } catch {
      throw new UnauthorizedException({
        code: 'AUTH_005',
        message: 'Invalid or expired refresh token',
      });
    }
  }

  private hashOtp(otp: string): string {
    return crypto.createHash('sha256').update(otp).digest('hex');
  }
}
