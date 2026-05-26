import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateBidDto, UpdateBidDto } from './dto/bid.dto';
import type { AuthUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class BidsService {
  constructor(private prisma: PrismaService) {}

  async list(orderId: string) {
    return this.prisma.bid.findMany({
      where: { orderId },
      include: { provider: { select: { id: true, nameAr: true, logo: true, status: true } } },
      orderBy: { amount: 'asc' },
    });
  }

  async create(orderId: string, dto: CreateBidDto, actor: AuthUser) {
    if (!actor.companyId) {
      throw new BadRequestException({ code: 'NO_COMPANY', message: 'يجب أن تكون شركة مزودة للخدمة' });
    }
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException({ code: 'ORDER_NOT_FOUND', message: 'الطلب غير موجود' });
    if (!['PUBLISHED', 'BIDDING'].includes(order.status)) {
      throw new BadRequestException({ code: 'BIDDING_CLOSED', message: 'باب العروض مغلق' });
    }

    // Idempotent: upsert by (orderId, carrierId).
    // PENDING → editable (update in place).
    // REJECTED/WITHDRAWN/EXPIRED → allow re-bid: upsert flips status back to PENDING.
    // ACCEPTED → terminal lock; further edits are not allowed.
    const existing = await this.prisma.bid.findUnique({
      where: { orderId_providerId: { orderId, providerId: actor.companyId } },
    });
    if (existing && existing.status === 'ACCEPTED') {
      throw new BadRequestException({ code: 'BID_LOCKED', message: 'العرض مقبول بالفعل' });
    }

    const bid = await this.prisma.bid.upsert({
      where: { orderId_providerId: { orderId, providerId: actor.companyId } },
      create: {
        orderId,
        providerId: actor.companyId,
        amount: dto.amount,
        estimatedDays: dto.estimatedDays ?? 0,
        estimatedHours: dto.estimatedHours,
        proposedPickupDate: dto.proposedPickupDate ? new Date(dto.proposedPickupDate) : null,
        proposedDeliveryDate: dto.proposedDeliveryDate ? new Date(dto.proposedDeliveryDate) : null,
        notes: dto.notes,
      },
      update: {
        amount: dto.amount,
        estimatedDays: dto.estimatedDays ?? 0,
        estimatedHours: dto.estimatedHours,
        proposedPickupDate: dto.proposedPickupDate ? new Date(dto.proposedPickupDate) : null,
        proposedDeliveryDate: dto.proposedDeliveryDate ? new Date(dto.proposedDeliveryDate) : null,
        notes: dto.notes,
        status: 'PENDING',
      },
    });

    if (order.status === 'PUBLISHED') {
      await this.prisma.order.update({ where: { id: orderId }, data: { status: 'BIDDING' } });
    }
    return bid;
  }

  async update(orderId: string, id: string, dto: UpdateBidDto, actor: AuthUser) {
    const bid = await this.requireBid(id);
    if (bid.providerId !== actor.companyId) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'هذا ليس عرضك' });
    }
    if (bid.status !== 'PENDING') {
      throw new BadRequestException({ code: 'BID_LOCKED', message: 'لا يمكن تعديل العرض' });
    }
    return this.prisma.bid.update({ where: { id }, data: dto });
  }

  async accept(orderId: string, id: string, actor: AuthUser) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException({ code: 'ORDER_NOT_FOUND', message: 'الطلب غير موجود' });
    if (order.clientId !== actor.companyId && actor.role !== 'ADMIN' && actor.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'لا تملك صلاحية' });
    }
    const bid = await this.requireBid(id);

    return this.prisma.$transaction(async (tx) => {
      // accept this bid
      const updated = await tx.bid.update({ where: { id }, data: { status: 'ACCEPTED' } });
      // reject remaining bids
      await tx.bid.updateMany({
        where: { orderId, NOT: { id }, status: 'PENDING' },
        data: { status: 'REJECTED' },
      });
      // assign the order to the winning provider
      const commissionRate = 0.08;
      const commission = +(bid.amount * commissionRate).toFixed(2);
      const providerAmount = +(bid.amount - commission).toFixed(2);
      await tx.order.update({
        where: { id: orderId },
        data: {
          providerId: bid.providerId,
          agreedPrice: bid.amount,
          commissionAmount: commission,
          providerAmount,
          status: 'ASSIGNED',
        },
      });
      // Escrow: create the Payment row in HELD state. Idempotent — only one
      // payment per order (unique on orderId in schema). If a prior acceptance
      // was rolled back externally, we upsert to keep state consistent.
      await tx.payment.upsert({
        where: { orderId },
        create: {
          orderId,
          totalAmount: bid.amount,
          commissionAmount: commission,
          providerAmount,
          status: 'HELD',
          heldAt: new Date(),
        },
        update: {
          totalAmount: bid.amount,
          commissionAmount: commission,
          providerAmount,
          status: 'HELD',
          heldAt: new Date(),
        },
      });
      return updated;
    });
  }

  async reject(orderId: string, id: string, actor: AuthUser) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException({ code: 'ORDER_NOT_FOUND', message: 'الطلب غير موجود' });
    if (order.clientId !== actor.companyId && actor.role !== 'ADMIN' && actor.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'لا تملك صلاحية' });
    }
    return this.prisma.bid.update({ where: { id }, data: { status: 'REJECTED' } });
  }

  async withdraw(orderId: string, id: string, actor: AuthUser) {
    const bid = await this.requireBid(id);
    if (bid.providerId !== actor.companyId) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'هذا ليس عرضك' });
    }
    if (bid.status !== 'PENDING') {
      throw new BadRequestException({ code: 'BID_LOCKED', message: 'لا يمكن سحب عرض غير معلّق' });
    }
    return this.prisma.bid.update({ where: { id }, data: { status: 'WITHDRAWN' } });
  }

  private async requireBid(id: string) {
    const bid = await this.prisma.bid.findUnique({ where: { id } });
    if (!bid) throw new NotFoundException({ code: 'BID_NOT_FOUND', message: 'العرض غير موجود' });
    return bid;
  }
}
