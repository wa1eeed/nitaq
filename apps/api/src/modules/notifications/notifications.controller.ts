import { Controller, Get, Param, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser('id') userId: string, @Query() q: PaginationDto) {
    return this.notifications.list(userId, q);
  }

  @Put('read-all')
  markAll(@CurrentUser('id') userId: string) {
    return this.notifications.markAllRead(userId);
  }

  @Put(':id/read')
  markOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.notifications.markRead(userId, id);
  }
}
