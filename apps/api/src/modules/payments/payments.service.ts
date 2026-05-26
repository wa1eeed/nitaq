import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import type { Prisma } from '../../generated/prisma';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async list(query: PaginationDto, actor: AuthUser) {
    const { page = 1, limit = 20, sort = 'createdAt', order = 'desc' } = query;
    const where: Prisma.PaymentWhereInput = this.isAdmin(actor)
      ? {}
      : { order: { OR: [{ clientId: actor.companyId ?? '' }, { providerId: actor.companyId ?? '' }] } };
    const [items, total] = await Promise.all([
      this.prisma.payment.findMany({
        where, skip: (page - 1) * limit, take: limit,
        orderBy: { [sort]: order },
        include: {
          // Include the parties' display names so the frontend doesn't need
          // to look them up by cuid (which the mock data doesn't have).
          order: {
            select: {
              orderNumber: true,
              clientId: true,
              providerId: true,
              client: { select: { id: true, nameAr: true, logo: true } },
              provider: { select: { id: true, nameAr: true, logo: true } },
            },
          },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);
    return paginate(items, total, page, limit);
  }

  async findById(id: string, actor: AuthUser) {
    const p = await this.prisma.payment.findUnique({ where: { id }, include: { order: true } });
    if (!p) throw new NotFoundException({ code: 'PAYMENT_NOT_FOUND', message: 'الدفعة غير موجودة' });
    if (!this.isAdmin(actor) && p.order.clientId !== actor.companyId && p.order.providerId !== actor.companyId) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'لا تملك صلاحية' });
    }
    return p;
  }

  async createForOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException({ code: 'ORDER_NOT_FOUND', message: 'الطلب غير موجود' });
    if (!order.agreedPrice) {
      throw new BadRequestException({ code: 'NO_PRICE', message: 'لا يوجد سعر متفق عليه' });
    }
    return this.prisma.payment.create({
      data: {
        orderId,
        totalAmount: order.agreedPrice,
        commissionAmount: order.commissionAmount ?? 0,
        providerAmount: order.providerAmount ?? 0,
        status: 'PENDING',
      },
    });
  }

  async release(id: string, actor: AuthUser) {
    if (!this.isAdmin(actor)) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'إجراء خاص بالإدارة' });
    }
    const payment = await this.prisma.payment.findUnique({ where: { id }, include: { order: true } });
    if (!payment) throw new NotFoundException({ code: 'PAYMENT_NOT_FOUND', message: 'الدفعة غير موجودة' });
    if (payment.status !== 'HELD') {
      throw new BadRequestException({ code: 'INVALID_STATE', message: 'الدفعة ليست محجوزة' });
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.payment.update({
        where: { id },
        data: { status: 'RELEASED', releasedAt: new Date() },
      });
      if (payment.order.providerId) {
        // Credit the provider wallet
        const carrier = await tx.company.update({
          where: { id: payment.order.providerId },
          data: { walletBalance: { increment: payment.providerAmount } },
        });
        await tx.transaction.create({
          data: {
            companyId: payment.order.providerId,
            type: 'credit',
            amount: payment.providerAmount,
            balance: carrier.walletBalance,
            reference: payment.transactionRef ?? payment.id,
            description: `دفع طلب ${payment.order.orderNumber}`,
            orderId: payment.orderId,
          },
        });
      }
      // Mark the order as completed after provider payment release
      await tx.order.update({
        where: { id: payment.orderId },
        data: { status: 'COMPLETED' },
      });
      return updated;
    });
  }

  private isAdmin(actor: AuthUser): boolean {
    return actor.role === 'ADMIN' || actor.role === 'SUPER_ADMIN';
  }
}
