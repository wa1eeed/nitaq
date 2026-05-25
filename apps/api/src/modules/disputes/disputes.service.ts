import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import type { AuthUser } from '../../common/decorators/current-user.decorator';

interface CreateInput {
  orderId: string;
  reason: string;
  description: string;
  attachments?: string[];
}

@Injectable()
export class DisputesService {
  constructor(private prisma: PrismaService) {}

  /** List disputes the caller is allowed to see — own company's orders only. */
  async listForActor(actor: AuthUser) {
    if (actor.role === 'ADMIN' || actor.role === 'SUPER_ADMIN') {
      return this.prisma.dispute.findMany({
        orderBy: { createdAt: 'desc' },
        include: { order: { select: { orderNumber: true, clientId: true, carrierId: true } } },
      });
    }
    if (!actor.companyId) return [];
    return this.prisma.dispute.findMany({
      where: {
        order: { OR: [{ clientId: actor.companyId }, { carrierId: actor.companyId }] },
      },
      orderBy: { createdAt: 'desc' },
      include: { order: { select: { orderNumber: true, clientId: true, carrierId: true } } },
    });
  }

  async findByIdForActor(id: string, actor: AuthUser) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id },
      include: { order: { select: { orderNumber: true, clientId: true, carrierId: true } } },
    });
    if (!dispute) throw new NotFoundException({ code: 'DISPUTE_NOT_FOUND', message: 'النزاع غير موجود' });
    if (actor.role === 'ADMIN' || actor.role === 'SUPER_ADMIN') return dispute;
    const isOwner =
      dispute.order.clientId === actor.companyId || dispute.order.carrierId === actor.companyId;
    if (!isOwner) throw new ForbiddenException({ code: 'FORBIDDEN', message: 'لا تملك صلاحية' });
    return dispute;
  }

  /**
   * Create a dispute on an order. The caller must be a party (client or
   * carrier). One dispute per order — duplicate POSTs throw CONFLICT.
   */
  async create(input: CreateInput, actor: AuthUser) {
    if (!actor.companyId) {
      throw new BadRequestException({ code: 'NO_COMPANY', message: 'يجب أن تكون ضمن شركة' });
    }
    const order = await this.prisma.order.findUnique({ where: { id: input.orderId } });
    if (!order) throw new NotFoundException({ code: 'ORDER_NOT_FOUND', message: 'الطلب غير موجود' });
    const isParty = order.clientId === actor.companyId || order.carrierId === actor.companyId;
    if (!isParty) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'لست طرفاً في هذا الطلب' });
    }
    // Workflow constraint: disputes only make sense once a carrier is on the
    // order. Earlier states have other cancellation flows.
    const allowedStatuses = ['ASSIGNED', 'CONFIRMED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED'];
    if (!allowedStatuses.includes(order.status)) {
      throw new BadRequestException({
        code: 'CANNOT_OPEN_DISPUTE',
        message: 'لا يمكن فتح نزاع على هذا الطلب في حالته الحالية',
      });
    }
    const existing = await this.prisma.dispute.findUnique({ where: { orderId: order.id } });
    if (existing) {
      throw new ConflictException({ code: 'DISPUTE_EXISTS', message: 'يوجد نزاع مفتوح على هذا الطلب' });
    }
    return this.prisma.dispute.create({
      data: {
        orderId: order.id,
        reason: input.reason,
        description: input.description,
        attachments: input.attachments ?? [],
        openedBy: actor.id,
        status: 'OPEN',
      },
    });
  }
}
