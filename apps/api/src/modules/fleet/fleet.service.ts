import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateDriverDto, CreateTruckDto, InviteDriverDto, LocationDto, UpdateTruckDto } from './dto/fleet.dto';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';
import type { AuthUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class FleetService {
  constructor(private prisma: PrismaService) {}

  async listTrucks(query: PaginationDto, actor: AuthUser) {
    if (!actor.companyId) throw new BadRequestException({ code: 'NO_COMPANY', message: 'لا توجد شركة' });
    const { page = 1, limit = 20, sort = 'createdAt', order = 'desc', search } = query;
    const where = {
      companyId: actor.companyId,
      ...(search ? { plateNumber: { contains: search, mode: 'insensitive' as const } } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.service.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { [sort]: order } }),
      this.prisma.service.count({ where }),
    ]);
    return paginate(items, total, page, limit);
  }

  async createTruck(dto: CreateTruckDto, actor: AuthUser) {
    if (!actor.companyId) throw new BadRequestException({ code: 'NO_COMPANY', message: 'لا توجد شركة' });
    return this.prisma.service.create({
      data: { ...dto, companyId: actor.companyId, photos: dto.photos ?? [], documents: dto.documents ?? [] },
    });
  }

  async getTruck(id: string, actor: AuthUser) {
    const truck = await this.prisma.service.findUnique({ where: { id }, include: { currentEmployee: true } });
    if (!truck) throw new NotFoundException({ code: 'TRUCK_NOT_FOUND', message: 'الخدمة غير موجودة' });
    if (truck.companyId !== actor.companyId && !this.isAdmin(actor)) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'لا تملك صلاحية' });
    }
    return truck;
  }

  async updateTruck(id: string, dto: UpdateTruckDto, actor: AuthUser) {
    await this.getTruck(id, actor);
    return this.prisma.service.update({
      where: { id },
      data: { ...dto, photos: dto.photos ?? undefined, documents: dto.documents ?? undefined },
    });
  }

  async listDrivers(query: PaginationDto, actor: AuthUser) {
    if (!actor.companyId) throw new BadRequestException({ code: 'NO_COMPANY', message: 'لا توجد شركة' });
    const { page = 1, limit = 20, sort = 'createdAt', order = 'desc' } = query;
    const where = { companyId: actor.companyId };
    const [items, total] = await Promise.all([
      this.prisma.employeeProfile.findMany({
        where, skip: (page - 1) * limit, take: limit,
        orderBy: { [sort]: order },
        include: { user: { select: { firstName: true, lastName: true, phone: true, avatar: true } } },
      }),
      this.prisma.employeeProfile.count({ where }),
    ]);
    return paginate(items, total, page, limit);
  }

  async createDriver(dto: CreateDriverDto, actor: AuthUser) {
    if (!actor.companyId) throw new BadRequestException({ code: 'NO_COMPANY', message: 'لا توجد شركة' });
    return this.prisma.employeeProfile.create({
      data: {
        userId: dto.userId,
        companyId: actor.companyId,
        licenseNumber: dto.licenseNumber,
        licenseExpiry: new Date(dto.licenseExpiry),
        licenseType: dto.licenseType,
        photo: dto.photo,
        status: 'AVAILABLE',
      },
    });
  }

  async inviteDriver(dto: InviteDriverDto, actor: AuthUser) {
    if (!actor.companyId) throw new BadRequestException({ code: 'NO_COMPANY', message: 'لا توجد شركة' });
    const existing = await this.prisma.user.findFirst({ where: { phone: dto.phone } });
    if (existing) {
      throw new BadRequestException({ code: 'PHONE_TAKEN', message: 'رقم الهاتف مستخدم بالفعل' });
    }
    return this.prisma.$transaction(async (tx) => {
      const [firstName, ...rest] = dto.fullName.trim().split(' ');
      const user = await tx.user.create({
        data: {
          phone: dto.phone,
          firstName: firstName ?? dto.fullName,
          lastName: rest.join(' ') || '',
          role: 'EMPLOYEE',
          companyId: actor.companyId!,
          nationalId: dto.nationalId,
          preferredLanguage: 'ar',
        },
      });
      return tx.employeeProfile.create({
        data: {
          userId: user.id,
          companyId: actor.companyId!,
          licenseNumber: dto.licenseNumber,
          licenseExpiry: new Date(dto.licenseExpiry),
          licenseType: dto.licenseType,
          photo: dto.photo,
          status: 'AVAILABLE',
        },
        include: { user: { select: { id: true, firstName: true, lastName: true, phone: true } } },
      });
    });
  }

  async getAvailableDrivers(actor: AuthUser) {
    if (!actor.companyId) throw new BadRequestException({ code: 'NO_COMPANY', message: 'لا توجد شركة' });
    // Employees currently assigned to an active order.
    const busy = await this.prisma.orderEmployee.findMany({
      where: { order: { status: { in: ['ASSIGNED', 'CONFIRMED', 'IN_TRANSIT'] } } },
      select: { employeeId: true },
    });
    const busyIds = busy.map((d) => d.employeeId);
    return this.prisma.employeeProfile.findMany({
      where: {
        companyId: actor.companyId,
        status: 'AVAILABLE',
        isActive: true,
        ...(busyIds.length > 0 ? { id: { notIn: busyIds } } : {}),
      },
      include: { user: { select: { firstName: true, lastName: true, phone: true, avatar: true } } },
      orderBy: { rating: 'desc' },
    });
  }

  async getDriver(id: string, actor: AuthUser) {
    const driver = await this.prisma.employeeProfile.findUnique({
      where: { id }, include: { user: true },
    });
    if (!driver) throw new NotFoundException({ code: 'DRIVER_NOT_FOUND', message: 'الموظف غير موجود' });
    if (driver.companyId !== actor.companyId && !this.isAdmin(actor)) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'لا تملك صلاحية' });
    }
    return driver;
  }

  async updateDriverLocation(id: string, dto: LocationDto, actor: AuthUser) {
    // The employee can update their own location; provider admin can too.
    const driver = await this.prisma.employeeProfile.findUnique({ where: { id } });
    if (!driver) throw new NotFoundException({ code: 'DRIVER_NOT_FOUND', message: 'الموظف غير موجود' });
    if (driver.userId !== actor.id && driver.companyId !== actor.companyId && !this.isAdmin(actor)) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'لا تملك صلاحية' });
    }
    await this.prisma.locationHistory.create({
      data: { employeeId: id, lat: dto.lat, lng: dto.lng, speed: dto.speed },
    });
    return this.prisma.employeeProfile.update({
      where: { id },
      data: { currentLat: dto.lat, currentLng: dto.lng, lastLocationAt: new Date() },
    });
  }

  private isAdmin(actor: AuthUser): boolean {
    return actor.role === 'ADMIN' || actor.role === 'SUPER_ADMIN';
  }
}
