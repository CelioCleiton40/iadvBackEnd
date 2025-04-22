import jwt, { JwtPayload } from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env';
import { UserRole } from '../types/userTypes';

// Garante que a variável de ambiente esteja definida
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET não definido no arquivo de ambiente.');
}

export interface UserPayload extends JwtPayload {
  id: string;
  email: string;
  role?: UserRole;
}

// Gera um token JWT válido por 1 hora
export const generateToken = (payload: UserPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
};

// Verifica e decodifica um token JWT com segurança
export const verifyToken = (token: string): UserPayload => {
  if (!token || typeof token !== 'string') {
    throw new Error('Token ausente ou malformado.');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (typeof decoded !== 'object' || !('userId' in decoded)) {
      throw new Error('Token malformado ou sem userId.');
    }

    return decoded as UserPayload;
  } catch (error) {
    // Evita expor mensagens detalhadas de erro em produção
    console.error('[JWT] Erro na verificação do token');
    throw new Error('Token inválido ou expirado.');
  }
};
