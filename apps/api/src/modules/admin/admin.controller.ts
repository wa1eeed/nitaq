import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsArray, IsIn, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Audit } from '../../common/audit/audit.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { AdminService } from './admin.service';
import type { CompanyStatus, DisputeStatus } from '@prisma/client';

class CompanyStatusDto {
  @IsIn(['PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'REJECTED'])
  status!: CompanyStatus;
}

class DisputeUpdateDto {
  @IsOptional() @IsIn(['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED']) status?: DisputeStatus;
  @IsOptional() @IsString() resolution?: string;
  @IsOptional() @IsString() assignedTo?: string;
}

class ManualTransactionDto {
  @IsIn(['CREDIT', 'DEBIT', 'ADJUSTMENT']) kind!: 'CREDIT' | 'DEBIT' | 'ADJUSTMENT';
  @IsNumber() @Min(0.01) amount!: number;
  @IsString() description!: string;
  @IsOptional() @IsString() note?: string;
}

class SettingEntryDto {
  @IsString() key!: string;
  @IsString() value!: string;
}

class SettingsUpdateDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => SettingEntryDto)
  settings!: SettingEntryDto[];
}

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private admin: AdminService) {}

  @Get('dashboard/stats')
  stats() {
    return this.admin.dashboardStats();
  }

  @Get('companies')
  companies(@Query() q: PaginationDto, @Query('type') type?: string, @Query('status') status?: string) {
    return this.admin.listCompanies(q, type, status);
  }

  @Put('companies/:id/status')
  @Audit({ action: 'admin.company.status_change', resourceType: 'Company', idFrom: 'param', idKey: 'id' })
  setStatus(@Param('id') id: string, @Body() dto: CompanyStatusDto) {
    return this.admin.updateCompanyStatus(id, dto.status);
  }

  @Get('drivers')
  drivers(@Query() q: PaginationDto) {
    return this.admin.listDrivers(q);
  }

  @Get('orders')
  orders(@Query() q: PaginationDto, @Query('status') status?: string) {
    return this.admin.listOrders(q, status);
  }

  @Get('disputes')
  disputes(@Query() q: PaginationDto, @Query('status') status?: string) {
    return this.admin.listDisputes(q, status);
  }

  @Put('disputes/:id')
  @Audit({ action: 'admin.dispute.update', resourceType: 'Dispute', idFrom: 'param', idKey: 'id' })
  updateDispute(@Param('id') id: string, @Body() dto: DisputeUpdateDto) {
    return this.admin.updateDispute(id, dto);
  }

  @Get('transactions')
  transactions(@Query() q: PaginationDto) {
    return this.admin.transactions(q);
  }

  @Get('analytics/marketplace')
  analyticsMarketplace(@Query('period') period = '30d') {
    return this.admin.getMarketplaceKPIs(period);
  }

  @Get('analytics/financial')
  analyticsFinancial(@Query('period') period = '30d') {
    return this.admin.getFinancialKPIs(period);
  }

  @Get('analytics/operational')
  analyticsOperational(@Query('period') period = '30d') {
    return this.admin.getOperationalKPIs(period);
  }

  @Get('analytics/growth')
  analyticsGrowth(@Query('period') period = '30d') {
    return this.admin.getGrowthKPIs(period);
  }

  @Get('analytics/investor')
  analyticsInvestor(@Query('period') period = '30d') {
    return this.admin.getInvestorKPIs(period);
  }

  @Get('analytics/summary')
  analyticsSummary(@Query('period') period = '30d') {
    return this.admin.getExecutiveSummary(period);
  }

  @Get('settings')
  getSettings() {
    return this.admin.getSettings();
  }

  @Put('settings')
  @Audit({ action: 'admin.settings.update', resourceType: 'Setting' })
  updateSettings(@Body() dto: SettingsUpdateDto) {
    return this.admin.updateSettings(dto.settings);
  }

  @Post('wallets/:companyId/transactions')
  @Audit({ action: 'admin.wallet.manualTx', resourceType: 'Transaction', idFrom: 'param', idKey: 'companyId' })
  manualWalletTransaction(
    @Param('companyId') companyId: string,
    @Body() dto: ManualTransactionDto,
  ) {
    return this.admin.manualWalletTransaction(companyId, dto);
  }
}
