import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

/**
 * JWT blacklist for the brief window between logout and natural token expiry.
 * Tokens are stored by their `jti` claim with TTL = remaining lifetime, so
 * Redis self-cleans without manual sweeps.
 */
@Injectable()
export class TokenBlacklistService {
  private static readonly PREFIX = 'jwt:blacklist:';

  constructor(private redis: RedisService) {}

  /**
   * Revoke a token by its jti. `expSeconds` is the original token `exp`
   * (UNIX seconds) so the entry expires naturally when the token would have.
   */
  async revoke(jti: string, expSeconds: number) {
    const ttl = Math.max(1, expSeconds - Math.floor(Date.now() / 1000));
    await this.redis.setWithTTL(`${TokenBlacklistService.PREFIX}${jti}`, '1', ttl);
  }

  async isRevoked(jti: string): Promise<boolean> {
    const v = await this.redis.get(`${TokenBlacklistService.PREFIX}${jti}`);
    return v === '1';
  }

  /**
   * Revoke ALL tokens for a user (e.g. on password change or admin freeze).
   * We store a "min-iat" cutoff for the user; any token issued before this
   * timestamp is considered revoked.
   */
  async revokeAllForUser(userId: string, ttlSeconds = 7 * 24 * 3600) {
    const now = Math.floor(Date.now() / 1000);
    await this.redis.setWithTTL(`jwt:user-cutoff:${userId}`, String(now), ttlSeconds);
  }

  async getUserCutoff(userId: string): Promise<number | null> {
    const v = await this.redis.get(`jwt:user-cutoff:${userId}`);
    return v ? Number(v) : null;
  }
}
