import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';
import { SubmitKycDto, UpdateCompanyDto } from './dto/update-company.dto';
import type { KYCStatus, Prisma } from '@prisma/client';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async list(query: PaginationDto, type?: 'CLIENT' | 'PROVIDER', status?: string) {
    const { page = 1, limit = 20, sort = 'createdAt', order = 'desc', search } = query;
    const where: Prisma.CompanyWhereInput = {
      ...(type ? { type } : {}),
      ...(status ? { status: status as Prisma.CompanyWhereInput['status'] } : {}),
      ...(search
        ? {
            OR: [
              { nameAr: { contains: search, mode: 'insensitive' } },
              { nameEn: { contains: search, mode: 'insensitive' } },
              { crNumber: { contains: search } },
              { contactPhone: { contains: search } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sort]: order },
      }),
      this.prisma.company.count({ where }),
    ]);
    return paginate(items, total, page, limit);
  }

  async findById(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: { kycDocuments: true, _count: { select: { users: true, services: true } } },
    });
    if (!company) throw new NotFoundException({ code: 'COMPANY_NOT_FOUND', message: 'الشركة غير موجودة' });
    return company;
  }

  async update(id: string, dto: UpdateCompanyDto, actor: { companyId: string | null; role: string }) {
    this.assertAccess(id, actor);
    return this.prisma.company.update({ where: { id }, data: dto });
  }

  async submitKyc(id: string, dto: SubmitKycDto, actor: { companyId: string | null; role: string }) {
    this.assertAccess(id, actor);
    const doc = await this.prisma.kYCDocument.create({
      data: { companyId: id, type: dto.type, fileUrl: dto.fileUrl, notes: dto.notes },
    });
    await this.prisma.company.update({ where: { id }, data: { kycStatus: 'PENDING' } });
    return doc;
  }

  async listKyc(id: string) {
    return this.prisma.kYCDocument.findMany({
      where: { companyId: id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async reviewKyc(docId: string, status: KYCStatus, notes: string | undefined, reviewerId: string) {
    const doc = await this.prisma.kYCDocument.update({
      where: { id: docId },
      data: { status, notes, reviewedBy: reviewerId, reviewedAt: new Date() },
    });
    // If all docs approved → company kycStatus = APPROVED
    const allDocs = await this.prisma.kYCDocument.findMany({ where: { companyId: doc.companyId } });
    const allApproved = allDocs.length > 0 && allDocs.every((d) => d.status === 'APPROVED');
    const anyRejected = allDocs.some((d) => d.status === 'REJECTED');
    await this.prisma.company.update({
      where: { id: doc.companyId },
      data: {
        kycStatus: anyRejected ? 'REJECTED' : allApproved ? 'APPROVED' : 'PENDING',
        ...(allApproved ? { status: 'ACTIVE' } : {}),
      },
    });
    return doc;
  }

  async stats(id: string) {
    const [orders, completedRevenue, activeBids] = await Promise.all([
      this.prisma.order.count({ where: { OR: [{ clientId: id }, { providerId: id }] } }),
      this.prisma.order.aggregate({
        where: { status: 'COMPLETED', OR: [{ clientId: id }, { providerId: id }] },
        _sum: { agreedPrice: true },
      }),
      this.prisma.bid.count({ where: { providerId: id, status: 'PENDING' } }),
    ]);
    return {
      totalOrders: orders,
      totalRevenue: completedRevenue._sum.agreedPrice ?? 0,
      activeBids,
    };
  }

  private assertAccess(companyId: string, actor: { companyId: string | null; role: string }) {
    if (actor.role === 'SUPER_ADMIN' || actor.role === 'ADMIN') return;
    if (actor.companyId !== companyId) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'لا تملك صلاحية على هذه الشركة' });
    }
  }
}
