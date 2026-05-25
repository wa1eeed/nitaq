import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Response, Request } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'حدث خطأ غير متوقع';
    let messageEn = 'Internal server error';
    let code = 'INTERNAL_ERROR';
    let details: Record<string, unknown> | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
        messageEn = res;
      } else if (typeof res === 'object' && res !== null) {
        const r = res as Record<string, unknown>;
        message = (r['message'] as string) ?? message;
        messageEn = (r['messageEn'] as string) ?? message;
        code = (r['code'] as string) ?? this.mapStatusToCode(status);
        details = r['details'] as Record<string, unknown> | undefined;
      }
    } else {
      this.logger.error(`Unhandled exception on ${request.method} ${request.url}`, exception as Error);
    }

    response.status(status).json({
      success: false,
      error: { code, message, messageEn, ...(details ? { details } : {}) },
    });
  }

  private mapStatusToCode(status: number): string {
    switch (status) {
      case 400: return 'BAD_REQUEST';
      case 401: return 'UNAUTHORIZED';
      case 403: return 'FORBIDDEN';
      case 404: return 'NOT_FOUND';
      case 409: return 'CONFLICT';
      case 422: return 'UNPROCESSABLE_ENTITY';
      case 429: return 'TOO_MANY_REQUESTS';
      default: return 'INTERNAL_ERROR';
    }
  }
}
