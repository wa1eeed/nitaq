import {
  BadRequestException, ConflictException, Injectable, UnauthorizedException,
  ForbiddenException, Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditLogService } from '../../common/audit/audit-log.service';
import { LoginAttemptService } from '../../common/security/login-attempt.service';
import { OtpService } from '../../common/security/otp.service';
import { TokenBlacklistService } from '../../common/security/token-blacklist.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { normalizeSaudiPhone } from '@naqla/shared-utils';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private audit: AuditLogService,
    private attempts: LoginAttemptService,
    private otp: OtpService,
    private blacklist: TokenBlacklistService,
  ) {}

  // ─── Register (Phone-first, email optional) ─────────────────────

  async register(dto: RegisterDto, meta: { ip?: string; userAgent?: string } = {}) {
    if (!(dto.acceptedTerms && dto.acceptedPrivacy && dto.acceptedTransport)) {
      throw new BadRequestException({
        code: 'LEGAL_CONSENT_REQUIRED',
        message: 'يجب الموافقة على شروط الاستخدام، سياسة الخصوصية، وشروط النقل',
      });
    }

    const phone = normalizeSaudiPhone(dto.phone);
    const email = dto.email?.toLowerCase();

    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ phone }, ...(email ? [{ email }] : [])] },
    });
    if (existing) {
      throw new ConflictException({ code: 'USER_EXISTS', message: 'هذا المستخدم مسجل مسبقاً' });
    }

    const passwordHash = await bcrypt.hash(dto.password, Number(process.env.BCRYPT_ROUNDS ?? 12));

    const company = await this.prisma.company.create({
      data: {
        type: dto.companyType,
        nameAr: dto.companyNameAr,
        nameEn: dto.companyNameEn,
        city: dto.city,
        region: dto.region,
        contactPhone: dto.contactPhone,
        // Company.contactEmail is required by the schema. If user didn't provide
        // either an account email or a contact email, synthesize one from the
        // phone — purely structural, no email will ever be sent here.
        contactEmail: dto.contactEmail ?? email ?? `noreply+${phone}@phone.${process.env.APP_DOMAIN ?? 'nqlah.nx.sa'}`,
      },
    });

    const user = await this.prisma.user.create({
      data: {
        phone,
        email: email ?? null,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.companyType === 'CLIENT' ? 'CLIENT_ADMIN' : 'PROVIDER_ADMIN',
        companyId: company.id,
        // The first user of a newly-registered company is the OWNER. The OWNER
        // role is permanent — only invitable members get other roles.
        companyRole: 'OWNER' as never,
        // Phone is not verified yet — user must complete OTP step
        isPhoneVerified: false,
        // Email never receives an OTP. If present, mark unverified for future
        // (optional) magic-link verification.
        isEmailVerified: false,
      },
    });

    // Send phone OTP automatically — this is the canonical verification path
    await this.otp.send(phone);

    await this.audit.record({
      userId: user.id,
      action: 'auth.register',
      resourceType: 'User',
      resourceId: user.id,
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
      metadata: {
        companyType: dto.companyType,
        hasEmail: !!email,
        legalConsent: { terms: true, privacy: true, transport: true },
      },
    });

    return {
      userId: user.id,
      verificationRequired: true,
      verificationChannel: 'sms',
      otpExpiresIn: 600,
    };
  }

  // ─── Login (regular users — phone OR email + password) ──────────

  async login(dto: LoginDto, meta: { ip?: string; userAgent?: string } = {}) {
    const isEmail = dto.phoneOrEmail.includes('@');
    const identifierNormalized = isEmail
      ? dto.phoneOrEmail.toLowerCase()
      : normalizeSaudiPhone(dto.phoneOrEmail);

    // 1) Anti-bruteforce lockout
    const { blocked, resetInSeconds } = await this.attempts.isBlocked('user', identifierNormalized);
    if (blocked) {
      throw new ForbiddenException({
        code: 'LOGIN_LOCKED',
        message: `الحساب موقوف مؤقتاً بسبب محاولات فاشلة. حاول بعد ${Math.ceil(resetInSeconds / 60)} دقيقة.`,
        details: { retryAfter: resetInSeconds },
      });
    }

    const user = await this.prisma.user.findFirst({
      where: isEmail ? { email: identifierNormalized } : { phone: identifierNormalized },
    });

    const recordFailure = async () => {
      const out = await this.attempts.recordFailure('user', identifierNormalized);
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'بيانات الدخول غير صحيحة',
        details: {
          remainingAttempts: out.remainingAttempts,
          locked: out.blocked,
          retryAfter: out.blocked ? out.resetInSeconds : undefined,
        },
      });
    };

    if (!user || !user.passwordHash) {
      await recordFailure();
    }
    const valid = await bcrypt.compare(dto.password, user!.passwordHash!);
    if (!valid) {
      await recordFailure();
    }
    if (!user!.isActive) {
      throw new UnauthorizedException({ code: 'ACCOUNT_INACTIVE', message: 'الحساب موقوف' });
    }
    if (user!.role === 'ADMIN' || user!.role === 'SUPER_ADMIN') {
      // Admins MUST use the dedicated admin endpoint to prevent leaking
      // admin auth via the public user lockout/UI.
      throw new ForbiddenException({
        code: 'USE_ADMIN_LOGIN',
        message: 'حساب الأدمن يستخدم نقطة الدخول الإدارية',
      });
    }

    await this.attempts.clear('user', identifierNormalized);
    await this.prisma.user.update({ where: { id: user!.id }, data: { lastLoginAt: new Date() } });

    await this.audit.record({
      userId: user!.id,
      action: 'auth.login',
      resourceType: 'User',
      resourceId: user!.id,
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
    });

    return this.issueTokens(user!);
  }

  // ─── Refresh (rotation — old token invalidated) ─────────────────

  async refresh(refreshToken: string, meta: { ip?: string; userAgent?: string } = {}) {
    const record = await this.prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!record || record.isRevoked || record.expiresAt < new Date()) {
      // If this is a re-use of a revoked token, that may indicate theft —
      // best practice: revoke ALL of the user's tokens.
      if (record?.isRevoked && record.userId) {
        await this.blacklist.revokeAllForUser(record.userId);
        await this.audit.record({
          userId: record.userId,
          action: 'auth.refresh.replay_detected',
          resourceType: 'RefreshToken',
          resourceId: record.id,
          ipAddress: meta.ip,
          userAgent: meta.userAgent,
        });
      }
      throw new UnauthorizedException({
        code: 'INVALID_REFRESH_TOKEN',
        message: 'رمز التجديد غير صالح',
      });
    }
    const user = await this.prisma.user.findUnique({ where: { id: record.userId } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException({ code: 'ACCOUNT_INACTIVE', message: 'الحساب غير نشط' });
    }

    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { isRevoked: true },
    });
    return this.issueTokens(user, meta);
  }

  // ─── Logout (revokes the current access token + the refresh token) ─

  async logout(refreshToken: string, accessTokenJti?: string, accessTokenExp?: number, meta: { ip?: string; userAgent?: string; userId?: string } = {}) {
    await this.prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { isRevoked: true },
    });
    if (accessTokenJti && accessTokenExp) {
      await this.blacklist.revoke(accessTokenJti, accessTokenExp);
    }
    if (meta.userId) {
      await this.audit.record({
        userId: meta.userId,
        action: 'auth.logout',
        resourceType: 'User',
        resourceId: meta.userId,
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
      });
    }
    return { ok: true };
  }

  // ─── OTP (phone only — never email) ─────────────────────────────

  async sendOtp(phone: string) {
    const normalized = normalizeSaudiPhone(phone);
    return this.otp.send(normalized);
  }

  async verifyOtp(phone: string, code: string) {
    const normalized = normalizeSaudiPhone(phone);
    const ok = await this.otp.verify(normalized, code);
    if (!ok) {
      throw new BadRequestException({
        code: 'INVALID_OTP',
        message: 'رمز التحقق غير صحيح أو منتهي الصلاحية',
      });
    }
    await this.prisma.user.updateMany({
      where: { phone: normalized },
      data: { isPhoneVerified: true },
    });
    return { verified: true };
  }

  // ─── Password reset flow ─────────────────────────────────────────

  async forgotPassword(phone: string) {
    const normalized = normalizeSaudiPhone(phone);
    const user = await this.prisma.user.findUnique({ where: { phone: normalized } });
    if (!user) return { message: 'If this phone is registered, an OTP has been sent' };
    await this.otp.send(normalized);
    return { message: 'OTP sent' };
  }

  async resetPassword(phone: string, otp: string, newPassword: string) {
    const normalized = normalizeSaudiPhone(phone);
    const ok = await this.otp.verify(normalized, otp);
    if (!ok) {
      throw new BadRequestException({
        code: 'INVALID_OTP',
        message: 'رمز التحقق غير صحيح أو منتهي الصلاحية',
      });
    }
    const hash = await bcrypt.hash(newPassword, Number(process.env.BCRYPT_ROUNDS ?? 12));
    const user = await this.prisma.user.update({
      where: { phone: normalized },
      data: { passwordHash: hash },
    });
    // Revoke all existing refresh tokens
    await this.prisma.refreshToken.updateMany({
      where: { userId: user.id },
      data: { isRevoked: true },
    });
    return { message: 'Password reset successfully' };
  }

  // ─── Token issuance ─────────────────────────────────────────────

  private async issueTokens(
    user: {
      id: string; role: string; companyId: string | null;
      companyRole?: string | null;
      phone: string; email: string | null;
      firstName: string; lastName: string;
    },
    _meta: { ip?: string; userAgent?: string } = {},
  ) {
    const jti = randomUUID();
    const accessTTL = process.env.JWT_ACCESS_TTL ?? '15m';
    const refreshTTL = process.env.JWT_REFRESH_TTL ?? '7d';

    const accessToken = await this.jwt.signAsync(
      {
        sub: user.id,
        role: user.role,
        companyId: user.companyId,
        companyRole: user.companyRole ?? null,
        phone: user.phone,
        email: user.email,
        jti,
      },
      { expiresIn: accessTTL },
    );

    const refreshToken = randomUUID() + '.' + randomUUID();
    const ttlDays = Number(refreshTTL.replace(/\D/g, '')) || 7;
    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: parseDurationToSeconds(accessTTL),
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyId: user.companyId,
      },
    };
  }
}

function parseDurationToSeconds(d: string): number {
  const m = d.match(/^(\d+)([smhd])$/);
  if (!m) return 900;
  const n = Number(m[1]);
  const unit = m[2];
  return unit === 's' ? n : unit === 'm' ? n * 60 : unit === 'h' ? n * 3600 : n * 86400;
}
