import {
  CanActivate, ExecutionContext, Injectable, UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { TokenBlacklistService } from '../security/token-blacklist.service';

interface JwtPayload {
  sub: string;
  role: string;
  companyId: string | null;
  companyRole?: string;            // OWNER | ADMIN | STAFF | DISPATCH | FINANCE
  phone: string | null;
  email?: string | null;
  jti: string;        // unique token id (for revocation)
  iat: number;
  exp: number;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    private blacklist: TokenBlacklistService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest();
    const auth = req.headers['authorization'] ?? '';
    const token = typeof auth === 'string' && auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: 'مطلوب تسجيل دخول' });
    }

    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException({ code: 'INVALID_TOKEN', message: 'الجلسة غير صالحة' });
    }

    // 1) Token-level revocation (logout / individual revoke)
    if (await this.blacklist.isRevoked(payload.jti)) {
      throw new UnauthorizedException({ code: 'TOKEN_REVOKED', message: 'تم إنهاء الجلسة' });
    }

    // 2) User-level revocation cutoff (password change / admin freeze)
    const cutoff = await this.blacklist.getUserCutoff(payload.sub);
    if (cutoff && payload.iat < cutoff) {
      throw new UnauthorizedException({
        code: 'TOKEN_REVOKED_USER',
        message: 'انتهت جميع الجلسات السابقة — يرجى تسجيل الدخول مجدداً',
      });
    }

    req.user = {
      id: payload.sub,
      role: payload.role,
      companyId: payload.companyId,
      companyRole: payload.companyRole ?? null,
      phone: payload.phone,
      email: payload.email ?? null,
      jti: payload.jti,
      exp: payload.exp,
    };
    return true;
  }
}
