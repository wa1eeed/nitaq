import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AdminAuthController } from './admin-auth.controller';
import { AuthService } from './auth.service';
import { AdminAuthService } from './admin-auth.service';
import { LoginAttemptService } from '../../common/security/login-attempt.service';
import { OtpService } from '../../common/security/otp.service';
import { TokenBlacklistService } from '../../common/security/token-blacklist.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      global: true,
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_ACCESS_TTL', '15m') },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, AdminAuthController],
  providers: [
    AuthService,
    AdminAuthService,
    LoginAttemptService,
    OtpService,
    TokenBlacklistService,
  ],
  exports: [AuthService, TokenBlacklistService, LoginAttemptService, OtpService],
})
export class AuthModule {}
