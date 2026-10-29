import pino, { type LoggerOptions } from 'pino';
import { env } from './env.js';

const options: LoggerOptions = {
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  ...(env.NODE_ENV !== 'production'
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            ignore: 'pid,hostname',
          },
        },
      }
    : {}),
};

export const logger = pino(options);
