import pino from 'pino';
import { env } from './env';

const transport = pino.transport({
  target: 'pino-pretty',
  options: {
    colorize: true,
    translateTime: 'SYS:standard',
    ignore: 'pid,hostname'
  }
});

export const logger = pino(
  {
    level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    base: undefined
  },
  env.NODE_ENV === 'production' ? undefined : transport
);