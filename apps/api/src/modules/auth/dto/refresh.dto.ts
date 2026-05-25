import { IsString, Matches } from 'class-validator';

export class RefreshDto {
  @IsString()
  refreshToken!: string;
}

export class SendOtpDto {
  @Matches(/^(\+?966|0)?5\d{8}$/, { message: 'رقم الجوال السعودي غير صالح' })
  phone!: string;
}

export class VerifyOtpDto {
  @Matches(/^(\+?966|0)?5\d{8}$/, { message: 'رقم الجوال السعودي غير صالح' })
  phone!: string;

  @Matches(/^\d{6}$/, { message: 'الرمز يجب أن يكون 6 أرقام' })
  code!: string;
}
