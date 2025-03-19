import { FastifyInstance } from 'fastify';
import { validateOAB } from './oab.controller';
import { authenticate } from '../../middleware/authMiddleware';

export async function oabRoutes(fastify: FastifyInstance) {
  // Validate OAB registration
  fastify.get('/validate', {
    preHandler: [authenticate],
    schema: {
      querystring: {
        type: 'object',
        required: ['oabNumber'],
        properties: {
          oabNumber: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            isValid: { type: 'boolean' },
            name: { type: 'string' },
            oabNumber: { type: 'string' },
            state: { type: 'string' },
            status: { type: 'string' }
          }
        }
      }
    }
  }, validateOAB);
}