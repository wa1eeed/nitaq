import {
  CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * Allowed CompanyRoles for a given route. Combine with `@UseGuards(CompanyRoleGuard)`.
 *
 *   @CompanyRoles('OWNER', 'ADMIN')
 *   @UseGuards(CompanyRoleGuard)
 *   @Put('settings')
 *   updateSettings() { ... }
 */
export const COMPANY_ROLES_KEY = 'companyRoles';
export type CompanyRole = 'OWNER' | 'ADMIN' | 'STAFF' | 'DISPATCH' | 'FINANCE';
export const CompanyRoles = (...roles: CompanyRole[]) =>
  SetMetadata(COMPANY_ROLES_KEY, roles);

@Injectable()
export class CompanyRoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<CompanyRole[] | undefined>(
      COMPANY_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    const role = req.user?.companyRole as CompanyRole | undefined;
    if (!role) {
      throw new ForbiddenException({
        code: 'NO_COMPANY_ROLE',
        message: 'ليس لديك صلاحية شركة لهذا الإجراء',
      });
    }
    if (!required.includes(role)) {
      throw new ForbiddenException({
        code: 'INSUFFICIENT_COMPANY_ROLE',
        message: 'ليس لديك صلاحية لعرض هذه الصفحة',
        details: { required, current: role },
      });
    }
    return true;
  }
}
