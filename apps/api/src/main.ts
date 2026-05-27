// Must be the very first import so process.env is populated before any module
// decorator (e.g. JwtModule.register) reads it.
import 'dotenv/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { AuditInterceptor } from './common/audit/audit.interceptor';
import { AuditLogService } from './common/audit/audit-log.service';

// ─── CORS allowlist ───────────────────────────────────────────────
//
// Strict origin check. Localhost ports are always allowed for development;
// production hosts are read from CORS_ORIGINS env var (comma-separated)
// and the *.naqla.sa pattern is matched explicitly. No wildcard `*` ever.
const DEV_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
];

const PROD_HOSTS = (process.env.APP_DOMAIN ?? 'nqlah.nx.sa').split(',').map((s) => s.trim());

function isAllowedOrigin(origin: string | undefined, extra: string[]): boolean {
  if (!origin) return true; // same-origin / curl / mobile
  if (DEV_ORIGINS.includes(origin)) return true;
  if (extra.includes(origin)) return true;
  try {
    const url = new URL(origin);
    const host = url.hostname;
    if (PROD_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) {
      // Only allow https in production for naqla.sa
      return process.env.NODE_ENV === 'production' ? url.protocol === 'https:' : true;
    }
  } catch {
    return false;
  }
  return false;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const port = Number(process.env.PORT ?? 4000);
  const isProd = process.env.NODE_ENV === 'production';

  // ─── Helmet — explicit security headers ─────────────────────────
  app.use(
    helmet({
      // CSP: allow Swagger inline scripts only in non-prod, lock down in prod.
      contentSecurityPolicy: isProd
        ? {
            useDefaults: true,
            directives: {
              'default-src': ["'self'"],
              'script-src': ["'self'"],
              'img-src': ["'self'", 'data:', 'https:'],
              'style-src': ["'self'", "'unsafe-inline'"],
              'connect-src': ["'self'", `https://*.${(process.env.APP_DOMAIN ?? 'nqlah.nx.sa').split(',')[0].trim()}`],
              'frame-ancestors': ["'none'"],
              'object-src': ["'none'"],
              'base-uri': ["'self'"],
              'form-action': ["'self'"],
            },
          }
        : false,
      // HSTS only in production (browsers would cache it on localhost otherwise)
      hsts: isProd
        ? { maxAge: 31536000, includeSubDomains: true, preload: true }
        : false,
      // Always-on headers
      frameguard: { action: 'deny' },                   // X-Frame-Options: DENY
      noSniff: true,                                    // X-Content-Type-Options: nosniff
      xssFilter: true,                                  // X-XSS-Protection
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      crossOriginOpenerPolicy: { policy: 'same-origin' },
      crossOriginResourcePolicy: { policy: 'same-site' },
    }),
  );

  app.use(compression());
  app.use(cookieParser());

  // ─── CORS ────────────────────────────────────────────────────────
  const extraOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin, extraOrigins)) return callback(null, true);
      // eslint-disable-next-line no-console
      console.warn(`[CORS] blocked origin: ${origin}`);
      return callback(new Error('CORS: origin not allowed'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID'],
    maxAge: 86400,
  });

  app.setGlobalPrefix('api', { exclude: ['health'] });

  // ─── Validation ──────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      stopAtFirstError: false,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  // Order matters: AuditInterceptor must run AFTER guards (so req.user is set)
  // and BEFORE ResponseInterceptor reshapes the response.
  const reflector = app.get(Reflector);
  const auditLog = app.get(AuditLogService);
  app.useGlobalInterceptors(
    new AuditInterceptor(reflector, auditLog),
    new ResponseInterceptor(),
  );

  // ─── Swagger ─────────────────────────────────────────────────────
  if (!isProd) {
    const swagger = new DocumentBuilder()
      .setTitle('Naqla API')
      .setDescription('نقلة لوجيستك — REST API')
      .setVersion('0.2.0')
      .addBearerAuth()
      .build();
    const doc = SwaggerModule.createDocument(app, swagger);
    SwaggerModule.setup('docs', app, doc);
  }

  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`🚀 Naqla API running on http://localhost:${port}`);
  if (!isProd) console.log(`📚 API docs at http://localhost:${port}/docs`);
  console.log(`🛡  Security: helmet ✓  CORS allowlist ✓  validation ✓  audit ✓`);
}
bootstrap();
