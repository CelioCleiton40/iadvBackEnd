import { FastifyRequest, FastifyReply } from 'fastify';
import { validateOABRegistration } from './oab.service';
import { authenticate } from '../../middleware/authMiddleware';

interface ValidateOABRequest extends FastifyRequest {
  query: {
    oabNumber: string;
  };
}

export async function validateOAB(request: ValidateOABRequest, reply: FastifyReply) {
  try {
    const { oabNumber } = request.query;
    
    if (!oabNumber) {
      return reply.status(400).send({ error: 'OAB number is required' });
    }
    
    const validationResult = await validateOABRegistration(oabNumber);
    
    if (!validationResult.isValid) {
      return reply.status(404).send({ 
        error: 'Invalid OAB registration', 
        message: validationResult.message 
      });
    }
    
    return reply.send(validationResult);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
}