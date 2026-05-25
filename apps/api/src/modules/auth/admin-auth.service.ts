import {
  ForbiddenException, Injectable, UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditLogService } from '../../common/audit/audit-log.service';
import { LoginAttemptService } from '../../common/security/login-attempt.service';
import { TokenBlacklistService } from '../../common/security/token-blacklist.service';
import { AdminLoginDto } from './dto/admin-login.dto';

/**
 * Admin auth is intentionally separate from user auth:
 *   - email + password only (NO phone OTP / NO SMS)
 *   - stronger lockout (5 fails → 30 min block)
 *   - only PLATFORM_ADMIN / SUPER_ADMIN roles accepted
 *   - access tokens are scoped to admin role
 *   - all admin logins are audited with IP + UA
 */
@Injectable()
export class AdminAuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private audit: AuditLogService,
    private attempts: LoginAttemptService,
    private blacklist: TokenBlacklistService,
  ) {}

  async login(dto: AdminLoginDto, meta: { ip?: string; userAgent?: string } = {}) {
    const email = dto.email.toLowerCase();

    const { blocked, resetInSeconds } = await this.attempts.isBlocked('admin', email);
    if (blocked) {
      throw new ForbiddenException({
        code: 'ADMIN_LOGIN_LOCKED',
        message: `الحساب موقوف مؤقتاً. حاول بعد ${Math.ceil(resetInSeconds / 60)} دقيقة.`,
        details: { retryAfter: resetInSeconds },
      });
    }

    const user = await this.prisma.user.findUnique({ where: { email } });

    const fail = async () => {
      const out = await this.attempts.recordFailure('admin', email);
      await this.audit.record({
        userId: user?.id ?? null,
        action: 'admin.login.failed',
        resourceType: 'User',
        resourceId: user?.id ?? null,
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
        metadata: { email, locked: out.blocked },
      });
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

    if (!user || !user.passwordHash) await fail();
    if (!(user!.role === 'ADMIN' || user!.role === 'SUPER_ADMIN')) await fail();
    const ok = await bcrypt.compare(dto.password, user!.passwordHash!);
    if (!ok) await fail();
    if (!user!.isActive) {
      throw new UnauthorizedException({ code: 'ACCOUNT_INACTIVE', message: 'الحساب موقوف' });
    }

    await this.attempts.clear('admin', email);
    await this.prisma.user.update({ where: { id: user!.id }, data: { lastLoginAt: new Date() } });

    await this.audit.record({
      userId: user!.id,
      action: 'admin.login.success',
      resourceType: 'User',
      resourceId: user!.id,
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
    });

    return this.issueTokens(user!);
  }

  async logout(jti: string | undefined, exp: number | undefined, userId: string, meta: { ip?: string; userAgent?: string } = {}) {
    if (jti && exp) await this.blacklist.revoke(jti, exp);
    await this.audit.record({
      userId,
      action: 'admin.logout',
      resourceType: 'User',
      resourceId: userId,
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
    });
    return { ok: true };
  }

  private async issueTokens(user: { id: string; role: string; email: string | null; firstName: string; lastName: string }) {
    const jti = randomUUID();
    const accessTTL = process.env.JWT_ACCESS_TTL ?? '15m';
    const refreshTTL = process.env.JWT_REFRESH_TTL ?? '7d';

    const accessToken = await this.jwt.signAsync(
      { sub: user.id, role: user.role, companyId: null, phone: null, email: user.email, jti, isAdmin: true },
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
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
    };
  }
}
