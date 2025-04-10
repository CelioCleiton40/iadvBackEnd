import { Request, Response } from 'express';
import * as userService from '../services/userService';

export const createUser = async (req: Request, res: Response) => {
  try {
    const { userId, token } = await userService.registerUser(req.body);
    res.status(201).json({
      message: 'Usuário criado com sucesso!',
      userId,
      token,
    });
  } catch (error: any) {
    console.error('Erro ao criar usuário:', error);
    res.status(400).json({ error: error.message || 'Erro ao criar usuário.' });
  }
};

export const listUsers = async (_req: Request, res: Response) => {
  try {
    const users = await userService.getUsers();
    res.status(200).json(users);
  } catch (error: any) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ error: error.message || 'Erro ao listar usuários.' });
  }
};
