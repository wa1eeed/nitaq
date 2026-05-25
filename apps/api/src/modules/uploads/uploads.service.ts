import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client as MinioClient } from 'minio';
import { randomUUID } from 'crypto';

@Injectable()
export class UploadsService implements OnModuleInit {
  private client!: MinioClient;
  private bucket = process.env.MINIO_BUCKET ?? 'naqla-files';

  async onModuleInit() {
    this.client = new MinioClient({
      endPoint: process.env.MINIO_ENDPOINT ?? 'localhost',
      port: Number(process.env.MINIO_PORT ?? 9000),
      useSSL: (process.env.MINIO_USE_SSL ?? 'false') === 'true',
      accessKey: process.env.MINIO_ROOT_USER ?? 'minioadmin',
      secretKey: process.env.MINIO_ROOT_PASSWORD ?? 'minioadmin',
    });
    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) await this.client.makeBucket(this.bucket);
    } catch {
      /* ignore — bucket may already exist or MinIO not ready */
    }
  }

  /**
   * Returns a pre-signed PUT URL plus the final public URL the client should use.
   * Server-side magic-byte validation still happens via `verifyUploadedObject`
   * once the client confirms the upload (or via a webhook in production).
   */
  async presignedUpload(filename: string, contentType: string, folder: string = 'general', sizeBytes?: number) {
    const safeName = filename.replace(/[^\w.\-]/g, '_').slice(0, 80);
    const key = `${folder}/${Date.now()}-${randomUUID()}-${safeName}`;
    const uploadUrl = await this.client.presignedPutObject(this.bucket, key, 60 * 5);
    const publicBase = process.env.MINIO_PUBLIC_URL ?? `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`;
    return {
      uploadUrl,
      publicUrl: `${publicBase}/${this.bucket}/${key}`,
      key,
      contentType,
      expiresIn: 300,
      maxSizeBytes: 10 * 1024 * 1024,
      declaredSizeBytes: sizeBytes ?? null,
    };
  }

  /**
   * Fetches the first 4 KB of an uploaded object and validates the magic
   * bytes. Use this after the client confirms upload completion to reject
   * spoofed Content-Type headers.
   */
  async verifyUploadedObject(key: string): Promise<{ ok: true; ext: string; mime: string } | { ok: false; reason: string }> {
    try {
      const stream = await this.client.getPartialObject(this.bucket, key, 0, 4096);
      const chunks: Buffer[] = [];
      for await (const chunk of stream) chunks.push(chunk as Buffer);
      const buf = Buffer.concat(chunks);
      // Lazy-import to keep this method optional in environments without MinIO
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { validateUploadBuffer } = require('../../common/security/file-validation') as typeof import('../../common/security/file-validation');
      const result = validateUploadBuffer(buf, key);
      return { ok: true, ext: result.ext, mime: result.mime };
    } catch (err) {
      return { ok: false, reason: (err as Error).message };
    }
  }
}
