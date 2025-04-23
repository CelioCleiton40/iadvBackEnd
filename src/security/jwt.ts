import jwt, { JwtPayload } from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env';
import { UserRole } from '../types/userTypes';

// Garante que a variável de ambiente JWT_SECRET esteja definida
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET não definido no arquivo de ambiente.');
}

// Interface para o payload do token
export interface UserPayload extends JwtPayload {
  userId: string; // Substituído "id" por "userId" para consistência
  email: string;
  role?: UserRole;
}

/**
 * Gera um token JWT válido por 1 hora.
 * @param payload - Dados a serem codificados no token.
 * @returns Token JWT assinado.
 */
export const generateToken = (payload: UserPayload): string => {
  if (!payload.userId || !payload.email) {
    throw new Error('Payload inválido: userId e email são obrigatórios.');
  }

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
};

/**
 * Verifica e decodifica um token JWT com segurança.
 * @param token - Token JWT a ser verificado.
 * @returns Payload decodificado.
 * @throws Erro se o token for inválido, expirado ou malformado.
 */
export const verifyToken = (token: string): UserPayload => {
  // Verifica se o token é uma string válida
  if (!token || typeof token !== 'string') {
    console.error('[JWT] Token ausente ou malformado:', token);
    throw new Error('Token ausente ou malformado.');
  }

  try {
    // Verifica o token usando a chave secreta
    const decoded = jwt.verify(token, JWT_SECRET);

    // Garante que o payload seja um objeto e contenha os campos necessários
    if (typeof decoded !== 'object' || !decoded || !('userId' in decoded) || !('email' in decoded)) {
      console.error('[JWT] Token malformado ou sem campos obrigatórios:', decoded);
      throw new Error('Token inválido ou incompleto.');
    }

    // Retorna o payload decodificado
    return decoded as UserPayload;
  } catch (error) {
    // Log detalhado para depuração
    console.error('[JWT] Falha ao verificar token:', error instanceof Error ? error.message : error);

    // Mensagem genérica para evitar expor detalhes em produção
    throw new Error('Token inválido ou expirado.');
  }
};