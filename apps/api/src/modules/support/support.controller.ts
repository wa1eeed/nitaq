import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsArray, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Audit } from '../../common/audit/audit.decorator';
import { SupportService } from './support.service';

const CATEGORIES = ['TECHNICAL', 'BILLING', 'ACCOUNT', 'ORDER', 'GENERAL'] as const;
const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const;

class CreateTicketDto {
  @IsString() @MinLength(3) subject!: string;
  @IsIn(CATEGORIES) category!: (typeof CATEGORIES)[number];
  @IsString() @MinLength(10) description!: string;
  @IsOptional() @IsArray() attachments?: string[];
}

class UpdateTicketDto {
  @IsOptional() @IsIn(STATUSES) status?: (typeof STATUSES)[number];
  @IsOptional() @IsString() resolution?: string;
  @IsOptional() @IsString() assignedTo?: string;
}

@ApiTags('support')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles('CLIENT_ADMIN', 'CLIENT_USER', 'CARRIER_ADMIN', 'CARRIER_USER', 'ADMIN', 'SUPER_ADMIN')
@Controller('support/tickets')
export class SupportController {
  constructor(private support: SupportService) {}

  /** List own tickets (admins see everything). */
  @Get()
  list(@CurrentUser() actor: AuthUser) {
    return this.support.listForActor(actor);
  }

  @Get(':id')
  byId(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.support.findByIdForActor(id, actor);
  }

  @Post()
  @Audit({ action: 'support.ticket.create', resourceType: 'SupportTicket' })
  create(@Body() dto: CreateTicketDto, @CurrentUser() actor: AuthUser) {
    return this.support.create(dto, actor);
  }

  /** Admin-only: update status + assign + resolve. */
  @Put(':id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Audit({ action: 'support.ticket.update', resourceType: 'SupportTicket', idFrom: 'param', idKey: 'id' })
  update(@Param('id') id: string, @Body() dto: UpdateTicketDto) {
    return this.support.update(id, dto);
  }
}
