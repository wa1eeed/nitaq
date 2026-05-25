import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Audit } from '../../common/audit/audit.decorator';
import { isAllowedExtension, MAX_UPLOAD_BYTES } from '../../common/security/file-validation';
import { UploadsService } from './uploads.service';

const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

class PresignDto {
  @IsString() filename!: string;

  @IsIn(ALLOWED_CONTENT_TYPES, {
    message: 'نوع الملف غير مسموح. الأنواع المسموحة: JPG, JPEG, PNG, PDF, XLSX',
  })
  contentType!: string;

  @IsOptional() @IsString() folder?: string;

  /** Client-declared size (so we can pre-reject big files before signing) */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_UPLOAD_BYTES)
  sizeBytes?: number;
}

@ApiTags('uploads')
@ApiBearerAuth()
@Controller('uploads')
export class UploadsController {
  constructor(private uploads: UploadsService) {}

  /**
   * 10 uploads/minute/IP — generous enough for normal use, blocks abuse.
   * Magic-byte validation happens server-side after the actual upload finishes
   * (see UploadsService).
   */
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Audit({ action: 'upload.presign', resourceType: 'Upload' })
  @Post('presign')
  presign(@Body() dto: PresignDto) {
    if (!isAllowedExtension(dto.filename)) {
      throw new BadRequestException({
        code: 'FILE_TYPE_DISALLOWED',
        message: 'امتداد الملف غير مسموح. الأنواع المسموحة: jpg, jpeg, png, pdf, xlsx',
      });
    }
    return this.uploads.presignedUpload(
      dto.filename,
      dto.contentType,
      dto.folder ?? 'general',
      dto.sizeBytes,
    );
  }
}
