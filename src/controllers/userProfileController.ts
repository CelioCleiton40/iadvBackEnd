import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import {
  getProfileByUserId,
  createOrUpdateProfile,
  deleteProfile,
  getProfileByProfileId
} from '../services/userProfileService';
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
      logger.warn("[fetchProfile] userId ausente no payload do token.");
      return res.status(401).json({ message: 'Não autorizado.' });
    }

    // Busca o perfil pelo userId usando o serviço
    const profile = await getProfileByUserId(userId);

    // Retorna erro 404 se o perfil não for encontrado
    if (!profile) {
      logger.info(`[fetchProfile] Perfil não encontrado para userId: ${userId}`);
      return res.status(404).json({ message: 'Perfil não encontrado.' });
    }

    // Retorna o perfil encontrado
    logger.info(`[fetchProfile] Perfil recuperado com sucesso para userId: ${userId}`);
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
      logger.warn("[updateProfile] userId ausente no payload do token.");
      return res.status(401).json({ message: 'Não autorizado.' });
    }

    // Valida se o corpo da requisição contém dados
    const profileData = req.body;
    if (!profileData || Object.keys(profileData).length === 0) {
      logger.warn("[updateProfile] Dados do perfil ausentes na requisição.");
      return res.status(400).json({ message: 'Dados do perfil são obrigatórios.' });
    }

    // Chama o serviço para criar ou atualizar o perfil
    const updatedProfile = await createOrUpdateProfile(userId, profileData);

    // Retorna o perfil criado/atualizado
    logger.info(`[updateProfile] Perfil criado/atualizado com sucesso para userId: ${userId}`);
    res.status(200).json(updatedProfile);
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

/**
 * Exclui o perfil do usuário logado.
 * @param req - Requisição HTTP autenticada.
 * @param res - Resposta HTTP.
 */
export const deleteProfileController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Obtém o userId do usuário autenticado
    const userId = req.user?.userId;

    if (!userId) {
      logger.warn("[deleteProfileController] userId ausente no payload do token.");
      return res.status(401).json({ message: 'Não autorizado.' });
    }

    // Chama o serviço para excluir o perfil
    const isDeleted = await deleteProfile(userId);

    // Retorna erro 404 se o perfil não for encontrado
    if (!isDeleted) {
      logger.info(`[deleteProfileController] Perfil não encontrado para userId: ${userId}`);
      return res.status(404).json({ message: 'Perfil não encontrado.' });
    }

    // Retorna sucesso
    logger.info(`[deleteProfileController] Perfil excluído com sucesso para userId: ${userId}`);
    res.status(200).json({ message: 'Perfil excluído com sucesso.' });
  } catch (error) {
    // Log detalhado para depuração
    logger.error('[deleteProfileController] Erro ao excluir perfil:', error);

    // Retorna erro 500 em caso de falha interna
    res.status(500).json({ message: 'Erro interno ao excluir o perfil do usuário.' });
  }
};

/**
 * Busca o perfil de um usuário pelo profileId.
 * @param req - Requisição HTTP autenticada.
 * @param res - Resposta HTTP.
 */
export const fetchProfileByProfileId = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Obtém o profileId dos parâmetros da rota
    const { profileId } = req.params;

    if (!profileId) {
      logger.warn("[fetchProfileByProfileId] profileId ausente nos parâmetros da rota.");
      return res.status(400).json({ message: 'ID do perfil é obrigatório.' });
    }

    // Busca o perfil pelo profileId usando o serviço
    const profile = await getProfileByProfileId(profileId);

    // Retorna erro 404 se o perfil não for encontrado
    if (!profile) {
      logger.info(`[fetchProfileByProfileId] Perfil não encontrado para profileId: ${profileId}`);
      return res.status(404).json({ message: 'Perfil não encontrado.' });
    }

    // Retorna o perfil encontrado
    logger.info(`[fetchProfileByProfileId] Perfil recuperado com sucesso para profileId: ${profileId}`);
    res.status(200).json(profile);
  } catch (error) {
    // Log detalhado para depuração
    logger.error('[fetchProfileByProfileId] Erro ao buscar perfil:', error);

    // Retorna erro 500 em caso de falha interna
    res.status(500).json({ message: 'Erro interno ao buscar o perfil do usuário.' });
  }
};