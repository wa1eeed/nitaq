import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import type { SupportTicketCategory, SupportTicketStatus } from '../../generated/prisma';

interface CreateInput {
  subject: string;
  category: SupportTicketCategory;
  description: string;
  attachments?: string[];
}

interface UpdateInput {
  status?: SupportTicketStatus;
  resolution?: string;
  assignedTo?: string;
}

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  async listForActor(actor: AuthUser) {
    if (actor.role === 'ADMIN' || actor.role === 'SUPER_ADMIN') {
      return this.prisma.supportTicket.findMany({
        orderBy: { createdAt: 'desc' },
        include: { company: { select: { nameAr: true, type: true } } },
      });
    }
    if (!actor.companyId) {
      return this.prisma.supportTicket.findMany({
        where: { openedBy: actor.id },
        orderBy: { createdAt: 'desc' },
      });
    }
    return this.prisma.supportTicket.findMany({
      where: { companyId: actor.companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByIdForActor(id: string, actor: AuthUser) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: { company: { select: { nameAr: true, type: true } } },
    });
    if (!ticket) throw new NotFoundException({ code: 'TICKET_NOT_FOUND', message: 'التذكرة غير موجودة' });
    if (actor.role === 'ADMIN' || actor.role === 'SUPER_ADMIN') return ticket;
    const isOwner = ticket.openedBy === actor.id || ticket.companyId === actor.companyId;
    if (!isOwner) throw new ForbiddenException({ code: 'FORBIDDEN', message: 'لا تملك صلاحية' });
    return ticket;
  }

  async create(input: CreateInput, actor: AuthUser) {
    return this.prisma.supportTicket.create({
      data: {
        subject: input.subject,
        category: input.category,
        description: input.description,
        attachments: input.attachments ?? [],
        openedBy: actor.id,
        companyId: actor.companyId ?? null,
        status: 'OPEN',
      },
    });
  }

  async update(id: string, data: UpdateInput) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException({ code: 'TICKET_NOT_FOUND', message: 'التذكرة غير موجودة' });
    return this.prisma.supportTicket.update({
      where: { id },
      data: {
        ...data,
        resolvedAt: data.status === 'RESOLVED' || data.status === 'CLOSED' ? new Date() : undefined,
      },
    });
  }
}
