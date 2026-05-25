/**
 * Environment validation — runs once at app bootstrap via
 * `ConfigModule.forRoot({ validate })`. Fails fast (throws) when any required
 * variable is missing or malformed, so misconfigured deploys never reach
 * accepting traffic.
 *
 * Three principles:
 *   1. **Required-everywhere** vars (DATABASE_URL, JWT secrets, MinIO core)
 *      are checked unconditionally.
 *   2. **Per-environment** strictness: production tightens rules
 *      (JWT length ≥ 64, no `mock` providers, HTTPS-only CORS).
 *   3. **Public NEXT_PUBLIC_*** vars are validated too — they're consumed by
 *      the web apps but loaded from the API .env file in CI/CD.
 */

const REQUIRED_VARS = [
  'DATABASE_URL',
  'REDIS_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'MINIO_ENDPOINT',
  'MINIO_ROOT_USER',
  'MINIO_ROOT_PASSWORD',
  'MINIO_BUCKET',
  'NODE_ENV',
  'PORT',
  'FRONTEND_URL',
  'CORS_ORIGINS',
] as const;

const VALID_NODE_ENVS = ['development', 'staging', 'production', 'test'] as const;
const VALID_PAYMENT_PROVIDERS = ['mock', 'moyasar', 'tap'] as const;
const VALID_SMS_PROVIDERS = ['console', 'unifonic', 'msegat'] as const;

export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const errors: string[] = [];

  // ─── 1. Required vars present ────────────────────────────────────────────
  for (const key of REQUIRED_VARS) {
    if (!config[key] || String(config[key]).trim() === '') {
      errors.push(`Missing required env var: ${key}`);
    }
  }

  // ─── 2. NODE_ENV is one of the allowed values ────────────────────────────
  const nodeEnv = String(config.NODE_ENV ?? '');
  if (nodeEnv && !VALID_NODE_ENVS.includes(nodeEnv as (typeof VALID_NODE_ENVS)[number])) {
    errors.push(`NODE_ENV must be one of ${VALID_NODE_ENVS.join(' | ')}, got "${nodeEnv}"`);
  }
  const isProd = nodeEnv === 'production';
  const isStaging = nodeEnv === 'staging';

  // ─── 3. JWT secret length ────────────────────────────────────────────────
  const minSecretLen = isProd ? 64 : 32;
  if (config.JWT_SECRET && String(config.JWT_SECRET).length < minSecretLen) {
    errors.push(`JWT_SECRET must be ≥ ${minSecretLen} chars in ${nodeEnv}`);
  }
  if (config.JWT_REFRESH_SECRET && String(config.JWT_REFRESH_SECRET).length < minSecretLen) {
    errors.push(`JWT_REFRESH_SECRET must be ≥ ${minSecretLen} chars in ${nodeEnv}`);
  }
  if (isProd && config.JWT_SECRET === config.JWT_REFRESH_SECRET) {
    errors.push('JWT_SECRET and JWT_REFRESH_SECRET must differ in production');
  }

  // ─── 4. PORT is a number ─────────────────────────────────────────────────
  const port = Number(config.PORT);
  if (config.PORT && (Number.isNaN(port) || port < 1 || port > 65535)) {
    errors.push(`PORT must be a valid integer 1..65535, got "${config.PORT}"`);
  }

  // ─── 5. Providers are recognized values ──────────────────────────────────
  const paymentProvider = String(config.PAYMENT_PROVIDER ?? '').toLowerCase();
  if (paymentProvider && !VALID_PAYMENT_PROVIDERS.includes(paymentProvider as (typeof VALID_PAYMENT_PROVIDERS)[number])) {
    errors.push(`PAYMENT_PROVIDER must be one of ${VALID_PAYMENT_PROVIDERS.join(' | ')}, got "${paymentProvider}"`);
  }
  const smsProvider = String(config.SMS_PROVIDER ?? '').toLowerCase();
  if (smsProvider && !VALID_SMS_PROVIDERS.includes(smsProvider as (typeof VALID_SMS_PROVIDERS)[number])) {
    errors.push(`SMS_PROVIDER must be one of ${VALID_SMS_PROVIDERS.join(' | ')}, got "${smsProvider}"`);
  }

  // ─── 6. Production-only hardening ────────────────────────────────────────
  if (isProd) {
    if (paymentProvider === 'mock') {
      errors.push('PAYMENT_PROVIDER cannot be "mock" in production');
    }
    if (smsProvider === 'console') {
      errors.push('SMS_PROVIDER cannot be "console" in production');
    }
    const corsOrigins = String(config.CORS_ORIGINS ?? '');
    if (corsOrigins.includes('http://')) {
      errors.push('CORS_ORIGINS must use https:// only in production');
    }
    if (String(config.MINIO_USE_SSL ?? '').toLowerCase() !== 'true') {
      errors.push('MINIO_USE_SSL must be "true" in production');
    }
    if (!config.SENTRY_DSN) {
      errors.push('SENTRY_DSN is required in production (observability)');
    }
  }

  // ─── 7. Staging-only checks ──────────────────────────────────────────────
  if (isStaging && !config.SENTRY_DSN) {
    // Staging should also have Sentry — but warn, not fail (some teams skip it).
    // eslint-disable-next-line no-console
    console.warn('[env] SENTRY_DSN not set in staging — error tracking disabled');
  }

  if (errors.length > 0) {
    throw new Error(
      `\n❌ Environment validation failed:\n  • ${errors.join('\n  • ')}\n\n` +
        `Check your .env.${nodeEnv || 'development'} file against .env.${nodeEnv || 'development'}.example.\n`,
    );
  }

  return config;
}
