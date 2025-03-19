import { FastifyInstance } from 'fastify';
import { 
  searchCases, 
  getCases, 
  getCaseById, 
  getCaseDocuments, 
  getMagistrate 
} from './datajud.controller';
import { authenticate } from '../../middleware/authMiddleware';

export async function datajudRoutes(fastify: FastifyInstance) {
  // Apply authentication middleware to all routes
  fastify.addHook('preHandler', authenticate);
  
  // Search cases
  fastify.get('/search', {
    schema: {
      querystring: {
        type: 'object',
        required: ['query'],
        properties: {
          query: { type: 'string' },
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 }
        }
      }
    }
  }, searchCases);
  
  // Get all cases
  fastify.get('/cases', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 }
        }
      }
    }
  }, getCases);
  
  // Get case by ID
  fastify.get('/cases/:id', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      }
    }
  }, getCaseById);
  
  // Get case documents
  fastify.get('/cases/:id/documents', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      }
    }
  }, getCaseDocuments);
  
  // Get magistrate details
  fastify.get('/magistrate', {
    schema: {
      querystring: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      }
    }
  }, getMagistrate);
}