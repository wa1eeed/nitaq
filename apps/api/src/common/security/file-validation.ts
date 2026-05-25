import { BadRequestException } from '@nestjs/common';

/**
 * Allowed upload kinds + their real magic-byte signatures.
 * We never trust the `Content-Type` header from the client nor the file name
 * extension — only the first bytes of the actual buffer.
 */
const SIGNATURES: Array<{
  ext: 'jpg' | 'jpeg' | 'png' | 'pdf' | 'xlsx';
  mime: string;
  match: (b: Buffer) => boolean;
}> = [
  // JPEG: FF D8 FF
  {
    ext: 'jpg', mime: 'image/jpeg',
    match: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    ext: 'jpeg', mime: 'image/jpeg',
    match: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  {
    ext: 'png', mime: 'image/png',
    match: (b) =>
      b.length >= 8 &&
      b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
      b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a,
  },
  // PDF: 25 50 44 46 ("%PDF")
  {
    ext: 'pdf', mime: 'application/pdf',
    match: (b) => b.length >= 4 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46,
  },
  // XLSX is a ZIP container — "PK\x03\x04" header (50 4B 03 04). We additionally
  // require the body to contain "xl/" substring within the first 4 KB to avoid
  // accepting arbitrary ZIPs as xlsx.
  {
    ext: 'xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    match: (b) => {
      if (b.length < 4 || b[0] !== 0x50 || b[1] !== 0x4b || b[2] !== 0x03 || b[3] !== 0x04) return false;
      const head = b.subarray(0, Math.min(b.length, 4096)).toString('binary');
      return head.includes('xl/') || head.includes('[Content_Types].xml');
    },
  },
];

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

export interface ValidatedFile {
  ext: 'jpg' | 'jpeg' | 'png' | 'pdf' | 'xlsx';
  mime: string;
  sizeBytes: number;
}

/**
 * Throws `BadRequestException` if the buffer is not a recognised allowed file.
 * Returns the detected extension + MIME type if accepted.
 */
export function validateUploadBuffer(buffer: Buffer, declaredFileName?: string): ValidatedFile {
  if (!buffer || buffer.length === 0) {
    throw new BadRequestException({ code: 'FILE_EMPTY', message: 'الملف فارغ' });
  }
  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw new BadRequestException({
      code: 'FILE_TOO_LARGE',
      message: `حجم الملف يتجاوز الحد الأقصى ${MAX_UPLOAD_BYTES / 1024 / 1024} MB`,
    });
  }
  const hit = SIGNATURES.find((s) => s.match(buffer));
  if (!hit) {
    throw new BadRequestException({
      code: 'FILE_TYPE_DISALLOWED',
      message: 'نوع الملف غير مسموح. الأنواع المسموحة: JPG, JPEG, PNG, PDF, XLSX',
      details: { declaredFileName },
    });
  }
  return { ext: hit.ext, mime: hit.mime, sizeBytes: buffer.length };
}

/**
 * Quick check by name extension (for client hints / presigned URL flows).
 * Always combine with `validateUploadBuffer` when the bytes are available.
 */
export function isAllowedExtension(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return /\.(jpg|jpeg|png|pdf|xlsx)$/.test(lower);
}
