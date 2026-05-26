import {
  Body, Controller, Delete, Get, Param, Post, Put, Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { Audit } from '../../common/audit/audit.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { OrdersService } from './orders.service';
import {
  AssignEmployeeDto, AssignOrderDto, CancelOrderDto, CreateOrderDto,
  CreateTrackingEventDto, UpdateOrderDto,
} from './dto/create-order.dto';
import type { OrderStatus } from '../../generated/prisma';

const ORDER_STATUS = [
  'DRAFT','PUBLISHED','BIDDING','ASSIGNED','CONFIRMED',
  'IN_TRANSIT','DELIVERED','COMPLETED','CANCELLED','DISPUTED',
] as const;

class OrdersQueryDto extends PaginationDto {
  @IsOptional() @IsEnum(ORDER_STATUS) status?: OrderStatus;
  @IsOptional() @Transform(({ value }) => value === 'true' || value === true) @IsBoolean() mine?: boolean;
}

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private orders: OrdersService) {}

  @Get()
  list(@Query() q: OrdersQueryDto, @CurrentUser() actor: AuthUser) {
    return this.orders.list(q, actor);
  }

  @Post()
  @Audit({ action: 'order.create', resourceType: 'Order', idFrom: 'response' })
  create(@Body() dto: CreateOrderDto, @CurrentUser() actor: AuthUser) {
    return this.orders.create(dto, actor);
  }

  @Get(':id')
  byId(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.orders.findById(id, actor);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateOrderDto, @CurrentUser() actor: AuthUser) {
    return this.orders.update(id, dto, actor);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.orders.remove(id, actor);
  }

  @Post(':id/publish')
  @Audit({ action: 'order.publish', resourceType: 'Order', idFrom: 'param', idKey: 'id' })
  publish(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.orders.publish(id, actor);
  }

  @Post(':id/assign')
  @Audit({ action: 'order.assign', resourceType: 'Order', idFrom: 'param', idKey: 'id' })
  assign(@Param('id') id: string, @Body() dto: AssignOrderDto, @CurrentUser() actor: AuthUser) {
    return this.orders.assign(id, dto, actor);
  }

  @Post(':id/confirm')
  @Audit({ action: 'order.confirm', resourceType: 'Order', idFrom: 'param', idKey: 'id' })
  confirm(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.orders.confirm(id, actor);
  }

  @Post(':id/cancel')
  @Audit({ action: 'order.cancel', resourceType: 'Order', idFrom: 'param', idKey: 'id' })
  cancel(@Param('id') id: string, @Body() dto: CancelOrderDto, @CurrentUser() actor: AuthUser) {
    return this.orders.cancel(id, dto, actor);
  }

  @Post(':id/deliver')
  @Audit({ action: 'order.deliver', resourceType: 'Order', idFrom: 'param', idKey: 'id' })
  deliver(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.orders.deliver(id, actor);
  }

  @Post(':id/complete')
  @Audit({ action: 'order.complete', resourceType: 'Order', idFrom: 'param', idKey: 'id' })
  complete(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.orders.complete(id, actor);
  }

  @Post(':id/decline-direct')
  @Audit({ action: 'order.declineDirect', resourceType: 'Order', idFrom: 'param', idKey: 'id' })
  declineDirect(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.orders.declineDirect(id, actor);
  }

  @Post(':id/assign-driver')
  @Audit({ action: 'order.assignDriver', resourceType: 'Order', idFrom: 'param', idKey: 'id' })
  assignDriver(@Param('id') id: string, @Body() dto: AssignEmployeeDto, @CurrentUser() actor: AuthUser) {
    return this.orders.assignDriver(id, dto, actor);
  }

  @Get(':id/tracking')
  getTracking(@Param('id') id: string) {
    return this.orders.getTracking(id);
  }

  @Post(':id/tracking')
  addTracking(
    @Param('id') id: string,
    @Body() dto: CreateTrackingEventDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.orders.addTrackingEvent(id, dto, actor);
  }
}
