import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { MongoError } from 'mongodb';
import logger from '../utils/logger';

// Interface para erros com código de status
export interface AppError extends Error {
  statusCode?: number;
  code?: string | number;
}

export const errorHandler = (
  err: Error | AppError | ZodError | MongoError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Registra o erro no log
  logger.error(`Erro capturado: ${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
  });

  // Erros de validação do Zod
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: err.errors,
    });
  }

  // Erros específicos do MongoDB
  if ('code' in err && err.code) {
    // Erro de chave duplicada
    if (err.code === 11000) {
      return res.status(409).json({
        error: 'Conflito de dados',
        details: 'Já existe um registro com estas informações',
      });
    }
  }

  // Erros da aplicação com código de status personalizado
  if ('statusCode' in err && err.statusCode) {
    return res.status(err.statusCode).json({
      error: err.message || 'Erro da aplicação',
    });
  }

  // Erros específicos por mensagem
  if (err.message.includes('não tem permissão') || err.message.includes('não foi encontrado')) {
    return res.status(404).json({
      error: 'Recurso não encontrado',
      details: err.message,
    });
  }

  if (err.message.includes('ID de') && err.message.includes('inválido')) {
    return res.status(400).json({
      error: 'Parâmetro inválido',
      details: err.message,
    });
  }

  if (err.message.includes('não autenticado') || err.message.includes('não autorizado')) {
    return res.status(401).json({
      error: 'Autenticação requerida',
      details: err.message,
    });
  }

  // Erro padrão
  res.status(500).json({
    error: 'Erro interno do servidor',
    details: process.env.NODE_ENV === 'production' ? 'Ocorreu um erro inesperado' : err.message,
  });
};

// Classe de erro personalizada para uso na aplicação
export class AppError extends Error {
  statusCode?: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}