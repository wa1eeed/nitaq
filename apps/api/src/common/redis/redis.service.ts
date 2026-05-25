import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

/**
 * Centralised Redis client. Used for:
 *  - JWT blacklist (logout revocation, password rotation)
 *  - OTP storage (5–10 min TTL keyed by phone)
 *  - Login-attempt counters / lockouts
 *  - Per-endpoint rate-limit counters
 *  - PDPL access logs hot index
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  public readonly client: Redis;

  constructor() {
    this.client = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy: (times) => Math.min(times * 200, 5000),
    });
  }

  async onModuleInit() {
    try {
      await this.client.connect();
      this.logger.log('✅ Redis connected');
    } catch (err) {
      this.logger.error('❌ Redis connection failed', err as Error);
    }
  }

  async onModuleDestroy() {
    await this.client.quit().catch(() => undefined);
  }

  // ─── Helpers ────────────────────────────────────────────────

  async setWithTTL(key: string, value: string, ttlSeconds: number) {
    await this.client.set(key, value, 'EX', ttlSeconds);
  }

  async get(key: string) {
    return this.client.get(key);
  }

  async del(key: string) {
    return this.client.del(key);
  }

  /** Atomic increment with TTL. Returns the new counter. */
  async incrWithTTL(key: string, ttlSeconds: number) {
    const tx = this.client.multi();
    tx.incr(key);
    tx.expire(key, ttlSeconds);
    const result = await tx.exec();
    return Number(result?.[0]?.[1] ?? 0);
  }

  /** Remaining TTL in seconds (-1 if no expiry, -2 if missing). */
  async ttl(key: string) {
    return this.client.ttl(key);
  }
}
