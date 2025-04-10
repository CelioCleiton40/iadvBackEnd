import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./authMiddleware";

export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const userRole = req.user?.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      res.status(403).json({
        error: "Acesso negado. Você não tem permissão para acessar este recurso.",
      });
      return; // <- necessário para encerrar corretamente
    }

    next(); // autorizado
  };
};
