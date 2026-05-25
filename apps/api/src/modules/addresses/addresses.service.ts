import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';
import type { AuthUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class AddressesService {
  constructor(private prisma: PrismaService) {}

  private assertAccess(companyId: string, actor: AuthUser) {
    if (actor.companyId !== companyId) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'لا تملك صلاحية' });
    }
  }

  async list(companyId: string, actor: AuthUser) {
    this.assertAccess(companyId, actor);
    return this.prisma.savedAddress.findMany({
      where: { companyId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async create(companyId: string, dto: CreateAddressDto, actor: AuthUser) {
    this.assertAccess(companyId, actor);
    if (dto.isDefault) {
      // Clear previous default for this company
      await this.prisma.savedAddress.updateMany({
        where: { companyId, isDefault: true },
        data: { isDefault: false },
      });
    }
    return this.prisma.savedAddress.create({ data: { companyId, ...dto } });
  }

  async update(companyId: string, id: string, dto: UpdateAddressDto, actor: AuthUser) {
    this.assertAccess(companyId, actor);
    await this.requireAddress(id, companyId);
    if (dto.isDefault) {
      await this.prisma.savedAddress.updateMany({
        where: { companyId, isDefault: true, NOT: { id } },
        data: { isDefault: false },
      });
    }
    return this.prisma.savedAddress.update({ where: { id }, data: dto });
  }

  async setDefault(companyId: string, id: string, actor: AuthUser) {
    this.assertAccess(companyId, actor);
    await this.requireAddress(id, companyId);
    await this.prisma.savedAddress.updateMany({
      where: { companyId, isDefault: true },
      data: { isDefault: false },
    });
    return this.prisma.savedAddress.update({ where: { id }, data: { isDefault: true } });
  }

  async remove(companyId: string, id: string, actor: AuthUser) {
    this.assertAccess(companyId, actor);
    await this.requireAddress(id, companyId);
    await this.prisma.savedAddress.delete({ where: { id } });
    return { ok: true };
  }

  private async requireAddress(id: string, companyId: string) {
    const addr = await this.prisma.savedAddress.findUnique({ where: { id } });
    if (!addr || addr.companyId !== companyId) {
      throw new NotFoundException({ code: 'ADDRESS_NOT_FOUND', message: 'العنوان غير موجود' });
    }
    return addr;
  }
}
