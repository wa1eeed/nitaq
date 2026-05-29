import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Audit } from '../../common/audit/audit.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CompaniesService } from './companies.service';
import { TeamMembersService } from './team-members.service';
import { SubmitKycDto, UpdateCompanyDto } from './dto/update-company.dto';
import { InviteMemberDto, UpdateMemberDto } from './dto/team-member.dto';

function reqMeta(req: any) {
  const ip = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim()
    || req.ip || req.connection?.remoteAddress;
  return { ip, userAgent: req.headers['user-agent'] };
}

class CompaniesQueryDto extends PaginationDto {
  @IsOptional() @IsIn(['CLIENT', 'PROVIDER']) type?: 'CLIENT' | 'PROVIDER';
  @IsOptional() @IsString() status?: string;
}

class KycReviewDto {
  @IsIn(['APPROVED', 'REJECTED']) status!: 'APPROVED' | 'REJECTED';
  @IsOptional() @IsString() notes?: string;
}

@ApiTags('companies')
@ApiBearerAuth()
@Controller('companies')
export class CompaniesController {
  constructor(private companies: CompaniesService, private team: TeamMembersService) {}

  @Get()
  list(@Query() q: CompaniesQueryDto) {
    return this.companies.list(q, q.type, q.status);
  }

  @Get(':id')
  byId(@Param('id') id: string) {
    return this.companies.findById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCompanyDto, @CurrentUser() actor: AuthUser) {
    return this.companies.update(id, dto, actor);
  }

  @Post(':id/kyc')
  @Audit({ action: 'kyc.submit', resourceType: 'KYCDocument', idFrom: 'param', idKey: 'id' })
  submitKyc(@Param('id') id: string, @Body() dto: SubmitKycDto, @CurrentUser() actor: AuthUser) {
    return this.companies.submitKyc(id, dto, actor);
  }

  @Get(':id/kyc')
  listKyc(@Param('id') id: string) {
    return this.companies.listKyc(id);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Audit({ action: 'kyc.review', resourceType: 'KYCDocument', idFrom: 'param', idKey: 'docId' })
  @Put(':id/kyc/:docId/status')
  reviewKyc(@Param('docId') docId: string, @Body() dto: KycReviewDto, @CurrentUser('id') userId: string) {
    return this.companies.reviewKyc(docId, dto.status, dto.notes, userId);
  }

  @Get(':id/stats')
  stats(@Param('id') id: string) {
    return this.companies.stats(id);
  }

  // ─── Team members ────────────────────────────────────────────
  // Authorisation is enforced inside the service (assertManager) since the
  // route-level check would need `req.user.companyRole` which JwtAuthGuard
  // already populates from the JWT payload.

  @Get(':id/members')
  listMembers(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.team.list(id, actor);
  }

  @Post(':id/members')
  @Audit({ action: 'team.invite', resourceType: 'User', idFrom: 'response' })
  inviteMember(
    @Param('id') id: string,
    @Body() dto: InviteMemberDto,
    @CurrentUser() actor: AuthUser,
    @Req() req: any,
  ) {
    return this.team.invite(id, dto, actor, reqMeta(req));
  }

  @Put(':id/members/:userId')
  @Audit({ action: 'team.update', resourceType: 'User', idFrom: 'param', idKey: 'userId' })
  updateMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateMemberDto,
    @CurrentUser() actor: AuthUser,
    @Req() req: any,
  ) {
    return this.team.update(id, userId, dto, actor, reqMeta(req));
  }

  @Delete(':id/members/:userId')
  @Audit({ action: 'team.remove', resourceType: 'User', idFrom: 'param', idKey: 'userId' })
  removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() actor: AuthUser,
    @Req() req: any,
  ) {
    return this.team.remove(id, userId, actor, reqMeta(req));
  }

  @Get(':id/transactions')
  getTransactions(
    @Param('id') id: string,
    @Query() query: PaginationDto,
    @CurrentUser() user: any,
  ) {
    return this.companies.getTransactions(id, query);
  }
}
