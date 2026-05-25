import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, Matches, MinLength } from 'class-validator';

const ASSIGNABLE_ROLES = ['ADMIN', 'STAFF', 'DISPATCH', 'FINANCE'] as const;
export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

export class InviteMemberDto {
  @IsString()
  @MinLength(2)
  fullName!: string;

  @Matches(/^(\+?966|0)?5\d{8}$/, { message: 'رقم الجوال السعودي غير صالح' })
  phone!: string;

  @IsOptional()
  @IsEmail({}, { message: 'البريد الإلكتروني غير صالح' })
  email?: string;

  /** OWNER cannot be assigned on invite — only granted at company signup. */
  @IsIn(ASSIGNABLE_ROLES, { message: 'الدور غير صالح' })
  role!: AssignableRole;
}

export class UpdateMemberDto {
  @IsOptional()
  @IsIn(ASSIGNABLE_ROLES, { message: 'الدور غير صالح' })
  role?: AssignableRole;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
