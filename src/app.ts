import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';

import { logger } from './config/logger';
import { env } from './config/env';
import { securityConfig } from './config/security';
import { rateLimitConfig } from './config/rateLimit';
import { setupSwagger } from './config/swagger';
import { errorHandler } from './middleware/errorHandler';
import { routes } from './routes';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger
  });

  // Register plugins
  await app.register(cors, securityConfig.cors);
  await app.register(helmet, securityConfig.helmet);
  await app.register(jwt, {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: env.JWT_EXPIRES_IN
    }
  });
  await app.register(rateLimit, rateLimitConfig);

  // Setup Swagger documentation
  await setupSwagger(app);

  // Register error handler
  app.setErrorHandler(errorHandler);

  // Register routes
  app.register(routes);

  return app;
}