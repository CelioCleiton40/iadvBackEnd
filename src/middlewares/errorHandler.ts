import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Registra o erro no log
  logger.error(`Erro capturado: ${err.message}`, {
    stack: err.stack,
  });

  // Retorna uma resposta de erro padronizada
  res.status(500).json({
    error: 'Erro interno do servidor',
    details: err.message,
  });
};