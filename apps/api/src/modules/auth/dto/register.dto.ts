import {
  IsEmail, IsEnum, IsOptional, IsString, IsBoolean, Matches, MinLength,
} from 'class-validator';
import { IsStrongPassword } from '../../../common/validators/strong-password.validator';

/**
 * Phone-first onboarding (Option A — default).
 * Email is OPTIONAL and never receives an OTP. Only the phone is verified
 * via SMS OTP. Users without an email can still register.
 */
export class RegisterDto {
  // Phone — REQUIRED, used for SMS OTP verification & primary contact
  @Matches(/^(\+?966|0)?5\d{8}$/, { message: 'رقم الجوال السعودي غير صالح' })
  phone!: string;

  // Email — OPTIONAL (Option B). When provided, no OTP is sent; user can verify later.
  @IsOptional()
  @IsEmail({}, { message: 'البريد الإلكتروني غير صالح' })
  email?: string;

  @IsStrongPassword()
  password!: string;

  @IsString()
  @MinLength(2)
  firstName!: string;

  @IsString()
  @MinLength(2)
  lastName!: string;

  @IsEnum(['CLIENT', 'PROVIDER'] as const, { message: 'نوع الحساب غير صالح' })
  companyType!: 'CLIENT' | 'PROVIDER';

  @IsString()
  @MinLength(2)
  companyNameAr!: string;

  @IsOptional()
  @IsString()
  companyNameEn?: string;

  @IsString()
  city!: string;

  @IsString()
  region!: string;

  @IsString()
  contactPhone!: string;

  // Contact email is also optional now
  @IsOptional()
  @IsEmail({}, { message: 'بريد التواصل غير صالح' })
  contactEmail?: string;

  // Legal consent — REQUIRED (recorded for compliance)
  @IsBoolean()
  acceptedTerms!: boolean;

  @IsBoolean()
  acceptedPrivacy!: boolean;

  @IsBoolean()
  acceptedTransport!: boolean;
}
