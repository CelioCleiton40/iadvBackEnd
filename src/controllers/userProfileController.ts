import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import { createOrUpdateProfile, getProfileByUserId } from '../services/userProfileService';
import logger from "../utils/logger";

// Busca o perfil do usuário logado
export const fetchProfile = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: 'Não autorizado.' });

  try {
    const profile = await getProfileByUserId(userId);
    if (!profile) {
      return res.status(404).json({ message: 'Perfil não encontrado.' });
    }
    res.status(200).json(profile);
  } catch (error) {
    logger.error('Erro no controller ao buscar perfil:', error);
    res.status(500).json({ message: 'Erro interno ao buscar o perfil do usuário.' });
  }
};

// Cria ou atualiza o perfil do usuário logado
export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: 'Não autorizado.' });

  try {
    const profile = await createOrUpdateProfile(userId, req.body);
    res.status(200).json(profile);
  } catch (error: any) {
    logger.error('Erro no controller ao atualizar perfil:', error);

    if (error.details) {
      return res.status(400).json({
        message: 'Erro de validação nos dados do perfil.',
        errors: error.details
      });
    }

    res.status(500).json({ message: 'Erro interno ao atualizar o perfil do usuário.' });
  }
};
