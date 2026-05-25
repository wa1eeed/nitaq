import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateInvoiceDto {
  @IsString() orderId!: string;
  @IsString() receiverId!: string;
  @IsNumber() amount!: number;
  @IsOptional() @IsNumber() vatAmount?: number;
  @IsOptional() @IsString() notes?: string;
}

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  async list(query: PaginationDto, actor: AuthUser) {
    const { page = 1, limit = 20, sort = 'createdAt', order = 'desc' } = query;
    const where = this.isAdmin(actor)
      ? {}
      : { OR: [{ issuerId: actor.companyId ?? '' }, { receiverId: actor.companyId ?? '' }] };
    const [items, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where, skip: (page - 1) * limit, take: limit,
        orderBy: { [sort]: order },
        include: { issuer: { select: { nameAr: true } }, receiver: { select: { nameAr: true } } },
      }),
      this.prisma.invoice.count({ where }),
    ]);
    return paginate(items, total, page, limit);
  }

  async findById(id: string) {
    const inv = await this.prisma.invoice.findUnique({
      where: { id },
      include: { issuer: true, receiver: true, order: true },
    });
    if (!inv) throw new NotFoundException({ code: 'INVOICE_NOT_FOUND', message: 'الفاتورة غير موجودة' });
    return inv;
  }

  async create(dto: CreateInvoiceDto, actor: AuthUser) {
    const vat = dto.vatAmount ?? +(dto.amount * 0.15).toFixed(2);
    const issuerId = actor.companyId!;
    return this.prisma.invoice.create({
      data: {
        orderId: dto.orderId,
        issuerId,
        receiverId: dto.receiverId,
        amount: dto.amount,
        vatAmount: vat,
        totalAmount: +(dto.amount + vat).toFixed(2),
        notes: dto.notes,
        status: 'ISSUED',
      },
    });
  }

  async send(id: string) {
    return this.prisma.invoice.update({
      where: { id },
      data: { status: 'ISSUED' },
    });
  }

  private isAdmin(actor: AuthUser): boolean {
    return actor.role === 'ADMIN' || actor.role === 'SUPER_ADMIN';
  }
}
