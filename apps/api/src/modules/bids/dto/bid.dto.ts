import { IsDateString, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateBidDto {
  @IsNumber() @Min(1) amount!: number;
  /** Legacy duration field (kept for back-compat with old clients). New
   *  clients should send `proposedDeliveryDate` instead; this becomes optional. */
  @IsOptional() @IsInt() @Min(0) estimatedDays?: number;
  @IsOptional() @IsInt() @Min(0) estimatedHours?: number;
  /** Counter-offer on pickup timing — when set, differs from order.pickupDate. */
  @IsOptional() @IsDateString() proposedPickupDate?: string;
  /** Carrier's concrete proposed delivery date — replaces estimatedDays/Hours. */
  @IsOptional() @IsDateString() proposedDeliveryDate?: string;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateBidDto {
  @IsOptional() @IsNumber() @Min(1) amount?: number;
  @IsOptional() @IsInt() @Min(0) estimatedDays?: number;
  @IsOptional() @IsInt() @Min(0) estimatedHours?: number;
  @IsOptional() @IsDateString() proposedPickupDate?: string;
  @IsOptional() @IsDateString() proposedDeliveryDate?: string;
  @IsOptional() @IsString() notes?: string;
}
