import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { logger } from '../config/logger';

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  logger.error(error);

  // Handle validation errors
  if (error.validation) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: error.message
    });
  }

  // Handle JWT errors
  if (error.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER' || 
      error.code === 'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED' ||
      error.code === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID') {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Authentication required'
    });
  }

  // Default error response
  const statusCode = error.statusCode || 500;
  const errorMessage = statusCode === 500 
    ? 'Internal Server Error' 
    : error.message;

  return reply.status(statusCode).send({
    statusCode,
    error: error.name || 'Error',
    message: errorMessage
  });
}