import { Request, Response, NextFunction } from "express";
import { verifyToken, UserPayload } from "../security/jwt"; // reaproveitando o tipo

export interface AuthenticatedRequest extends Request {
  user?: UserPayload; // usa a interface já existente
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token ausente ou malformado." });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded as UserPayload; // payload já validado
    next();
  } catch (error: any) {
    res.status(403).json({
      error: error.message || "Token inválido ou expirado."
    });
  }
};
