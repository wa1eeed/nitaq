import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthUser {
  id: string;
  role: string;
  companyId: string | null;
  /** Per-company role: OWNER | ADMIN | STAFF | DISPATCH | FINANCE */
  companyRole: string | null;
  phone: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    const user: AuthUser | undefined = req.user;
    if (!user) return null;
    return data ? user[data] : user;
  },
);
