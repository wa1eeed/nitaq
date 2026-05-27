import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';
import { Prisma, type NotificationType } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async list(userId: string, query: PaginationDto) {
    const { page = 1, limit = 20 } = query;
    const where = { userId };
    const [items, total, unread] = await Promise.all([
      this.prisma.notification.findMany({
        where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { ...where, isRead: false } }),
    ]);
    return { ...paginate(items, total, page, limit), unread };
  }

  async markRead(userId: string, id: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async create(payload: {
    userId: string;
    type: NotificationType;
    titleAr: string;
    bodyAr: string;
    titleEn?: string;
    bodyEn?: string;
    data?: Record<string, unknown>;
  }) {
    const { data, ...rest } = payload;
    return this.prisma.notification.create({
      data: {
        ...rest,
        data: data ? (data as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    });
  }
}
