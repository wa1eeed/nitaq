import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import type { AuthUser } from '../../common/decorators/current-user.decorator';

export interface SubmitReviewInput {
  rating: number;
  comment?: string;
  onTime?: boolean;
  cargoCondition?: boolean;
  communication?: boolean;
}

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Submit a review for a completed order.
   * The actor must be a party on the order (client or provider).
   * Client reviews the provider; provider reviews the client.
   * Only one review per order (unique constraint on orderId).
   */
  async submitReview(orderId: string, actorCompanyId: string, dto: SubmitReviewInput) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, orderNumber: true, status: true, clientId: true, providerId: true },
    });

    if (!order) {
      throw new NotFoundException({ code: 'ORDER_NOT_FOUND', message: 'الطلب غير موجود' });
    }

    if (order.status !== 'COMPLETED') {
      throw new BadRequestException({
        code: 'ORDER_NOT_COMPLETED',
        message: 'لا يمكن تقييم طلب غير مكتمل',
      });
    }

    const isClient = order.clientId === actorCompanyId;
    const isProvider = order.providerId === actorCompanyId;

    if (!isClient && !isProvider) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'لست طرفاً في هذا الطلب' });
    }

    const reviewerId = actorCompanyId;
    // Client reviews the provider; provider reviews the client
    const reviewedId = isClient ? (order.providerId as string) : order.clientId;

    if (!reviewedId) {
      throw new BadRequestException({
        code: 'NO_COUNTERPART',
        message: 'لا يوجد طرف آخر لتقييمه',
      });
    }

    const existing = await this.prisma.review.findUnique({ where: { orderId } });
    if (existing) {
      throw new ConflictException({
        code: 'REVIEW_EXISTS',
        message: 'تم تقييم هذا الطلب مسبقاً',
      });
    }

    return this.prisma.review.create({
      data: {
        orderId,
        reviewerId,
        reviewedId,
        rating: dto.rating,
        comment: dto.comment,
        onTime: dto.onTime,
        cargoCondition: dto.cargoCondition,
        communication: dto.communication,
      },
      include: {
        reviewer: { select: { id: true, nameAr: true, nameEn: true } },
        reviewed: { select: { id: true, nameAr: true, nameEn: true } },
        order: { select: { orderNumber: true } },
      },
    });
  }

  /** Return all reviews for a given order (at most one due to unique constraint). */
  async getOrderReviews(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true },
    });
    if (!order) {
      throw new NotFoundException({ code: 'ORDER_NOT_FOUND', message: 'الطلب غير موجود' });
    }

    return this.prisma.review.findMany({
      where: { orderId },
      include: {
        reviewer: { select: { id: true, nameAr: true, nameEn: true } },
        reviewed: { select: { id: true, nameAr: true, nameEn: true } },
        order: { select: { orderNumber: true } },
      },
    });
  }

  /**
   * Paginated list of reviews received by a company, plus an average rating
   * aggregate.
   */
  async getCompanyReviews(companyId: string, page: number, limit: number) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true },
    });
    if (!company) {
      throw new NotFoundException({ code: 'COMPANY_NOT_FOUND', message: 'الشركة غير موجودة' });
    }

    const skip = (page - 1) * limit;

    const [reviews, total, aggregate] = await Promise.all([
      this.prisma.review.findMany({
        where: { reviewedId: companyId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reviewer: { select: { id: true, nameAr: true, nameEn: true } },
          order: { select: { orderNumber: true } },
        },
      }),
      this.prisma.review.count({ where: { reviewedId: companyId } }),
      this.prisma.review.aggregate({
        where: { reviewedId: companyId },
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);

    return {
      data: reviews,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        averageRating: aggregate._avg.rating ?? null,
        reviewCount: aggregate._count.rating,
      },
    };
  }
}
