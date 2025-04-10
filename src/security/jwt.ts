import jwt, { JwtPayload } from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env';

// Gera um token JWT válido por 1 hora
export const generateToken = (payload: object): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
};

// Verifica e decodifica um token JWT
export const verifyToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (typeof decoded === 'string') {
      throw new Error('Token malformado');
    }

    return decoded;
  } catch (error) {
    console.error('[JWT] Erro na verificação do token:', error);
    throw new Error('Token inválido ou expirado');
  }
};
