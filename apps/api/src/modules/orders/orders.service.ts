import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import type { EmployeeStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';
import {
  AssignEmployeeDto,
  AssignOrderDto,
  CancelOrderDto,
  CreateOrderDto,
  CreateTrackingEventDto,
  UpdateOrderDto,
} from './dto/create-order.dto';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { customAlphabet } from 'nanoid';
import type { OrderStatus, Prisma } from '@prisma/client';

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
    } else if (actor.role === 'PROVIDER_ADMIN' || actor.role === 'PROVIDER_USER') {
      const myId = actor.companyId ?? '__none__';
      if (mine) {
        where.providerId = myId;
      } else {
        // Providers see three buckets simultaneously:
        //   1. OPEN marketplace orders (PUBLISHED/BIDDING + mode=OPEN)
        //   2. DIRECT orders targeted at them (any status pre-assignment)
        //   3. Orders already assigned to them (any status)
        where.OR = [
          { AND: [{ mode: 'OPEN' }, { status: { in: ['PUBLISHED', 'BIDDING'] } }] },
          { AND: [{ mode: 'DIRECT' }, { targetProviderId: myId }] },
          { providerId: myId },
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
          provider: { select: { id: true, nameAr: true, logo: true } },
          _count: { select: { bids: true } },
          // Lean bid subset so the provider list can answer "did I already bid
          // on this order?" without a second round-trip. We only need the
          // providerId + status to drive the row CTA (تفاصيل / إعادة تقديم /
          // قدّم عرضاً) — full bid bodies are still fetched in the detail page.
          bids: { select: { id: true, providerId: true, status: true, amount: true } },
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
        provider: true,
        bids: { include: { provider: { select: { id: true, nameAr: true, nameEn: true, logo: true, city: true, region: true, contactPhone: true } } }, orderBy: { amount: 'asc' } },
        trackingEvents: { orderBy: { createdAt: 'desc' } },
        payment: true,
        invoice: true,
        orderEmployees: {
          orderBy: { assignedAt: 'desc' },
          include: {
            employee: {
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
    // ── Resolve company ID ─────────────────────────────────────────────────
    // JWT companyId can be stale after a DB reseed. Fall back to a live DB
    // lookup by user ID so the order never fails due to a stale token alone.
    let companyId = actor.companyId;

    if (companyId) {
      const exists = await this.prisma.company.findUnique({ where: { id: companyId }, select: { id: true } });
      if (!exists) companyId = null;
    }

    if (!companyId) {
      const user = await this.prisma.user.findUnique({ where: { id: actor.id }, select: { companyId: true } });
      companyId = user?.companyId ?? null;
    }

    if (!companyId) {
      throw new BadRequestException({ code: 'NO_COMPANY', message: 'حسابك غير مرتبط بشركة. يرجى تسجيل الخروج وإعادة الدخول أو التواصل مع الدعم' });
    }

    // ── Resolve requiredServiceType ────────────────────────────────────────
    // Fall back to cargoType so the order is never rejected for a missing
    // or unknown service type value.
    const SERVICE_TYPES_SET = new Set([
      'CONSULTING','DESIGN','INSTALLATION','MAINTENANCE','TECHNICAL_SUPPORT',
      'TRAINING','IT_SERVICES','LOGISTICS','PROJECT_MANAGEMENT','OTHER',
    ]);
    const serviceType = (dto.requiredServiceType && SERVICE_TYPES_SET.has(dto.requiredServiceType))
      ? dto.requiredServiceType
      : dto.cargoType;

    const orderNumber = `ORD-${new Date().getFullYear()}-${orderNumberGen()}`;
    try {
      return await this.prisma.order.create({
        data: {
          orderNumber,
          clientId: companyId,
          mode: dto.mode ?? 'OPEN',
          targetProviderId: dto.mode === 'DIRECT' ? dto.targetProviderId : null,
          ...(dto.mode === 'DIRECT' && dto.agreedPriceUpfront ? {
            agreedPrice:      dto.agreedPriceUpfront,
            commissionAmount: +(dto.agreedPriceUpfront * 0.08).toFixed(2),
            providerAmount:   +(dto.agreedPriceUpfront * 0.92).toFixed(2),
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
          requiredServiceType: serviceType,
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
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'P2003') {
        throw new BadRequestException({ code: 'FK_VIOLATION', message: 'بيانات الحساب قديمة، يرجى تسجيل الخروج وإعادة الدخول' });
      }
      if (code === 'P2002') {
        throw new BadRequestException({ code: 'DUPLICATE_ORDER', message: 'رقم الطلب مكرر، حاول مرة أخرى' });
      }
      throw new InternalServerErrorException({ code: 'ORDER_CREATE_FAILED', message: 'فشل إنشاء الطلب، حاول مرة أخرى' });
    }
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
    if (order.mode === 'DIRECT' && order.agreedPrice && order.targetProviderId) {
      return this.prisma.order.update({
        where: { id },
        data: { status: 'ASSIGNED', providerId: order.targetProviderId },
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
        providerId: dto.providerId,
        agreedPrice: dto.agreedPrice,
        commissionAmount: commission,
        providerAmount: dto.agreedPrice - commission,
        status: 'ASSIGNED',
      },
    });
  }

  async confirm(id: string, actor: AuthUser) {
    const order = await this.requireOrder(id);
    if (order.providerId !== actor.companyId && !this.isAdmin(actor)) {
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
    if (order.providerId !== actor.companyId && !this.isAdmin(actor)) {
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
      const assigned = await tx.orderEmployee.findMany({ where: { orderId: id }, select: { employeeId: true } });
      if (assigned.length > 0) {
        await tx.employeeProfile.updateMany({
          where: { id: { in: assigned.map((d) => d.employeeId) } },
          data: { status: 'AVAILABLE' as EmployeeStatus },
        });
      }
      return updatedOrder;
    });
  }

  async assignDriver(orderId: string, dto: AssignEmployeeDto, actor: AuthUser) {
    const order = await this.requireOrder(orderId);
    if (order.providerId !== actor.companyId && !this.isAdmin(actor)) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'لا تملك صلاحية' });
    }
    if (!['ASSIGNED', 'CONFIRMED', 'IN_TRANSIT'].includes(order.status)) {
      throw new BadRequestException({ code: 'INVALID_TRANSITION', message: 'لا يمكن إسناد سائق في هذه المرحلة' });
    }
    const driver = await this.prisma.employeeProfile.findUnique({ where: { id: dto.employeeId } });
    if (!driver) throw new NotFoundException({ code: 'DRIVER_NOT_FOUND', message: 'الموظف غير موجود' });
    if (driver.companyId !== actor.companyId && !this.isAdmin(actor)) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'الموظف لا ينتمي لشركتك' });
    }
    return this.prisma.$transaction(async (tx) => {
      await tx.orderEmployee.upsert({
        where: { orderId_employeeId: { orderId, employeeId: dto.employeeId } },
        create: { orderId, employeeId: dto.employeeId },
        update: { assignedAt: new Date() },
      });
      await tx.employeeProfile.update({
        where: { id: dto.employeeId },
        data: { status: 'ON_ASSIGNMENT' as EmployeeStatus },
      });
      return { ok: true, driverId: dto.employeeId };
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
    if (order.targetProviderId !== actor.companyId) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'لست مزود الخدمة المستهدف' });
    }
    if (!['PUBLISHED', 'BIDDING'].includes(order.status)) {
      throw new BadRequestException({ code: 'INVALID_TRANSITION', message: 'الطلب لم يعد في مرحلة التفاوض' });
    }
    // Move order back to PUBLISHED so client can reassign or open to marketplace.
    return this.prisma.order.update({
      where: { id },
      data: { status: 'PUBLISHED', targetProviderId: null },
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
      order.providerId === actor.companyId ||
      actor.role === 'EMPLOYEE' ||
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

  private assertViewAccess(order: { clientId: string; providerId: string | null; status: string }, actor: AuthUser) {
    if (this.isAdmin(actor)) return;
    if (order.clientId === actor.companyId) return;
    if (order.providerId === actor.companyId) return;
    if (
      (actor.role === 'PROVIDER_ADMIN' || actor.role === 'PROVIDER_USER') &&
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
