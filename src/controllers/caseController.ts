import { Request, Response, NextFunction } from 'express';
import * as caseService from '../services/caseService';
import { AppError } from '../middlewares/errorHandler';

/**
 * Controlador para criar um novo caso
 */
export const createCaso = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const novoCaso = await caseService.createCaso(userId, req.body);
    res.status(201).json(novoCaso);
  } catch (error) {
    next(error);
  }
};

/**
 * Controlador para listar todos os casos de um usuário
 */
export const getCasosByUserId = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const casos = await caseService.getCasosByUserId(userId);
    res.status(200).json(casos);
  } catch (error) {
    next(error);
  }
};

/**
 * Controlador para obter um caso específico pelo ID
 */
export const getCasoById = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const casoId = req.params.id;
    
    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const caso = await caseService.getCasoById(casoId, userId);
    
    if (!caso) {
      throw new AppError('Caso não encontrado', 404);
    }
    
    res.status(200).json(caso);
  } catch (error) {
    next(error);
  }
};

/**
 * Controlador para atualizar um caso existente
 */
export const updateCaso = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const casoId = req.params.id;
    
    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const casoAtualizado = await caseService.updateCaso(casoId, userId, req.body);
    res.status(200).json(casoAtualizado);
  } catch (error) {
    next(error);
  }
};

/**
 * Controlador para excluir um caso
 */
export const deleteCaso = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const casoId = req.params.id;
    
    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    await caseService.deleteCaso(casoId, userId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};