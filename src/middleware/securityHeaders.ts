import { FastifyRequest, FastifyReply } from 'fastify';

export async function securityHeaders(request: FastifyRequest, reply: FastifyReply) {
  // Additional security headers beyond what Helmet provides
  reply.header('X-Content-Type-Options', 'nosniff');
  reply.header('X-Frame-Options', 'DENY');
  reply.header('X-XSS-Protection', '1; mode=block');
  reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
}