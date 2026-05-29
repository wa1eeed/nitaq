import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshDto, SendOtpDto, VerifyOtpDto } from './dto/refresh.dto';

function reqMeta(req: any) {
  const ip = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim()
    || req.ip || req.connection?.remoteAddress;
  const userAgent = req.headers['user-agent'];
  return { ip, userAgent };
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  // 3 registrations / hour / IP — protect against signup abuse
  @Public()
  @Throttle({ default: { limit: 3, ttl: 60 * 60 * 1000 } })
  @Post('register')
  register(@Body() dto: RegisterDto, @Req() req: any) {
    return this.auth.register(dto, reqMeta(req));
  }

  // TODO: re-enable throttle after app testing is complete
  // @Throttle({ default: { limit: 5, ttl: 15 * 60 * 1000 } })
  @Public()
  @Post('login')
  login(@Body() dto: LoginDto, @Req() req: any) {
    return this.auth.login(dto, reqMeta(req));
  }

  @Public()
  @Post('refresh')
  refresh(@Body() dto: RefreshDto, @Req() req: any) {
    return this.auth.refresh(dto.refreshToken, reqMeta(req));
  }

  @Post('logout')
  logout(@Body() dto: RefreshDto, @Req() req: any) {
    return this.auth.logout(
      dto.refreshToken,
      req.user?.jti,
      req.user?.exp,
      { ...reqMeta(req), userId: req.user?.id },
    );
  }

  // 3 OTP sends / hour / IP (the service also enforces 3 / hour / phone)
  @Public()
  @Throttle({ default: { limit: 3, ttl: 60 * 60 * 1000 } })
  @Post('send-otp')
  sendOtp(@Body() dto: SendOtpDto) {
    return this.auth.sendOtp(dto.phone);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60 * 60 * 1000 } })
  @Post('verify-phone')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.auth.verifyOtp(dto.phone, dto.code);
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60 * 60 * 1000 } })
  @Post('forgot-password')
  forgotPassword(@Body() dto: { phone: string }) {
    return this.auth.forgotPassword(dto.phone);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60 * 60 * 1000 } })
  @Post('reset-password')
  resetPassword(@Body() dto: { phone: string; otp: string; newPassword: string }) {
    return this.auth.resetPassword(dto.phone, dto.otp, dto.newPassword);
  }
}
