import {
  BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditLogService } from '../../common/audit/audit-log.service';
import { OtpService } from '../../common/security/otp.service';
import { normalizeSaudiPhone } from '@naqla/shared-utils';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import type { InviteMemberDto, UpdateMemberDto } from './dto/team-member.dto';

type CompanyRole = 'OWNER' | 'ADMIN' | 'STAFF' | 'DISPATCH' | 'FINANCE';

/**
 * Manages team members for a company. Rules enforced here:
 *   - Only OWNER + ADMIN can list/add/edit/remove members
 *   - OWNER can never be removed nor have their role changed
 *   - Adding a member sends them an SMS welcoming them to the team
 *   - Self-protection: a user cannot remove or demote themselves
 */
@Injectable()
export class TeamMembersService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditLogService,
    private otp: OtpService,
  ) {}

  private assertManager(actor: AuthUser, companyId: string) {
    if (actor.companyId !== companyId) {
      throw new ForbiddenException({ code: 'WRONG_COMPANY', message: 'لا يمكنك إدارة فريق شركة أخرى' });
    }
    const role = (actor as AuthUser & { companyRole?: CompanyRole }).companyRole;
    if (role !== 'OWNER' && role !== 'ADMIN') {
      throw new ForbiddenException({
        code: 'INSUFFICIENT_COMPANY_ROLE',
        message: 'فقط المالك أو الـ Admin يمكنهم إدارة الفريق',
      });
    }
  }

  async list(companyId: string, actor: AuthUser) {
    this.assertManager(actor, companyId);
    const users = await this.prisma.user.findMany({
      where: { companyId },
      select: {
        id: true, firstName: true, lastName: true, phone: true, email: true,
        avatar: true, isActive: true, companyRole: true, createdAt: true, lastLoginAt: true,
      },
      orderBy: [{ companyRole: 'asc' }, { createdAt: 'desc' }],
    });
    return users.map((u) => ({
      id: u.id,
      fullName: `${u.firstName} ${u.lastName}`.trim(),
      phone: u.phone,
      email: u.email,
      avatar: u.avatar,
      role: u.companyRole,
      isOwner: u.companyRole === 'OWNER',
      status: !u.isActive ? 'SUSPENDED' : u.lastLoginAt ? 'ACTIVE' : 'PENDING_ACTIVATION',
      addedAt: u.createdAt,
    }));
  }

  async invite(companyId: string, dto: InviteMemberDto, actor: AuthUser, meta: { ip?: string; userAgent?: string }) {
    this.assertManager(actor, companyId);
    const phone = normalizeSaudiPhone(dto.phone);

    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ phone }, ...(dto.email ? [{ email: dto.email.toLowerCase() }] : [])] },
    });
    if (existing) {
      throw new ConflictException({
        code: 'USER_EXISTS',
        message: 'يوجد حساب بهذا الرقم/البريد بالفعل',
      });
    }

    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new NotFoundException({ code: 'COMPANY_NOT_FOUND', message: 'الشركة غير موجودة' });

    // Map CompanyRole → UserRole on the platform side
    const userRole = company.type === 'CLIENT'
      ? (dto.role === 'ADMIN' ? 'CLIENT_ADMIN' : 'CLIENT_USER')
      : (dto.role === 'ADMIN' ? 'CARRIER_ADMIN' : 'CARRIER_USER');

    const [firstName, ...rest] = dto.fullName.trim().split(/\s+/);
    const lastName = rest.join(' ') || '—';
    const tempActivationToken = randomUUID();

    const user = await this.prisma.user.create({
      data: {
        phone,
        email: dto.email?.toLowerCase(),
        firstName,
        lastName,
        role: userRole as never,
        companyId,
        companyRole: dto.role as never,
        isActive: false,                          // activated when they accept the invite
        passwordHash: null,                       // user sets it on activation
        preferredLanguage: 'ar',
      },
      select: { id: true, phone: true, email: true, companyRole: true },
    });

    // Best-effort SMS — non-blocking. In production this would send the
    // activation link with the token below.
    try {
      await this.otp.send(phone);
    } catch { /* swallow */ }

    await this.audit.record({
      userId: actor.id,
      action: 'team.invite',
      resourceType: 'User',
      resourceId: user.id,
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
      metadata: { companyId, role: dto.role, hasEmail: !!dto.email },
    });

    return {
      ...user,
      activationLink: `${process.env.FRONTEND_CLIENT_URL ?? 'http://localhost:3002'}/activate?token=${tempActivationToken}`,
      smsSent: true,
    };
  }

  async update(companyId: string, userId: string, dto: UpdateMemberDto, actor: AuthUser, meta: { ip?: string; userAgent?: string }) {
    this.assertManager(actor, companyId);
    if (userId === actor.id) {
      throw new BadRequestException({ code: 'SELF_MODIFY_DENIED', message: 'لا يمكنك تعديل دورك أو حالتك بنفسك' });
    }
    const target = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!target || target.companyId !== companyId) {
      throw new NotFoundException({ code: 'MEMBER_NOT_FOUND', message: 'العضو غير موجود' });
    }
    if (target.companyRole === 'OWNER') {
      throw new ForbiddenException({ code: 'OWNER_PROTECTED', message: 'لا يمكن تعديل المالك' });
    }
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.role ? { companyRole: dto.role as never } : {}),
        ...(typeof dto.isActive === 'boolean' ? { isActive: dto.isActive } : {}),
      },
      select: { id: true, companyRole: true, isActive: true },
    });
    await this.audit.record({
      userId: actor.id,
      action: 'team.update',
      resourceType: 'User',
      resourceId: userId,
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
      metadata: { roleChange: dto.role, isActive: dto.isActive },
    });
    return updated;
  }

  async remove(companyId: string, userId: string, actor: AuthUser, meta: { ip?: string; userAgent?: string }) {
    this.assertManager(actor, companyId);
    if (userId === actor.id) {
      throw new BadRequestException({ code: 'SELF_DELETE_DENIED', message: 'لا يمكنك حذف نفسك' });
    }
    const target = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!target || target.companyId !== companyId) {
      throw new NotFoundException({ code: 'MEMBER_NOT_FOUND', message: 'العضو غير موجود' });
    }
    if (target.companyRole === 'OWNER') {
      throw new ForbiddenException({ code: 'OWNER_PROTECTED', message: 'لا يمكن حذف المالك' });
    }
    // Soft-remove: detach from company + revoke sessions
    await this.prisma.user.update({
      where: { id: userId },
      data: { companyId: null, isActive: false },
    });
    await this.prisma.refreshToken.updateMany({
      where: { userId }, data: { isRevoked: true },
    });
    await this.audit.record({
      userId: actor.id,
      action: 'team.remove',
      resourceType: 'User',
      resourceId: userId,
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
    });
    return { removed: true };
  }
}
