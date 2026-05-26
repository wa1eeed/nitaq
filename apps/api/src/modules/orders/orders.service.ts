import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { DriverStatus } from '../../generated/prisma';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';
import {
  AssignDriverDto,
  AssignOrderDto,
  CancelOrderDto,
  CreateOrderDto,
  CreateTrackingEventDto,
  UpdateOrderDto,
} from './dto/create-order.dto';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { customAlphabet } from 'nanoid';
import type { OrderStatus, Prisma } from '../../generated/prisma';

const orderNumberGen = customAlphabet('0123456789', 6);

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async list(query: PaginationDto & { status?: OrderStatus; mine?: boolean }, actor: AuthUser) {
    const { page = 1, limit = 20, sort = 'createdAt', order = 'desc', search, status, mine } = query;
    const where: Prisma.OrderWhereInput = {
      ...(status ? { status } : {}),
      ...(search ? {
        OR: [
          { orderNumber: { contains: search } },
          { cargoDescription: { contains: search, mode: 'insensitive' } },
          { originCity: { contains: search } },
          { destinationCity: { contains: search } },
        ],
      } : {}),
    };

    if (actor.role === 'CLIENT_ADMIN' || actor.role === 'CLIENT_USER') {
      where.clientId = actor.companyId ?? '__none__';
    } else if (actor.role === 'CARRIER_ADMIN' || actor.role === 'CARRIER_USER') {
      const myId = actor.companyId ?? '__none__';
      if (mine) {
        where.carrierId = myId;
      } else {
        // Providers see three buckets simultaneously:
        //   1. OPEN marketplace orders (PUBLISHED/BIDDING + mode=OPEN)
        //   2. DIRECT orders targeted at them (any status pre-assignment)
        //   3. Orders already assigned to them (any status)
        where.OR = [
          { AND: [{ mode: 'OPEN' }, { status: { in: ['PUBLISHED', 'BIDDING'] } }] },
          { AND: [{ mode: 'DIRECT' }, { targetCarrierId: myId }] },
          { carrierId: myId },
        ];
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sort]: order },
        include: {
          client: { select: { id: true, nameAr: true, logo: true } },
          carrier: { select: { id: true, nameAr: true, logo: true } },
          _count: { select: { bids: true } },
          // Lean bid subset so the provider list can answer "did I already bid
          // on this order?" without a second round-trip. We only need the
          // carrierId + status to drive the row CTA (تفاصيل / إعادة تقديم /
          // قدّم عرضاً) — full bid bodies are still fetched in the detail page.
          bids: { select: { id: true, carrierId: true, status: true, amount: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);
    return paginate(items, total, page, limit);
  }

  async findById(id: string, actor: AuthUser) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        client: true,
        carrier: true,
        bids: { include: { carrier: { select: { id: true, nameAr: true, nameEn: true, logo: true, city: true, region: true, contactPhone: true } } }, orderBy: { amount: 'asc' } },
        trackingEvents: { orderBy: { createdAt: 'desc' } },
        payment: true,
        invoice: true,
        orderDrivers: {
          orderBy: { assignedAt: 'desc' },
          include: {
            driver: {
              include: {
                user: { select: { firstName: true, lastName: true, phone: true } },
              },
            },
          },
        },
      },
    });
    if (!order) throw new NotFoundException({ code: 'ORDER_NOT_FOUND', message: 'الطلب غير موجود' });
    this.assertViewAccess(order, actor);
    return order;
  }

  async create(dto: CreateOrderDto, actor: AuthUser) {
    if (!actor.companyId) {
      throw new BadRequestException({ code: 'NO_COMPANY', message: 'يجب أن تكون ضمن شركة' });
    }
    const orderNumber = `ORD-${new Date().getFullYear()}-${orderNumberGen()}`;
    return this.prisma.order.create({
      data: {
        orderNumber,
        clientId: actor.companyId,
        // v0.6.0 workflow fields — defaults preserve old behavior.
        mode: dto.mode ?? 'OPEN',
        targetCarrierId: dto.mode === 'DIRECT' ? dto.targetCarrierId : null,
        // Pre-seed agreed price for DIRECT orders with upfront price.
        ...(dto.mode === 'DIRECT' && dto.agreedPriceUpfront ? {
          agreedPrice:      dto.agreedPriceUpfront,
          commissionAmount: +(dto.agreedPriceUpfront * 0.08).toFixed(2),
          carrierAmount:    +(dto.agreedPriceUpfront * 0.92).toFixed(2),
        } : {}),
        tripType: dto.tripType ?? (dto.originCity === dto.destinationCity ? 'SAME_CITY' : 'INTER_CITY'),
        pickupWindow: dto.pickupWindow ?? 'ALL_DAY',
        cargoType: dto.cargoType,
        cargoDescription: dto.cargoDescription,
        weight: dto.weight,
        pallets: dto.pallets,
        volume: dto.volume,
        originCity: dto.originCity,
        originRegion: dto.originRegion,
        originAddress: dto.originAddress,
        originLat: dto.originLat,
        originLng: dto.originLng,
        destinationCity: dto.destinationCity,
        destinationRegion: dto.destinationRegion,
        destinationAddress: dto.destinationAddress,
        destinationLat: dto.destinationLat,
        destinationLng: dto.destinationLng,
        requiredTruckType: dto.requiredTruckType,
        requiresRefrigeration: dto.requiresRefrigeration ?? false,
        requiresInsurance: dto.requiresInsurance ?? false,
        specialInstructions: dto.specialInstructions,
        pickupDate: new Date(dto.pickupDate),
        deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : null,
        bidDeadline: dto.bidDeadline ? new Date(dto.bidDeadline) : null,
        clientBudget: dto.clientBudget,
        poNumber: dto.poNumber,
        notes: dto.notes,
        documents: dto.documents ?? [],
      },
    });
  }

  async update(id: string, dto: UpdateOrderDto, actor: AuthUser) {
    const order = await this.requireOrder(id);
    if (order.clientId !== actor.companyId && !this.isAdmin(actor)) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'لا تملك صلاحية' });
    }
    if (!['DRAFT', 'PUBLISHED'].includes(order.status)) {
      throw new BadRequestException({ code: 'ORDER_LOCKED', message: 'لا يمكن تعديل الطلب في هذه المرحلة' });
    }
    return this.prisma.order.update({
      where: { id },
      data: {
        ...dto,
        pickupDate: dto.pickupDate ? new Date(dto.pickupDate) : undefined,
      },
    });
  }

  async publish(id: string, actor: AuthUser) {
    const order = await this.requireOrder(id);
    if (order.clientId !== actor.companyId) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'لا تملك صلاحية' });
    }
    if (order.status !== 'DRAFT') {
      throw new BadRequestException({ code: 'INVALID_TRANSITION', message: 'الطلب منشور بالفعل' });
    }
    // DIRECT + pre-agreed price: skip negotiation, assign immediately.
    if (order.mode === 'DIRECT' && order.agreedPrice && order.targetCarrierId) {
      return this.prisma.order.update({
        where: { id },
        data: { status: 'ASSIGNED', carrierId: order.targetCarrierId },
      });
    }
    return this.prisma.order.update({
      where: { id },
      data: { status: 'PUBLISHED' },
    });
  }

  async assign(id: string, dto: AssignOrderDto, actor: AuthUser) {
    const order = await this.requireOrder(id);
    if (order.clientId !== actor.companyId && !this.isAdmin(actor)) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'لا تملك صلاحية' });
    }
    if (!['PUBLISHED', 'BIDDING'].includes(order.status)) {
      throw new BadRequestException({ code: 'INVALID_TRANSITION', message: 'حالة الطلب غير مناسبة' });
    }
    const commissionRate = 0.08;
    const commission = +(dto.agreedPrice * commissionRate).toFixed(2);
    return this.prisma.order.update({
      where: { id },
      data: {
        carrierId: dto.carrierId,
        agreedPrice: dto.agreedPrice,
        commissionAmount: commission,
        carrierAmount: dto.agreedPrice - commission,
        status: 'ASSIGNED',
      },
    });
  }

  async confirm(id: string, actor: AuthUser) {
    const order = await this.requireOrder(id);
    if (order.carrierId !== actor.companyId && !this.isAdmin(actor)) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'لا تملك صلاحية' });
    }
    if (order.status !== 'ASSIGNED') {
      throw new BadRequestException({ code: 'INVALID_TRANSITION', message: 'لا يمكن التأكيد' });
    }
    return this.prisma.order.update({ where: { id }, data: { status: 'CONFIRMED' } });
  }

  async cancel(id: string, dto: CancelOrderDto, actor: AuthUser) {
    const order = await this.requireOrder(id);
    const canCancel = order.clientId === actor.companyId || this.isAdmin(actor);
    if (!canCancel) throw new ForbiddenException({ code: 'FORBIDDEN', message: 'لا تملك صلاحية' });
    if (['COMPLETED', 'CANCELLED'].includes(order.status)) {
      throw new BadRequestException({ code: 'INVALID_TRANSITION', message: 'لا يمكن إلغاء الطلب' });
    }
    return this.prisma.order.update({
      where: { id },
      data: { status: 'CANCELLED', cancelReason: dto.reason },
    });
  }

  /**
   * Provider marks the order as delivered. Transition is allowed from
   * CONFIRMED or IN_TRANSIT — the latter being the typical path after the
   * provider has been emitting tracking events. Sets `actualDeliveryAt` so the
   * 72-hour escrow auto-release clock starts ticking.
   */
  async deliver(id: string, actor: AuthUser) {
    const order = await this.requireOrder(id);
    if (order.carrierId !== actor.companyId && !this.isAdmin(actor)) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'لا تملك صلاحية' });
    }
    if (!['CONFIRMED', 'IN_TRANSIT'].includes(order.status)) {
      throw new BadRequestException({ code: 'INVALID_TRANSITION', message: 'لا يمكن وضع تم التسليم من هذه الحالة' });
    }
    return this.prisma.order.update({
      where: { id },
      data: { status: 'DELIVERED', actualDeliveryAt: new Date() },
    });
  }

  /**
   * Client confirms receipt (or the 72-hour auto-release fires from a cron).
   * Atomic: order → COMPLETED + Payment → RELEASED + releasedAt timestamped.
   * Wallet credit + invoice generation should listen on the `order.complete`
   * audit event (out of scope for this slice).
   */
  async complete(id: string, actor: AuthUser) {
    const order = await this.requireOrder(id);
    const isClient = order.clientId === actor.companyId;
    if (!isClient && !this.isAdmin(actor)) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'لا تملك صلاحية' });
    }
    if (order.status !== 'DELIVERED') {
      throw new BadRequestException({ code: 'INVALID_TRANSITION', message: 'الطلب لم يُسلَّم بعد' });
    }
    return this.prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id },
        data: { status: 'COMPLETED' },
      });
      await tx.payment.updateMany({
        where: { orderId: id, status: 'HELD' },
        data: { status: 'RELEASED', releasedAt: new Date() },
      });
      // Set assigned employees back to AVAILABLE once order completes.
      const assigned = await tx.orderDriver.findMany({ where: { orderId: id }, select: { driverId: true } });
      if (assigned.length > 0) {
        await tx.driverProfile.updateMany({
          where: { id: { in: assigned.map((d) => d.driverId) } },
          data: { status: 'AVAILABLE' as DriverStatus },
        });
      }
      return updatedOrder;
    });
  }

  async assignDriver(orderId: string, dto: AssignDriverDto, actor: AuthUser) {
    const order = await this.requireOrder(orderId);
    if (order.carrierId !== actor.companyId && !this.isAdmin(actor)) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'لا تملك صلاحية' });
    }
    if (!['ASSIGNED', 'CONFIRMED', 'IN_TRANSIT'].includes(order.status)) {
      throw new BadRequestException({ code: 'INVALID_TRANSITION', message: 'لا يمكن إسناد سائق في هذه المرحلة' });
    }
    const driver = await this.prisma.driverProfile.findUnique({ where: { id: dto.driverId } });
    if (!driver) throw new NotFoundException({ code: 'DRIVER_NOT_FOUND', message: 'الموظف غير موجود' });
    if (driver.companyId !== actor.companyId && !this.isAdmin(actor)) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'الموظف لا ينتمي لشركتك' });
    }
    return this.prisma.$transaction(async (tx) => {
      await tx.orderDriver.upsert({
        where: { orderId_driverId: { orderId, driverId: dto.driverId } },
        create: { orderId, driverId: dto.driverId },
        update: { assignedAt: new Date() },
      });
      await tx.driverProfile.update({
        where: { id: dto.driverId },
        data: { status: 'ON_TRIP' as DriverStatus },
      });
      return { ok: true, driverId: dto.driverId };
    });
  }

  async remove(id: string, actor: AuthUser) {
    const order = await this.requireOrder(id);
    if (order.clientId !== actor.companyId && !this.isAdmin(actor)) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'لا تملك صلاحية' });
    }
    if (order.status !== 'DRAFT') {
      throw new BadRequestException({ code: 'CANNOT_DELETE', message: 'يمكن حذف المسودات فقط' });
    }
    await this.prisma.order.delete({ where: { id } });
    return { ok: true };
  }

  async declineDirect(id: string, actor: AuthUser) {
    const order = await this.requireOrder(id);
    if (order.mode !== 'DIRECT') {
      throw new BadRequestException({ code: 'NOT_DIRECT', message: 'هذا الإجراء خاص بالطلبات المباشرة' });
    }
    if (order.targetCarrierId !== actor.companyId) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'لست مزود الخدمة المستهدف' });
    }
    if (!['PUBLISHED', 'BIDDING'].includes(order.status)) {
      throw new BadRequestException({ code: 'INVALID_TRANSITION', message: 'الطلب لم يعد في مرحلة التفاوض' });
    }
    // Move order back to PUBLISHED so client can reassign or open to marketplace.
    return this.prisma.order.update({
      where: { id },
      data: { status: 'PUBLISHED', targetCarrierId: null },
    });
  }

  async getTracking(id: string) {
    return this.prisma.trackingEvent.findMany({
      where: { orderId: id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addTrackingEvent(id: string, dto: CreateTrackingEventDto, actor: AuthUser) {
    const order = await this.requireOrder(id);
    const allowed =
      order.carrierId === actor.companyId ||
      actor.role === 'DRIVER' ||
      this.isAdmin(actor);
    if (!allowed) throw new ForbiddenException({ code: 'FORBIDDEN', message: 'لا تملك صلاحية' });

    const event = await this.prisma.trackingEvent.create({
      data: { orderId: id, createdBy: actor.id, ...dto, photos: dto.photos ?? [] },
    });

    if (dto.status === 'PICKED_UP') {
      await this.prisma.order.update({
        where: { id },
        data: { status: 'IN_TRANSIT', actualPickupAt: new Date() },
      });
    } else if (dto.status === 'DELIVERED') {
      await this.prisma.order.update({
        where: { id },
        data: { status: 'DELIVERED', actualDeliveryAt: new Date() },
      });
    }
    return event;
  }

  private async requireOrder(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException({ code: 'ORDER_NOT_FOUND', message: 'الطلب غير موجود' });
    return order;
  }

  private assertViewAccess(order: { clientId: string; carrierId: string | null; status: string }, actor: AuthUser) {
    if (this.isAdmin(actor)) return;
    if (order.clientId === actor.companyId) return;
    if (order.carrierId === actor.companyId) return;
    if (
      (actor.role === 'CARRIER_ADMIN' || actor.role === 'CARRIER_USER') &&
      ['PUBLISHED', 'BIDDING'].includes(order.status)
    ) {
      return;
    }
    throw new ForbiddenException({ code: 'FORBIDDEN', message: 'لا تملك صلاحية' });
  }

  private isAdmin(actor: AuthUser): boolean {
    return actor.role === 'ADMIN' || actor.role === 'SUPER_ADMIN';
  }
}
