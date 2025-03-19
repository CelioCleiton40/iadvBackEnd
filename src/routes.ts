import { FastifyInstance } from 'fastify';
import { authRoutes } from './modules/auth/auth.routes';
import { userRoutes } from './modules/user/user.routes';
import { oabRoutes } from './modules/oab/oab.routes';
import { datajudRoutes } from './modules/datajud/datajud.routes';

export async function routes(fastify: FastifyInstance) {
  fastify.get('/health', async () => {
    return { status: 'ok' };
  });

  // Register module routes
  fastify.register(authRoutes, { prefix: '/auth' });
  fastify.register(userRoutes, { prefix: '/user' });
  fastify.register(oabRoutes, { prefix: '/oab' });
  fastify.register(datajudRoutes, { prefix: '/datajud' });
}