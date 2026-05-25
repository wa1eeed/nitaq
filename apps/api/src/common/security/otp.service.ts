import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { randomInt } from 'crypto';
import { RedisService } from '../redis/redis.service';

/**
 * SMS-only OTP service.
 *
 * - Code is 6 digits, valid for 10 minutes.
 * - Email is NEVER sent an OTP — email verification (if any) happens via a
 *   separate magic-link flow.
 * - Throttled: max 3 sends per phone per hour.
 */
@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly TTL_SECONDS = 10 * 60;
  private readonly SEND_LIMIT_PER_HOUR = 3;

  constructor(private redis: RedisService) {}

  private codeKey(phone: string) { return `otp:phone:${phone}`; }
  private sendCounterKey(phone: string) { return `otp:send-count:${phone}`; }

  async send(phone: string): Promise<{ sent: true; expiresIn: number }> {
    // Throttle sends per phone (anti-abuse)
    const sends = await this.redis.incrWithTTL(this.sendCounterKey(phone), 3600);
    if (sends > this.SEND_LIMIT_PER_HOUR) {
      throw new BadRequestException({
        code: 'OTP_RATE_LIMIT',
        message: 'تم إرسال الكثير من رموز التحقق. حاول بعد ساعة.',
      });
    }

    const code = String(randomInt(100000, 1000000));
    await this.redis.setWithTTL(this.codeKey(phone), code, this.TTL_SECONDS);

    if ((process.env.SMS_PROVIDER ?? 'console') === 'console') {
      // Development: log to console; in prod hand off to SMS provider.
      this.logger.log(`📱 OTP for ${phone}: ${code}  (expires in ${this.TTL_SECONDS}s)`);
    } else {
      // TODO: integrate with Taqnyat/Unifonic/mSegat using SMS_PROVIDER + SMS_API_KEY env vars.
      this.logger.log(`📱 OTP dispatched to ${phone} via ${process.env.SMS_PROVIDER}`);
    }
    return { sent: true, expiresIn: this.TTL_SECONDS };
  }

  async verify(phone: string, code: string): Promise<boolean> {
    if (!/^\d{6}$/.test(code)) return false;
    const stored = await this.redis.get(this.codeKey(phone));
    if (!stored) return false;
    if (stored !== code) return false;
    // Single-use — delete on success
    await this.redis.del(this.codeKey(phone));
    return true;
  }
}
