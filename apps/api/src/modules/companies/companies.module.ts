import { Module } from '@nestjs/common';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { TeamMembersService } from './team-members.service';
import { OtpService } from '../../common/security/otp.service';

@Module({
  controllers: [CompaniesController],
  providers: [CompaniesService, TeamMembersService, OtpService],
  exports: [CompaniesService, TeamMembersService],
})
export class CompaniesModule {}
