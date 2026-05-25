import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class TrackingService {
  constructor(private prisma: PrismaService) {}

  async driverHistory(driverId: string, from?: string, to?: string) {
    return this.prisma.locationHistory.findMany({
      where: {
        driverId,
        ...(from || to ? {
          recordedAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        } : {}),
      },
      orderBy: { recordedAt: 'asc' },
      take: 1000,
    });
  }
}
