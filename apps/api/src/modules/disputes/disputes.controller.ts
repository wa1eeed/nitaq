import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, MinLength } from 'class-validator';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Audit } from '../../common/audit/audit.decorator';
import { DisputesService } from './disputes.service';

/**
 * Body for client/carrier opening a dispute on one of their orders.
 * `reason` is a short tag (e.g. "DAMAGE", "DELAY"). `description` is the
 * free-text narrative the user types into the form.
 */
class CreateDisputeDto {
  @IsString() orderId!: string;
  @IsString() @MinLength(2) reason!: string;
  @IsString() @MinLength(10) description!: string;
  @IsOptional() @IsArray() attachments?: string[];
}

@ApiTags('disputes')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles('CLIENT_ADMIN', 'CLIENT_USER', 'PROVIDER_ADMIN', 'PROVIDER_USER', 'ADMIN', 'SUPER_ADMIN')
@Controller('disputes')
export class DisputesController {
  constructor(private disputes: DisputesService) {}

  /**
   * List the caller's own disputes (scoped by company). Admins see everything
   * — they have a dedicated /admin/disputes endpoint with pagination and
   * filtering. This one is for client + carrier portals.
   */
  @Get()
  list(@CurrentUser() actor: AuthUser) {
    return this.disputes.listForActor(actor);
  }

  @Get(':id')
  byId(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.disputes.findByIdForActor(id, actor);
  }

  /**
   * Open a dispute on an order. Caller must be the client or carrier on the
   * order. One dispute per order (schema-level unique on orderId).
   */
  @Post()
  @Audit({ action: 'dispute.create', resourceType: 'Dispute' })
  create(@Body() dto: CreateDisputeDto, @CurrentUser() actor: AuthUser) {
    return this.disputes.create(dto, actor);
  }
}
