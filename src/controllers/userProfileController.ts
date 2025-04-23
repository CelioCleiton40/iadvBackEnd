import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import { createOrUpdateProfile, getProfileByUserId } from '../services/userProfileService';
import logger from "../utils/logger";

/**
 * Busca o perfil do usuário logado.
 * @param req - Requisição HTTP autenticada.
 * @param res - Resposta HTTP.
 */
export const fetchProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Obtém o userId do usuário autenticado
    const userId = req.user?.userId;
    if (!userId) {
      console.warn("[fetchProfile] userId ausente no payload do token.");
      return res.status(401).json({ message: 'Não autorizado.' });
    }

    // Busca o perfil pelo userId
    const profile = await getProfileByUserId(userId);

    // Retorna erro 404 se o perfil não for encontrado
    if (!profile) {
      return res.status(404).json({ message: 'Perfil não encontrado.' });
    }

    // Retorna o perfil encontrado
    res.status(200).json(profile);
  } catch (error) {
    // Log detalhado para depuração
    logger.error('[fetchProfile] Erro ao buscar perfil:', error);

    // Retorna erro 500 em caso de falha interna
    res.status(500).json({ message: 'Erro interno ao buscar o perfil do usuário.' });
  }
};

/**
 * Cria ou atualiza o perfil do usuário logado.
 * @param req - Requisição HTTP autenticada com dados do perfil.
 * @param res - Resposta HTTP.
 */
export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Obtém o userId do usuário autenticado
    const userId = req.user?.userId;
    if (!userId) {
      console.warn("[updateProfile] userId ausente no payload do token.");
      return res.status(401).json({ message: 'Não autorizado.' });
    }

    // Valida se o corpo da requisição contém dados
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: 'Dados do perfil são obrigatórios.' });
    }

    // Chama o serviço para criar ou atualizar o perfil
    const profile = await createOrUpdateProfile(userId, req.body);

    // Retorna o perfil criado/atualizado
    res.status(200).json(profile);
  } catch (error: any) {
    // Log detalhado para depuração
    logger.error('[updateProfile] Erro ao atualizar perfil:', error);

    // Retorna erros de validação específicos
    if (error.details) {
      return res.status(400).json({
        message: 'Erro de validação nos dados do perfil.',
        errors: error.details
      });
    }

    // Retorna erro 500 em caso de falha interna
    res.status(500).json({ message: 'Erro interno ao atualizar o perfil do usuário.' });
  }
};