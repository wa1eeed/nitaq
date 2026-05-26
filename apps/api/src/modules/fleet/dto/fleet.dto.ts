import { IsArray, IsBoolean, IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

// Must stay in sync with Prisma enum `ServiceType` in apps/api/prisma/schema.prisma.
// The provider UI's service-types catalog (DEFAULT_SERVICE_TYPES) is the source of
// what the user actually sees — keep this enum a superset of those IDs.
const TRUCKS = [
  'SMALL_VAN','SMALL_FLATBED','MEDIUM_FLATBED','LARGE_FLATBED','REFRIGERATED',
  'CONTAINER_20','CONTAINER_40','CONTAINER_TRAILER','TANKER','CURTAINSIDER','BOX_TRUCK','LOWBED',
] as const;

export class CreateTruckDto {
  @IsString() plateNumber!: string;
  @IsEnum(TRUCKS) type!: (typeof TRUCKS)[number];
  @IsNumber() capacity!: number;
  @IsOptional() @IsNumber() length?: number;
  @IsOptional() @IsNumber() width?: number;
  @IsOptional() @IsNumber() height?: number;
  @IsOptional() @IsString() make?: string;
  @IsOptional() @IsString() model?: string;
  @IsOptional() @IsInt() year?: number;
  @IsOptional() @IsBoolean() hasRefrigeration?: boolean;
  @IsOptional() @IsBoolean() hasGPS?: boolean;
  @IsOptional() @IsArray() photos?: string[];
  @IsOptional() @IsArray() documents?: string[];
}

export class UpdateTruckDto extends CreateTruckDto {}

export class CreateDriverDto {
  @IsString() userId!: string;
  @IsString() licenseNumber!: string;
  @IsDateString() licenseExpiry!: string;
  @IsString() licenseType!: string;
  @IsOptional() @IsString() photo?: string;
}

/** Invite a new employee in one shot — creates User + DriverProfile atomically. */
export class InviteDriverDto {
  @IsString() fullName!: string;
  @IsString() phone!: string;
  @IsOptional() @IsString() nationalId?: string;
  @IsString() licenseNumber!: string;
  @IsDateString() licenseExpiry!: string;
  @IsString() licenseType!: string;
  @IsOptional() @IsString() photo?: string;
}

export class LocationDto {
  @IsNumber() lat!: number;
  @IsNumber() lng!: number;
  @IsOptional() @IsNumber() speed?: number;
}
