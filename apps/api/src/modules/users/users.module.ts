import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { TokenBlacklistService } from '../../common/security/token-blacklist.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, TokenBlacklistService],
  exports: [UsersService],
})
export class UsersModule {}
