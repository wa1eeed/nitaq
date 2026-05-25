import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

const CARGO = [
  'GENERAL','FOOD','CHEMICALS','ELECTRONICS','FURNITURE',
  'CONSTRUCTION','AUTOMOTIVE','MEDICAL','HAZARDOUS','FRAGILE',
] as const;
const TRUCKS = [
  'SMALL_FLATBED','MEDIUM_FLATBED','LARGE_FLATBED','REFRIGERATED',
  'CONTAINER_20','CONTAINER_40','TANKER','CURTAINSIDER','BOX_TRUCK','LOWBED',
] as const;
const MODES = ['OPEN', 'DIRECT'] as const;
const TRIP_TYPES = ['SAME_CITY', 'INTER_CITY'] as const;
const PICKUP_WINDOWS = ['MORNING', 'EVENING', 'ALL_DAY'] as const;

export class CreateOrderDto {
  @IsEnum(CARGO) cargoType!: (typeof CARGO)[number];
  @IsString() cargoDescription!: string;
  @IsNumber() @Min(1) weight!: number;

  /// OPEN (default) → marketplace; DIRECT → only `targetCarrierId` sees it.
  @IsOptional() @IsEnum(MODES) mode?: (typeof MODES)[number];
  @IsOptional() @IsString() targetCarrierId?: string;
  /// DIRECT only — pre-agreed price skips the negotiation phase and auto-assigns on publish.
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) agreedPriceUpfront?: number;

  /// SAME_CITY vs INTER_CITY (drives Wizard UI; backend uses for route assumptions).
  @IsOptional() @IsEnum(TRIP_TYPES) tripType?: (typeof TRIP_TYPES)[number];

  /// Client's preferred pickup band; carrier confirms exact time when bidding.
  @IsOptional() @IsEnum(PICKUP_WINDOWS) pickupWindow?: (typeof PICKUP_WINDOWS)[number];
  @IsOptional() @IsInt() @Min(1) pallets?: number;
  @IsOptional() @IsNumber() @Min(0) volume?: number;

  @IsString() originCity!: string;
  @IsString() originRegion!: string;
  @IsString() originAddress!: string;
  @IsOptional() @IsNumber() originLat?: number;
  @IsOptional() @IsNumber() originLng?: number;

  @IsString() destinationCity!: string;
  @IsString() destinationRegion!: string;
  @IsString() destinationAddress!: string;
  @IsOptional() @IsNumber() destinationLat?: number;
  @IsOptional() @IsNumber() destinationLng?: number;

  @IsEnum(TRUCKS) requiredTruckType!: (typeof TRUCKS)[number];
  @IsOptional() @IsBoolean() requiresRefrigeration?: boolean;
  @IsOptional() @IsBoolean() requiresInsurance?: boolean;
  @IsOptional() @IsString() specialInstructions?: string;

  @IsDateString() pickupDate!: string;
  @IsOptional() @IsDateString() deliveryDate?: string;
  @IsOptional() @IsDateString() bidDeadline?: string;

  @IsOptional() @IsNumber() @Min(0) clientBudget?: number;

  @IsOptional() @IsString() poNumber?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsArray() documents?: string[];
}

export class UpdateOrderDto {
  @IsOptional() @IsString() cargoDescription?: string;
  @IsOptional() @IsNumber() weight?: number;
  @IsOptional() @IsDateString() pickupDate?: string;
  @IsOptional() @IsNumber() clientBudget?: number;
  @IsOptional() @IsString() specialInstructions?: string;
  @IsOptional() @IsString() notes?: string;
}

export class CreateTrackingEventDto {
  @IsString() status!: string;
  @IsString() description!: string;
  @IsOptional() @IsNumber() lat?: number;
  @IsOptional() @IsNumber() lng?: number;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsArray() photos?: string[];
  @IsOptional() @IsString() signature?: string;
  @IsOptional() @IsString() notes?: string;
}

export class AssignOrderDto {
  @IsString() carrierId!: string;
  @IsNumber() agreedPrice!: number;
}

export class CancelOrderDto {
  @IsString() reason!: string;
}

export class AssignDriverDto {
  @IsString() driverId!: string;
}
