import { Controller, Get } from '@nestjs/common';
import { Public } from '../decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Public()
  @Get()
  async check() {
    let db = 'unknown';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      db = 'up';
    } catch {
      db = 'down';
    }
    return {
      status: 'ok',
      service: 'naqla-api',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
      checks: { database: db },
    };
  }
}
