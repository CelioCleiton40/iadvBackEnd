import { FastifyInstance } from 'fastify';
import { register, login, refreshToken } from './auth.controller';

export async function authRoutes(fastify: FastifyInstance) {
  // Register new user
  fastify.post('/register', {
    schema: {
      body: {
        type: 'object',
        required: ['name', 'email', 'password', 'cpf'],
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          cpf: { type: 'string' },
          oabNumber: { type: 'string' },
          role: { type: 'string', enum: ['admin', 'lawyer', 'client'] }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
                role: { type: 'string' }
              }
            },
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' }
          }
        }
      }
    }
  }, register);

  // Login
  fastify.post('/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
                role: { type: 'string' }
              }
            },
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' }
          }
        }
      }
    }
  }, login);

  // Refresh token
  fastify.post('/refresh-token', {
    schema: {
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' }
          }
        }
      }
    }
  }, refreshToken);
}