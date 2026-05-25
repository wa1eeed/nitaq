import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'مطلوب رقم الجوال أو البريد' })
  phoneOrEmail!: string;

  @IsString()
  @MinLength(8, { message: 'كلمة المرور يجب ألا تقل عن 8 أحرف' })
  password!: string;
}
