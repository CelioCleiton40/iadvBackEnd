import { env } from './env';

export const rateLimitConfig = {
  max: env.RATE_LIMIT_MAX,
  timeWindow: env.RATE_LIMIT_TIME_WINDOW
};