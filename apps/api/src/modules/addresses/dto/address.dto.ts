import { IsBoolean, IsIn, IsOptional, IsString, IsNumber } from 'class-validator';

const ADDRESS_KINDS = ['PICKUP', 'DESTINATION', 'BOTH'] as const;

export class CreateAddressDto {
  @IsString() label!: string;
  @IsString() city!: string;
  @IsOptional() @IsString() region?: string;
  @IsString() address!: string;
  @IsOptional() @IsString() contactName?: string;
  @IsOptional() @IsString() contactPhone?: string;
  @IsIn(ADDRESS_KINDS) kind!: 'PICKUP' | 'DESTINATION' | 'BOTH';
  @IsOptional() @IsBoolean() isDefault?: boolean;
  @IsOptional() @IsNumber() lat?: number;
  @IsOptional() @IsNumber() lng?: number;
}

export class UpdateAddressDto {
  @IsOptional() @IsString() label?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() region?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() contactName?: string;
  @IsOptional() @IsString() contactPhone?: string;
  @IsOptional() @IsIn(ADDRESS_KINDS) kind?: 'PICKUP' | 'DESTINATION' | 'BOTH';
  @IsOptional() @IsBoolean() isDefault?: boolean;
  @IsOptional() @IsNumber() lat?: number;
  @IsOptional() @IsNumber() lng?: number;
}
