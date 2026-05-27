import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';
import type { CompanyStatus, DisputeStatus, Prisma } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async dashboardStats() {
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(); startOfWeek.setDate(startOfWeek.getDate() - 7);
    const startOfMonth = new Date(); startOfMonth.setDate(startOfMonth.getDate() - 30);

    const [
      ordersToday, ordersWeek, ordersMonth,
      revenueAgg, activeCompanies, processingOrders, openDisputes,
      activeDrivers,
      recentOrders,
    ] = await Promise.all([
      this.prisma.order.count({ where: { createdAt: { gte: startOfDay } } }),
      this.prisma.order.count({ where: { createdAt: { gte: startOfWeek } } }),
      this.prisma.order.count({ where: { createdAt: { gte: startOfMonth } } }),
      this.prisma.order.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { agreedPrice: true, commissionAmount: true },
      }),
      this.prisma.company.count({ where: { status: 'ACTIVE' } }),
      this.prisma.order.count({ where: { status: { in: ['PUBLISHED', 'BIDDING', 'ASSIGNED', 'CONFIRMED', 'IN_TRANSIT'] } } }),
      this.prisma.dispute.count({ where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } } }),
      this.prisma.employeeProfile.count({ where: { status: 'ON_ASSIGNMENT' } }),
      this.prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { nameAr: true } },
          provider: { select: { nameAr: true } },
        },
      }),
    ]);

    return {
      orders: { today: ordersToday, week: ordersWeek, month: ordersMonth },
      revenue: {
        gmv: revenueAgg._sum.agreedPrice ?? 0,
        commission: revenueAgg._sum.commissionAmount ?? 0,
      },
      activeCompanies,
      processingOrders,
      openDisputes,
      activeDrivers,
      recentOrders,
    };
  }

  async listDrivers(query: PaginationDto) {
    const { page = 1, limit = 20, search } = query;
    const where = search
      ? {
          OR: [
            { user: { firstName: { contains: search, mode: 'insensitive' as const } } },
            { user: { lastName:  { contains: search, mode: 'insensitive' as const } } },
            { user: { phone:     { contains: search } } },
            { company: { nameAr: { contains: search, mode: 'insensitive' as const } } },
          ],
        }
      : {};
    const [items, total] = await Promise.all([
      this.prisma.employeeProfile.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, phone: true, nationalId: true } },
          company: { select: { id: true, nameAr: true } },
          orderEmployees: {
            where: { order: { status: { in: ['ASSIGNED', 'CONFIRMED', 'IN_TRANSIT'] } } },
            orderBy: { assignedAt: 'desc' },
            take: 1,
            include: {
              order: { select: { id: true, orderNumber: true, status: true, originCity: true, destinationCity: true } },
            },
          },
        },
      }),
      this.prisma.employeeProfile.count({ where }),
    ]);
    return paginate(items, total, page, limit);
  }

  async listCompanies(query: PaginationDto, type?: string, status?: string) {
    const { page = 1, limit = 20, sort = 'createdAt', order = 'desc', search } = query;
    const where: Prisma.CompanyWhereInput = {
      ...(type ? { type: type as 'CLIENT' | 'PROVIDER' } : {}),
      ...(status ? { status: status as CompanyStatus } : {}),
      ...(search ? {
        OR: [
          { nameAr: { contains: search, mode: 'insensitive' as const } },
          { nameEn: { contains: search, mode: 'insensitive' as const } },
          { crNumber: { contains: search } },
        ],
      } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.company.findMany({
        where, skip: (page - 1) * limit, take: limit,
        orderBy: { [sort]: order },
      }),
      this.prisma.company.count({ where }),
    ]);
    return paginate(items, total, page, limit);
  }

  async updateCompanyStatus(id: string, status: CompanyStatus) {
    return this.prisma.company.update({ where: { id }, data: { status } });
  }

  async listOrders(query: PaginationDto, status?: string) {
    const { page = 1, limit = 20, sort = 'createdAt', order = 'desc', search } = query;
    const where: Prisma.OrderWhereInput = {
      ...(status ? { status: status as Prisma.OrderWhereInput['status'] } : {}),
      ...(search ? {
        OR: [
          { orderNumber: { contains: search } },
          { originCity: { contains: search } },
          { destinationCity: { contains: search } },
        ],
      } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where, skip: (page - 1) * limit, take: limit,
        orderBy: { [sort]: order },
        include: {
          client: { select: { nameAr: true } },
          provider: { select: { nameAr: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);
    return paginate(items, total, page, limit);
  }

  async listDisputes(query: PaginationDto, status?: string) {
    const { page = 1, limit = 20 } = query;
    const where: Prisma.DisputeWhereInput = status ? { status: status as DisputeStatus } : {};
    const [items, total] = await Promise.all([
      this.prisma.dispute.findMany({
        where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' },
        include: { order: { select: { orderNumber: true, clientId: true, providerId: true } } },
      }),
      this.prisma.dispute.count({ where }),
    ]);
    return paginate(items, total, page, limit);
  }

  async updateDispute(id: string, data: { status?: DisputeStatus; resolution?: string; assignedTo?: string }) {
    const dispute = await this.prisma.dispute.findUnique({ where: { id } });
    if (!dispute) throw new NotFoundException({ code: 'DISPUTE_NOT_FOUND', message: 'النزاع غير موجود' });
    return this.prisma.dispute.update({
      where: { id },
      data: {
        ...data,
        resolvedAt: data.status === 'RESOLVED' || data.status === 'CLOSED' ? new Date() : undefined,
      },
    });
  }

  async transactions(query: PaginationDto) {
    const { page = 1, limit = 20 } = query;
    const [items, total] = await Promise.all([
      this.prisma.transaction.findMany({
        skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' },
        include: { company: { select: { nameAr: true } } },
      }),
      this.prisma.transaction.count(),
    ]);
    return paginate(items, total, page, limit);
  }

  async manualWalletTransaction(
    companyId: string,
    dto: { kind: 'CREDIT' | 'DEBIT' | 'ADJUSTMENT'; amount: number; description: string; note?: string },
  ) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new Error('شركة غير موجودة');
    const delta = dto.kind === 'DEBIT' ? -dto.amount : dto.amount;
    const newBalance = company.walletBalance + delta;
    return this.prisma.$transaction(async (tx) => {
      await tx.company.update({ where: { id: companyId }, data: { walletBalance: newBalance } });
      return tx.transaction.create({
        data: {
          companyId,
          type: `ADMIN_${dto.kind}`,
          amount: delta,
          balance: newBalance,
          description: dto.note ? `${dto.description} — ${dto.note}` : dto.description,
        },
      });
    });
  }

  async getSettings() {
    return this.prisma.setting.findMany({ orderBy: { category: 'asc' } });
  }

  async updateSettings(updates: { key: string; value: string }[]) {
    await Promise.all(
      updates.map((u) =>
        this.prisma.setting.upsert({
          where: { key: u.key },
          create: { key: u.key, value: u.value },
          update: { value: u.value },
        }),
      ),
    );
    return this.getSettings();
  }

  // ─── Analytics helpers ─────────────────────────────────────────────

  private periodDates(period: string): { from: Date; to: Date } {
    const to = new Date();
    const from = new Date();
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    from.setDate(from.getDate() - days);
    return { from, to };
  }

  private prevPeriodDates(period: string): { from: Date; to: Date } {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    const to = new Date();
    to.setDate(to.getDate() - days);
    const from = new Date(to);
    from.setDate(from.getDate() - days);
    return { from, to };
  }

  private buildDailyTrend(
    rows: { createdAt: Date; value: number }[],
    from: Date,
    buckets: number,
    bucketDays: number,
  ) {
    const result: { label: string; value: number }[] = [];
    for (let i = 0; i < buckets; i++) {
      const bucketStart = new Date(from);
      bucketStart.setDate(bucketStart.getDate() + i * bucketDays);
      const bucketEnd = new Date(bucketStart);
      bucketEnd.setDate(bucketEnd.getDate() + bucketDays);
      const value = rows
        .filter((r) => r.createdAt >= bucketStart && r.createdAt < bucketEnd)
        .reduce((s, r) => s + r.value, 0);
      result.push({
        label: bucketStart.toISOString().slice(0, 10),
        value,
      });
    }
    return result;
  }

  async getMarketplaceKPIs(period: string) {
    const { from, to } = this.periodDates(period);

    const [completedAgg, cancelledCount, allOrders, totalCarriers, activeCarriers, bids] =
      await Promise.all([
        this.prisma.order.aggregate({
          where: { status: { in: ['COMPLETED', 'DELIVERED'] }, createdAt: { gte: from, lte: to } },
          _sum: { agreedPrice: true, commissionAmount: true },
          _count: { _all: true },
        }),
        this.prisma.order.count({ where: { status: 'CANCELLED', createdAt: { gte: from, lte: to } } }),
        this.prisma.order.findMany({
          where: { createdAt: { gte: from, lte: to } },
          select: { id: true, status: true, clientId: true, originCity: true, destinationCity: true, agreedPrice: true, commissionAmount: true, providerId: true },
        }),
        this.prisma.company.count({ where: { type: 'PROVIDER', status: 'ACTIVE' } }),
        this.prisma.company.count({
          where: {
            type: 'PROVIDER',
            ordersAsProvider: { some: { status: { in: ['ASSIGNED', 'CONFIRMED', 'IN_TRANSIT'] } } },
          },
        }),
        this.prisma.bid.findMany({
          where: { createdAt: { gte: from, lte: to } },
          select: { orderId: true, providerId: true, createdAt: true, order: { select: { createdAt: true } } },
          orderBy: { createdAt: 'asc' },
        }),
      ]);

    const gmv = completedAgg._sum.agreedPrice ?? 0;
    const commission = completedAgg._sum.commissionAmount ?? 0;
    const completedCount = completedAgg._count._all;
    const takeRate = gmv > 0 ? (commission / gmv) * 100 : 0;
    const completionRate =
      completedCount + cancelledCount > 0
        ? (completedCount / (completedCount + cancelledCount)) * 100
        : 0;

    // Supply liquidity
    const bidsByOrder = new Map<string, number>();
    const firstBidTimes: number[] = [];
    const seenOrders = new Set<string>();
    for (const bid of bids) {
      bidsByOrder.set(bid.orderId, (bidsByOrder.get(bid.orderId) ?? 0) + 1);
      if (!seenOrders.has(bid.orderId)) {
        seenOrders.add(bid.orderId);
        firstBidTimes.push((bid.createdAt.getTime() - bid.order.createdAt.getTime()) / 3_600_000);
      }
    }
    const supplyLiquidity =
      bidsByOrder.size > 0
        ? Array.from(bidsByOrder.values()).reduce((a, b) => a + b, 0) / bidsByOrder.size
        : 0;
    const avgMatchingHours =
      firstBidTimes.length > 0 ? firstBidTimes.reduce((a, b) => a + b, 0) / firstBidTimes.length : 0;

    const carrierUtilization = totalCarriers > 0 ? (activeCarriers / totalCarriers) * 100 : 0;

    // Repeat rate
    const clientOrderCounts = new Map<string, number>();
    const statusCounts = new Map<string, number>();
    const routeMap = new Map<string, { count: number; gmv: number }>();
    const carrierRevMap = new Map<string, { revenue: number; count: number }>();
    for (const o of allOrders) {
      clientOrderCounts.set(o.clientId, (clientOrderCounts.get(o.clientId) ?? 0) + 1);
      statusCounts.set(o.status, (statusCounts.get(o.status) ?? 0) + 1);
      const rKey = `${o.originCity}→${o.destinationCity}`;
      const rv = routeMap.get(rKey) ?? { count: 0, gmv: 0 };
      rv.count++; rv.gmv += o.agreedPrice ?? 0;
      routeMap.set(rKey, rv);
      if (o.providerId && (o.status === 'COMPLETED' || o.status === 'DELIVERED')) {
        const cv = carrierRevMap.get(o.providerId) ?? { revenue: 0, count: 0 };
        cv.revenue += o.agreedPrice ?? 0; cv.count++;
        carrierRevMap.set(o.providerId, cv);
      }
    }
    const totalClients = clientOrderCounts.size;
    const repeatClients = Array.from(clientOrderCounts.values()).filter((c) => c > 1).length;
    const repeatRate = totalClients > 0 ? (repeatClients / totalClients) * 100 : 0;

    const topRoutes = Array.from(routeMap.entries())
      .map(([route, v]) => ({ route, ...v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const carrierIds = Array.from(carrierRevMap.keys()).slice(0, 5);
    const carrierNames = carrierIds.length
      ? await this.prisma.company.findMany({ where: { id: { in: carrierIds } }, select: { id: true, nameAr: true } })
      : [];
    const nameMap = new Map(carrierNames.map((c) => [c.id, c.nameAr]));
    const topCarriers = Array.from(carrierRevMap.entries())
      .map(([id, v]) => ({ carrierId: id, name: nameMap.get(id) ?? 'غير معروف', ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      gmv, commission, takeRate, completionRate,
      avgMatchingHours, carrierUtilization, supplyLiquidity, repeatRate,
      ordersByStatus: Object.fromEntries(statusCounts),
      topRoutes, topCarriers,
    };
  }

  async getFinancialKPIs(period: string) {
    const { from, to } = this.periodDates(period);
    const { from: prevFrom, to: prevTo } = this.prevPeriodDates(period);
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    const bucketDays = period === '1y' ? 30 : period === '90d' ? 7 : 1;
    const buckets = Math.ceil(days / bucketDays);

    const [completedAgg, prevAgg, completedOrders] = await Promise.all([
      this.prisma.order.aggregate({
        where: { status: { in: ['COMPLETED', 'DELIVERED'] }, createdAt: { gte: from, lte: to } },
        _sum: { agreedPrice: true, commissionAmount: true },
        _count: { _all: true },
      }),
      this.prisma.order.aggregate({
        where: { status: { in: ['COMPLETED', 'DELIVERED'] }, createdAt: { gte: prevFrom, lte: prevTo } },
        _sum: { agreedPrice: true, commissionAmount: true },
        _count: { _all: true },
      }),
      this.prisma.order.findMany({
        where: { status: { in: ['COMPLETED', 'DELIVERED'] }, createdAt: { gte: from, lte: to } },
        select: { createdAt: true, agreedPrice: true, commissionAmount: true },
      }),
    ]);

    const gmv = completedAgg._sum.agreedPrice ?? 0;
    const revenue = completedAgg._sum.commissionAmount ?? 0;
    const orderCount = completedAgg._count._all;
    const prevGmv = prevAgg._sum.agreedPrice ?? 0;
    const prevRevenue = prevAgg._sum.commissionAmount ?? 0;
    const vat = revenue * 0.15;
    const avgOrderValue = orderCount > 0 ? gmv / orderCount : 0;
    const gmvGrowth = prevGmv > 0 ? ((gmv - prevGmv) / prevGmv) * 100 : 0;
    const revenueGrowth = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;
    const takeRate = gmv > 0 ? (revenue / gmv) * 100 : 0;

    const gmvRows = completedOrders.map((o) => ({ createdAt: o.createdAt, value: o.agreedPrice ?? 0 }));
    const revRows = completedOrders.map((o) => ({ createdAt: o.createdAt, value: o.commissionAmount ?? 0 }));
    const gmvTrend = this.buildDailyTrend(gmvRows, from, buckets, bucketDays);
    const revTrend = this.buildDailyTrend(revRows, from, buckets, bucketDays);

    return { gmv, revenue, vat, avgOrderValue, takeRate, gmvGrowth, revenueGrowth, gmvTrend, revTrend };
  }

  async getOperationalKPIs(period: string) {
    const { from, to } = this.periodDates(period);

    const [completedOrders, allOrdersCount, disputes, totalDisputes, kycDocs, totalDrivers, availableDrivers] =
      await Promise.all([
        this.prisma.order.findMany({
          where: { status: { in: ['COMPLETED', 'DELIVERED'] }, createdAt: { gte: from, lte: to } },
          select: { createdAt: true, updatedAt: true, deliveryDate: true },
        }),
        this.prisma.order.count({ where: { createdAt: { gte: from, lte: to } } }),
        this.prisma.dispute.count({ where: { createdAt: { gte: from, lte: to } } }),
        this.prisma.dispute.count({ where: { createdAt: { gte: from, lte: to } } }),
        this.prisma.kYCDocument.findMany({
          where: { createdAt: { gte: from, lte: to } },
          select: { status: true },
        }),
        this.prisma.employeeProfile.count(),
        this.prisma.employeeProfile.count({ where: { status: 'AVAILABLE' } }),
      ]);

    const onTimeCount = completedOrders.filter(
      (o) => o.deliveryDate && o.updatedAt <= new Date(o.deliveryDate),
    ).length;
    const onTimeDeliveryRate =
      completedOrders.length > 0 ? (onTimeCount / completedOrders.length) * 100 : 0;
    const disputeRate = allOrdersCount > 0 ? (disputes / allOrdersCount) * 100 : 0;

    const deliveryTimesMs = completedOrders.map((o) => o.updatedAt.getTime() - o.createdAt.getTime());
    const avgDeliveryDays =
      deliveryTimesMs.length > 0
        ? deliveryTimesMs.reduce((a, b) => a + b, 0) / deliveryTimesMs.length / 86_400_000
        : 0;

    const approvedKyc = kycDocs.filter((d) => d.status === 'APPROVED').length;
    const kycApprovalRate = kycDocs.length > 0 ? (approvedKyc / kycDocs.length) * 100 : 0;
    const fleetAvailability = totalDrivers > 0 ? (availableDrivers / totalDrivers) * 100 : 0;

    return {
      onTimeDeliveryRate,
      disputeRate,
      avgDeliveryDays,
      kycApprovalRate,
      fleetAvailability,
      completedOrders: completedOrders.length,
      openDisputes: totalDisputes,
    };
  }

  async getGrowthKPIs(period: string) {
    const { from, to } = this.periodDates(period);
    const { from: prevFrom, to: prevTo } = this.prevPeriodDates(period);

    const [newClients, prevClients, newCarriers, prevCarriers, ordersNow, ordersPrev, ordersGmvNow, ordersGmvPrev, activeCities] =
      await Promise.all([
        this.prisma.company.count({ where: { type: 'CLIENT', createdAt: { gte: from, lte: to } } }),
        this.prisma.company.count({ where: { type: 'CLIENT', createdAt: { gte: prevFrom, lte: prevTo } } }),
        this.prisma.company.count({ where: { type: 'PROVIDER', createdAt: { gte: from, lte: to } } }),
        this.prisma.company.count({ where: { type: 'PROVIDER', createdAt: { gte: prevFrom, lte: prevTo } } }),
        this.prisma.order.count({ where: { createdAt: { gte: from, lte: to } } }),
        this.prisma.order.count({ where: { createdAt: { gte: prevFrom, lte: prevTo } } }),
        this.prisma.order.aggregate({
          where: { status: { in: ['COMPLETED', 'DELIVERED'] }, createdAt: { gte: from, lte: to } },
          _sum: { agreedPrice: true },
        }),
        this.prisma.order.aggregate({
          where: { status: { in: ['COMPLETED', 'DELIVERED'] }, createdAt: { gte: prevFrom, lte: prevTo } },
          _sum: { agreedPrice: true },
        }),
        this.prisma.order.findMany({
          where: { status: { in: ['PUBLISHED', 'BIDDING', 'ASSIGNED', 'CONFIRMED', 'IN_TRANSIT'] } },
          select: { originCity: true },
          distinct: ['originCity'],
        }),
      ]);

    const gmvNow = ordersGmvNow._sum.agreedPrice ?? 0;
    const gmvPrev = ordersGmvPrev._sum.agreedPrice ?? 0;
    const clientsMoM = prevClients > 0 ? ((newClients - prevClients) / prevClients) * 100 : 0;
    const carriersMoM = prevCarriers > 0 ? ((newCarriers - prevCarriers) / prevCarriers) * 100 : 0;
    const ordersMoM = ordersPrev > 0 ? ((ordersNow - ordersPrev) / ordersPrev) * 100 : 0;
    const gmvMoM = gmvPrev > 0 ? ((gmvNow - gmvPrev) / gmvPrev) * 100 : 0;

    return {
      newClients, prevClients, clientsMoM,
      newCarriers, prevCarriers, carriersMoM,
      ordersNow, ordersPrev, ordersMoM,
      gmvNow, gmvPrev, gmvMoM,
      geographicCoverage: activeCities.length,
    };
  }

  async getInvestorKPIs(period: string) {
    const { from, to } = this.periodDates(period);

    const [clientSpend, totalClients, prevMonthClients, thisMonthClients, orderCount, prevOrderCount] =
      await Promise.all([
        this.prisma.order.groupBy({
          by: ['clientId'],
          where: { status: { in: ['COMPLETED', 'DELIVERED'] } },
          _sum: { agreedPrice: true },
        }),
        this.prisma.company.count({ where: { type: 'CLIENT' } }),
        this.prisma.company.count({
          where: {
            type: 'CLIENT',
            createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1), lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
          },
        }),
        this.prisma.company.count({
          where: {
            type: 'CLIENT',
            createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
          },
        }),
        this.prisma.order.count({ where: { createdAt: { gte: from, lte: to } } }),
        this.prisma.order.count({
          where: { createdAt: { gte: this.prevPeriodDates(period).from, lte: this.prevPeriodDates(period).to } },
        }),
      ]);

    const totalSpend = clientSpend.reduce((s, c) => s + (c._sum.agreedPrice ?? 0), 0);
    const ltv = totalClients > 0 ? totalSpend / totalClients : 0;

    // Cohort retention: clients who placed order in prev period AND current period
    const [prevPeriodClientIds, currentPeriodClientIds] = await Promise.all([
      this.prisma.order.findMany({
        where: { createdAt: { gte: this.prevPeriodDates(period).from, lte: this.prevPeriodDates(period).to } },
        select: { clientId: true },
        distinct: ['clientId'],
      }),
      this.prisma.order.findMany({
        where: { createdAt: { gte: from, lte: to } },
        select: { clientId: true },
        distinct: ['clientId'],
      }),
    ]);
    const prevSet = new Set(prevPeriodClientIds.map((o) => o.clientId));
    const currSet = new Set(currentPeriodClientIds.map((o) => o.clientId));
    const retained = Array.from(prevSet).filter((id) => currSet.has(id)).length;
    const cohortRetention = prevSet.size > 0 ? (retained / prevSet.size) * 100 : 0;

    const carrierGrowth = prevMonthClients > 0 ? ((thisMonthClients - prevMonthClients) / prevMonthClients) * 100 : 0;
    const orderGrowth = prevOrderCount > 0 ? ((orderCount - prevOrderCount) / prevOrderCount) * 100 : 0;
    const networkEffectScore = orderGrowth > 0 && carrierGrowth > 0 ? orderGrowth / carrierGrowth : 1;

    const TOTAL_KSA_CITIES = 20;
    const activeCities = await this.prisma.order.findMany({
      where: { createdAt: { gte: from, lte: to } },
      select: { originCity: true },
      distinct: ['originCity'],
    });
    const marketPenetration = (activeCities.length / TOTAL_KSA_CITIES) * 100;

    return {
      ltv,
      cohortRetention,
      networkEffectScore,
      marketPenetration,
      activeClientsCount: currSet.size,
    };
  }

  async getExecutiveSummary(period: string) {
    const [marketplace, financial, operational, growth] = await Promise.all([
      this.getMarketplaceKPIs(period),
      this.getFinancialKPIs(period),
      this.getOperationalKPIs(period),
      this.getGrowthKPIs(period),
    ]);
    return {
      period,
      gmv: marketplace.gmv,
      revenue: financial.revenue,
      takeRate: marketplace.takeRate,
      completionRate: marketplace.completionRate,
      onTimeDeliveryRate: operational.onTimeDeliveryRate,
      disputeRate: operational.disputeRate,
      ordersMoM: growth.ordersMoM,
      gmvMoM: growth.gmvMoM,
      newClients: growth.newClients,
      newCarriers: growth.newCarriers,
      topRoutes: marketplace.topRoutes.slice(0, 3),
      topCarriers: marketplace.topCarriers.slice(0, 3),
      generatedAt: new Date().toISOString(),
    };
  }
}
