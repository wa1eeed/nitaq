import { IsEmail, IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateCompanyDto {
  @IsOptional() @IsString() nameAr?: string;
  @IsOptional() @IsString() nameEn?: string;
  @IsOptional() @IsString() crNumber?: string;
  @IsOptional() @IsString() vatNumber?: string;
  @IsOptional() @IsString() logo?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() region?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() contactPhone?: string;
  @IsOptional() @IsEmail() contactEmail?: string;
  @IsOptional() @IsUrl({ require_protocol: false }) website?: string;
}

export class SubmitKycDto {
  @IsString() type!: string;
  @IsString() fileUrl!: string;
  @IsOptional() @IsString() notes?: string;
}
