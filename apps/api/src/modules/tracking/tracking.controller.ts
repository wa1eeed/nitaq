import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TrackingService } from './tracking.service';

@ApiTags('tracking')
@ApiBearerAuth()
@Controller('tracking')
export class TrackingController {
  constructor(private tracking: TrackingService) {}

  @Get('drivers/:id/history')
  history(
    @Param('id') id: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.tracking.driverHistory(id, from, to);
  }
}
