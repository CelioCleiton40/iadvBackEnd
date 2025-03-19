import { FastifyInstance } from 'fastify';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { env } from './env';

export async function setupSwagger(fastify: FastifyInstance) {
  await fastify.register(fastifySwagger, {
    swagger: {
      info: {
        title: 'API para Advogados',
        description: 'Documentação da API para Advogados',
        version: '1.0.0'
      },
      host: `localhost:${env.PORT}`,
      schemes: ['http'],
      consumes: ['application/json'],
      produces: ['application/json'],
      securityDefinitions: {
        bearerAuth: {
          type: 'apiKey',
          name: 'Authorization',
          in: 'header'
        }
      }
    }
  });

  await fastify.register(fastifySwaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false
    }
  });
}