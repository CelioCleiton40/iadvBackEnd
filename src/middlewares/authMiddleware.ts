import { Request, Response, NextFunction } from "express";
import { verifyToken, UserPayload } from "../security/jwt";

export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Acesso não autorizado: token ausente ou malformado." });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyToken(token);

    // Verificação adicional de estrutura do payload
    if (!decoded?.userId || !decoded?.email) {
      res.status(403).json({ error: "Token inválido: informações incompletas." });
      return;
    }

    req.user = decoded;
    next();
  } catch (err) {
    console.warn("[AuthMiddleware] Falha ao verificar token:", err instanceof Error ? err.message : err);
    res.status(403).json({ error: "Acesso negado: token inválido ou expirado." });
  }
};
