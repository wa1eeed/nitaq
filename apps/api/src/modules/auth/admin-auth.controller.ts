import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';

function reqMeta(req: any) {
  const ip = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim()
    || req.ip || req.connection?.remoteAddress;
  return { ip, userAgent: req.headers['user-agent'] };
}

/**
 * Separate admin login endpoint:
 *   POST /api/admin/auth/login
 *
 * - email + password only (no OTP, no SMS)
 * - 5 attempts / 30 min lockout (per email in LoginAttemptService + per IP via Throttle)
 * - all attempts (success or fail) are audited with IP/UA
 */
@ApiTags('admin-auth')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private adminAuth: AdminAuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 30 * 60 * 1000 } })
  @Post('login')
  login(@Body() dto: AdminLoginDto, @Req() req: any) {
    return this.adminAuth.login(dto, reqMeta(req));
  }

  @Post('logout')
  logout(@Req() req: any) {
    return this.adminAuth.logout(req.user?.jti, req.user?.exp, req.user?.id, reqMeta(req));
  }
}
