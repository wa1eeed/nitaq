import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

export interface AttemptOutcome {
  blocked: boolean;
  remainingAttempts: number;
  resetInSeconds: number;
}

/**
 * Tracks failed login attempts per identifier (email/phone or "admin:email")
 * with a sliding window. Locks the account on too many failures.
 */
@Injectable()
export class LoginAttemptService {
  constructor(private redis: RedisService) {}

  private key(scope: string, identifier: string) {
    return `login:attempts:${scope}:${identifier.toLowerCase()}`;
  }
  private blockKey(scope: string, identifier: string) {
    return `login:block:${scope}:${identifier.toLowerCase()}`;
  }

  async isBlocked(scope: 'user' | 'admin', identifier: string): Promise<{ blocked: boolean; resetInSeconds: number }> {
    const ttl = await this.redis.ttl(this.blockKey(scope, identifier));
    return { blocked: ttl > 0, resetInSeconds: Math.max(0, ttl) };
  }

  /**
   * Call after a FAILED login.
   * - user scope: 5 attempts → 15 min block
   * - admin scope: 5 attempts → 30 min block
   */
  async recordFailure(scope: 'user' | 'admin', identifier: string): Promise<AttemptOutcome> {
    const cfg = scope === 'admin'
      ? { max: 5, windowSec: 15 * 60, blockSec: 30 * 60 }
      : { max: 5, windowSec: 15 * 60, blockSec: 15 * 60 };

    const attempts = await this.redis.incrWithTTL(this.key(scope, identifier), cfg.windowSec);
    if (attempts >= cfg.max) {
      await this.redis.setWithTTL(this.blockKey(scope, identifier), '1', cfg.blockSec);
      await this.redis.del(this.key(scope, identifier));
      return { blocked: true, remainingAttempts: 0, resetInSeconds: cfg.blockSec };
    }
    return {
      blocked: false,
      remainingAttempts: cfg.max - attempts,
      resetInSeconds: await this.redis.ttl(this.key(scope, identifier)),
    };
  }

  /** Call after a SUCCESSFUL login. Clears the counter so users aren't punished for a typo earlier. */
  async clear(scope: 'user' | 'admin', identifier: string) {
    await this.redis.del(this.key(scope, identifier));
  }
}
