import { Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware";
import {
  getProfileByUserId,
  createOrUpdateProfile,
  deleteProfile,
  getProfileByProfileId
} from '../../services/dashboard/userProfileService';
import { updateUserProfileSchema } from '../../schemas/userProfile';
import logger from "../../utils/logger";
import { ZodError } from "zod";

/**
 * Busca o perfil do usuário logado.
 * Rick's comment: Busca perfil com mascaramento de dados sensíveis porque privacidade importa.
 * @param req - Requisição HTTP autenticada.
 * @param res - Resposta HTTP.
 */
export const fetchProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Rick's comment: Obtém o userId do usuário autenticado
    const userId = req.user?.userId;

    if (!userId) {
      logger.warn("[fetchProfile] userId ausente no payload do token.");
      return res.status(401).json({ 
        success: false,
        message: 'Não autorizado.' 
      });
    }

    // Rick's comment: Busca o perfil pelo userId usando o serviço
    const profile = await getProfileByUserId(userId);

    // Rick's comment: Retorna erro 404 se o perfil não for encontrado
    if (!profile) {
      logger.info(`[fetchProfile] Perfil não encontrado para userId: ${userId}`);
      return res.status(404).json({ 
        success: false,
        message: 'Perfil não encontrado.' 
      });
    }

    // Rick's comment: Retorna o perfil encontrado
    logger.info(`[fetchProfile] Perfil recuperado com sucesso para userId: ${userId}`);
    res.status(200).json({
      success: true,
      message: 'Perfil encontrado com sucesso.',
      data: profile
    });
  } catch (error) {
    // Rick's comment: Log detalhado para depuração
    logger.error('[fetchProfile] Erro ao buscar perfil:', error);

    // Rick's comment: Retorna erro 500 em caso de falha interna
    res.status(500).json({ 
      success: false,
      message: 'Erro interno ao buscar o perfil do usuário.' 
    });
  }
};

/**
 * Cria ou atualiza o perfil do usuário logado.
 * Rick's comment: Controller que funciona de verdade, com validação Zod e tudo mais.
 * @param req - Requisição HTTP autenticada com dados do perfil.
 * @param res - Resposta HTTP.
 */
export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Rick's comment: Obtém o userId do usuário autenticado
    const userId = req.user?.userId;

    if (!userId) {
      logger.warn("[updateProfile] userId ausente no payload do token.");
      return res.status(401).json({ 
        success: false,
        message: 'Não autorizado.' 
      });
    }

    // Rick's comment: Valida se o corpo da requisição contém dados
    const profileData = req.body;
    if (!profileData || Object.keys(profileData).length === 0) {
      logger.warn("[updateProfile] Dados do perfil ausentes na requisição.");
      return res.status(400).json({ 
        success: false,
        message: 'Dados do perfil são obrigatórios.' 
      });
    }

    // Rick's comment: Validação prévia com Zod para feedback rápido
    try {
      updateUserProfileSchema.parse(profileData);
    } catch (validationError) {
      if (validationError instanceof ZodError) {
        logger.warn(`[updateProfile] Erro de validação Zod para userId: ${userId}`, validationError.errors);
        return res.status(400).json({
          success: false,
          message: 'Dados do perfil inválidos.',
          errors: validationError.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
    }

    // Rick's comment: Chama o serviço para criar ou atualizar o perfil
    const updatedProfile = await createOrUpdateProfile(userId, profileData);

    // Rick's comment: Retorna o perfil criado/atualizado
    logger.info(`[updateProfile] Perfil criado/atualizado com sucesso para userId: ${userId}`);
    res.status(200).json({
      success: true,
      message: 'Perfil atualizado com sucesso.',
      data: updatedProfile
    });
  } catch (error: any) {
    // Rick's comment: Log detalhado para depuração
    logger.error('[updateProfile] Erro ao atualizar perfil:', error);

    // Rick's comment: Retorna erros de validação específicos
    if (error.details) {
      return res.status(400).json({
        success: false,
        message: 'Erro de validação nos dados do perfil.',
        errors: error.details
      });
    }

    // Rick's comment: Retorna erro 500 em caso de falha interna
    res.status(500).json({ 
      success: false,
      message: 'Erro interno ao atualizar o perfil do usuário.' 
    });
  }
};

/**
 * Exclui o perfil do usuário logado.
 * Rick's comment: Delete que funciona e confirma a exclusão.
 * @param req - Requisição HTTP autenticada.
 * @param res - Resposta HTTP.
 */
export const deleteProfileController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Rick's comment: Obtém o userId do usuário autenticado
    const userId = req.user?.userId;

    if (!userId) {
      logger.warn("[deleteProfileController] userId ausente no payload do token.");
      return res.status(401).json({ 
        success: false,
        message: 'Não autorizado.' 
      });
    }

    // Rick's comment: Chama o serviço para excluir o perfil
    const isDeleted = await deleteProfile(userId);

    // Rick's comment: Retorna erro 404 se o perfil não for encontrado
    if (!isDeleted) {
      logger.info(`[deleteProfileController] Perfil não encontrado para userId: ${userId}`);
      return res.status(404).json({ 
        success: false,
        message: 'Perfil não encontrado.' 
      });
    }

    // Rick's comment: Retorna sucesso
    logger.info(`[deleteProfileController] Perfil excluído com sucesso para userId: ${userId}`);
    res.status(200).json({ 
      success: true,
      message: 'Perfil excluído com sucesso.' 
    });
  } catch (error) {
    // Rick's comment: Log detalhado para depuração
    logger.error('[deleteProfileController] Erro ao excluir perfil:', error);

    // Rick's comment: Retorna erro 500 em caso de falha interna
    res.status(500).json({ 
      success: false,
      message: 'Erro interno ao excluir o perfil do usuário.' 
    });
  }
};

/**
 * Busca o perfil de um usuário pelo profileId.
 * Rick's comment: Busca pública de perfil com dados mascarados para segurança.
 * @param req - Requisição HTTP autenticada.
 * @param res - Resposta HTTP.
 */
export const fetchProfileByProfileId = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Rick's comment: Obtém o profileId dos parâmetros da rota
    const { profileId } = req.params;

    if (!profileId) {
      logger.warn("[fetchProfileByProfileId] profileId ausente nos parâmetros da rota.");
      return res.status(400).json({ 
        success: false,
        message: 'ID do perfil é obrigatório.' 
      });
    }

    // Rick's comment: Busca o perfil pelo profileId usando o serviço
    const profile = await getProfileByProfileId(profileId);

    // Rick's comment: Retorna erro 404 se o perfil não for encontrado
    if (!profile) {
      logger.info(`[fetchProfileByProfileId] Perfil não encontrado para profileId: ${profileId}`);
      return res.status(404).json({ 
        success: false,
        message: 'Perfil não encontrado.' 
      });
    }

    // Rick's comment: Retorna o perfil encontrado
    logger.info(`[fetchProfileByProfileId] Perfil recuperado com sucesso para profileId: ${profileId}`);
    res.status(200).json({
      success: true,
      message: 'Perfil encontrado com sucesso.',
      data: profile
    });
  } catch (error) {
    // Rick's comment: Log detalhado para depuração
    logger.error('[fetchProfileByProfileId] Erro ao buscar perfil:', error);

    // Rick's comment: Retorna erro 500 em caso de falha interna
    res.status(500).json({ 
      success: false,
      message: 'Erro interno ao buscar o perfil do usuário.' 
    });
  }
};