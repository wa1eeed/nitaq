import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { FleetService } from './fleet.service';
import { CreateDriverDto, CreateTruckDto, InviteDriverDto, LocationDto, UpdateTruckDto } from './dto/fleet.dto';

@ApiTags('fleet')
@ApiBearerAuth()
@Controller('fleet')
export class FleetController {
  constructor(private fleet: FleetService) {}

  @Get('trucks')
  listTrucks(@Query() q: PaginationDto, @CurrentUser() actor: AuthUser) {
    return this.fleet.listTrucks(q, actor);
  }
  @Post('trucks')
  createTruck(@Body() dto: CreateTruckDto, @CurrentUser() actor: AuthUser) {
    return this.fleet.createTruck(dto, actor);
  }
  @Get('trucks/:id')
  getTruck(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.fleet.getTruck(id, actor);
  }
  @Put('trucks/:id')
  updateTruck(@Param('id') id: string, @Body() dto: UpdateTruckDto, @CurrentUser() actor: AuthUser) {
    return this.fleet.updateTruck(id, dto, actor);
  }

  @Get('drivers')
  listDrivers(@Query() q: PaginationDto, @CurrentUser() actor: AuthUser) {
    return this.fleet.listDrivers(q, actor);
  }
  @Post('drivers')
  createDriver(@Body() dto: CreateDriverDto, @CurrentUser() actor: AuthUser) {
    return this.fleet.createDriver(dto, actor);
  }
  @Post('drivers/invite')
  inviteDriver(@Body() dto: InviteDriverDto, @CurrentUser() actor: AuthUser) {
    return this.fleet.inviteDriver(dto, actor);
  }
  @Get('drivers/available')
  getAvailableDrivers(@CurrentUser() actor: AuthUser) {
    return this.fleet.getAvailableDrivers(actor);
  }

  @Get('drivers/:id')
  getDriver(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.fleet.getDriver(id, actor);
  }
  @Post('drivers/:id/location')
  updateLocation(@Param('id') id: string, @Body() dto: LocationDto, @CurrentUser() actor: AuthUser) {
    return this.fleet.updateDriverLocation(id, dto, actor);
  }
}
