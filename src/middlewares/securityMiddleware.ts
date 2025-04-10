import { Express, Request, Response, NextFunction } from 'express';
import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';

export const setupSecurity = (app: Express) => {
  const limiter: RateLimitRequestHandler = rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 100, // Número máximo de requisições por IP por minuto
    keyGenerator: (req: Request) =>
      req.headers['x-forwarded-for']?.toString() || req.ip || req.socket.remoteAddress || '',

    skip: (req: Request) => req.ip === '127.0.0.1' || req.hostname === 'localhost',

    handler: (req: Request, res: Response, _next: NextFunction, options) => {
      console.warn(`[!] Rate limit excedido por IP: ${req.ip}`);
      res.status(429).json({
        statusCode: 429,
        error: 'Too Many Requests',
        message: `Você excedeu o limite de ${options.max} requisições por minuto.`,
      });
    },

    standardHeaders: true, // Inclui `RateLimit-*` headers na resposta
    legacyHeaders: false,  // Remove `X-RateLimit-*` headers legados
  });

  app.use(limiter);

  console.log('[SECURITY] Rate limiting configurado com sucesso.');
};
