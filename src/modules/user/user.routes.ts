import { FastifyInstance } from 'fastify';
import { getUserProfile, updateUserProfile } from './user.controller';
import { authenticate } from '../../middleware/authMiddleware';

export async function userRoutes(fastify: FastifyInstance) {
  // Get user profile
  fastify.get('/me', {
    preHandler: [authenticate],
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            oabNumber: { type: 'string', nullable: true },
            cpf: { type: 'string' },
            role: { type: 'string' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  }, getUserProfile);

  // Update user profile
  fastify.put('/me', {
    preHandler: [authenticate],
    schema: {
      body: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string' },
          oabNumber: { type: 'string' },
          cpf: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            oabNumber: { type: 'string', nullable: true },
            cpf: { type: 'string' },
            role: { type: 'string' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  }, updateUserProfile);
}