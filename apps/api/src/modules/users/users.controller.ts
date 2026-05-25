import { Body, Controller, Delete, Get, Patch, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Audit } from '../../common/audit/audit.decorator';
import { UsersService } from './users.service';

class UpdateProfileDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsString() avatar?: string;
}

class DeleteAccountDto {
  @IsOptional() @IsString() reason?: string;
}

function reqMeta(req: any) {
  const ip = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim()
    || req.ip || req.connection?.remoteAddress;
  return { ip, userAgent: req.headers['user-agent'] };
}

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @Get('me')
  me(@CurrentUser('id') id: string) {
    return this.users.getMe(id);
  }

  @Patch('me')
  @Audit({ action: 'user.profile.update', resourceType: 'User', idFrom: 'response', idKey: 'id' })
  updateMe(@CurrentUser('id') id: string, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(id, dto);
  }

  /** PDPL — export all personal data as portable JSON */
  @Post('me/export')
  exportData(@CurrentUser('id') id: string, @Req() req: any) {
    return this.users.exportPersonalData(id, reqMeta(req));
  }

  /** PDPL — right to erasure (soft delete + anonymise) */
  @Delete('me')
  deleteMe(@CurrentUser('id') id: string, @Body() dto: DeleteAccountDto, @Req() req: any) {
    return this.users.deleteOwnAccount(id, dto.reason, reqMeta(req));
  }
}
