import { FastifyInstance } from 'fastify';
import { JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env';

interface TokenPayload {
  userId: string;
  [key: string]: any;
}

export function generateTokens(fastify: FastifyInstance, payload: TokenPayload) {
  const accessToken = fastify.jwt.sign(payload, {
    expiresIn: env.JWT_EXPIRES_IN
  });

  const refreshToken = fastify.jwt.sign({ userId: payload.userId }, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    jti: 'refresh'
  });

  return {
    accessToken,
    refreshToken
  };
}

export function verifyRefreshToken(fastify: FastifyInstance, token: string) {
  try {
    const decoded = fastify.jwt.verify(token);  // Não passe 'jti' aqui
    if (decoded.jti !== 'refresh') {
      throw new Error('Invalid JWT ID');
    }
    return decoded;
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
}
