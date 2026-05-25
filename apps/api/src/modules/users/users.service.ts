import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditLogService } from '../../common/audit/audit-log.service';
import { TokenBlacklistService } from '../../common/security/token-blacklist.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditLogService,
    private blacklist: TokenBlacklistService,
  ) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });
    if (!user) throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'المستخدم غير موجود' });
    const { passwordHash, ...safe } = user;
    return safe;
  }

  async updateProfile(userId: string, data: { firstName?: string; lastName?: string; avatar?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true, firstName: true, lastName: true, avatar: true,
        phone: true, email: true, role: true, companyId: true,
      },
    });
  }

  // ─── PDPL: Right to Data Portability ───────────────────────────
  //
  // Returns ALL personal data we hold about the user in a portable JSON form.
  // Excludes other users' data. Sensitive credentials are excluded.
  async exportPersonalData(userId: string, meta: { ip?: string; userAgent?: string } = {}) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: { include: { kycDocuments: true } },
        driverProfile: true,
        notifications: true,
        auditLogs: { take: 200, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!user) throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'المستخدم غير موجود' });

    // Strip secrets before returning
    const { passwordHash, ...safe } = user;

    await this.audit.record({
      userId,
      action: 'pdpl.export',
      resourceType: 'User',
      resourceId: userId,
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
      metadata: { itemCount: Object.keys(safe).length },
    });

    return {
      exportedAt: new Date().toISOString(),
      legalBasis: 'PDPL — Right to Data Portability',
      data: safe,
    };
  }

  // ─── PDPL: Right to Erasure (Right to be Forgotten) ───────────
  //
  // Soft-deletes the user account:
  //   1. Anonymises PII fields (name → "حساب محذوف", email → null, phone → masked).
  //   2. Marks the user inactive — login refused thereafter.
  //   3. Revokes all sessions (Redis blacklist by user cutoff).
  //   4. Records the deletion in the audit log.
  //
  // Records linked to financial/tax obligations (Invoice, Payment, AuditLog)
  // are RETAINED (anonymised) per Saudi tax law (7-year retention).
  async deleteOwnAccount(userId: string, reason: string | undefined, meta: { ip?: string; userAgent?: string } = {}) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'المستخدم غير موجود' });

    // Check for in-flight orders blocking deletion (via the user's company)
    const activeOrders = user.companyId
      ? await this.prisma.order.count({
          where: {
            clientId: user.companyId,
            status: { in: ['PUBLISHED', 'BIDDING', 'ASSIGNED', 'CONFIRMED', 'IN_TRANSIT'] },
          },
        })
      : 0;
    if (activeOrders > 0) {
      throw new BadRequestException({
        code: 'ACTIVE_ORDERS_EXIST',
        message: `لا يمكن حذف الحساب — لديك ${activeOrders} طلب نشط. أكمل أو ألغِ الطلبات أولاً.`,
        details: { activeOrders },
      });
    }

    const maskedPhone = user.phone ? `+966************` : null;
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: 'حساب',
        lastName: 'محذوف',
        email: null,
        phone: `deleted-${userId.slice(0, 8)}@removed.naqla` as never,
        passwordHash: null,
        avatar: null,
        isActive: false,
        isPhoneVerified: false,
        isEmailVerified: false,
      },
    });
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });
    await this.blacklist.revokeAllForUser(userId);

    await this.audit.record({
      userId,
      action: 'pdpl.delete',
      resourceType: 'User',
      resourceId: userId,
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
      metadata: { reason: reason ?? null, maskedPhone, hadEmail: !!user.email },
    });

    return {
      deleted: true,
      message: 'تم حذف حسابك بنجاح. ستحتفظ المنصة بالسجلات المالية لمدة 7 سنوات كما يقتضي النظام السعودي.',
    };
  }
}
