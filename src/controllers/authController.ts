import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { loginUser } from '../services/authService';
import { loginSchema } from '../utils/validation';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const { token, user } = await loginUser(email, password);

    res.status(200).json({
      message: 'Login realizado com sucesso!',
      token,
      user
    });

  } catch (error: any) {
    if (error instanceof ZodError) {
      res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
      return;
    }

    res.status(400).json({
      error: error.message || 'Erro inesperado ao realizar login.'
    });
  }
};
