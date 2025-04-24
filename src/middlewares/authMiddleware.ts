import { Request, Response, NextFunction } from "express";
import { verifyToken, UserPayload } from "../security/jwt";

// Extensão da interface Request para incluir o usuário autenticado
export interface AuthenticatedRequest extends Request {
  user?: UserPayload; // Payload decodificado do token
}

/**
 * Middleware de autenticação para verificar tokens JWT.
 * @param req - Requisição HTTP.
 * @param res - Resposta HTTP.
 * @param next - Próxima função no pipeline.
 */
export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Verifica se o cabeçalho Authorization existe e está no formato correto
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.warn("[AuthMiddleware] Cabeçalho Authorization ausente ou malformado.");
      res.status(401).json({ error: "Acesso não autorizado: token ausente ou malformado." });
      return;
    }

    // Extrai o token do cabeçalho
    const token = authHeader.split(" ")[1];
    if (!token) {
      console.warn("[AuthMiddleware] Token ausente no cabeçalho Authorization.");
      res.status(401).json({ error: "Acesso não autorizado: token ausente." });
      return;
    }

    // Verifica e decodifica o token
    const decoded = verifyToken(token);

    // Garante que o payload contenha os campos obrigatórios
    if (!decoded?.userId || !decoded?.email) {
      console.warn("[AuthMiddleware] Payload do token inválido ou incompleto:", decoded);
      res.status(403).json({ error: "Token inválido: informações incompletas." });
      return;
    }

    // Anexa o payload decodificado ao objeto de requisição
    req.user = decoded;
    next();
  } catch (err) {
    // Log detalhado para depuração
    console.error("[AuthMiddleware] Falha ao verificar token:", err instanceof Error ? err.message : err);

    // Retorna uma mensagem genérica para evitar expor detalhes sensíveis
    res.status(403).json({ error: "Acesso negado: token inválido ou expirado." });
  }
};