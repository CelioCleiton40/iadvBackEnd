import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../security/jwt";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: "advogado" | "procuradoria" | "magistrado";
    email: string;
  };
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
res.status(401).json({ error: "Token ausente ou inválido." });
return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded as { id: string; role: "advogado" | "procuradoria" | "magistrado"; email: string }; // já validado via JWT
    next();
  } catch (error) {
    res.status(403).json({ error: "Token inválido ou expirado." });
  }
};
