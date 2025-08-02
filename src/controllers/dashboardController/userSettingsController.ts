import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware";
import { 
  createOrUpdateUserSettings, 
  getUserSettings, 
  createDefaultUserSettings,
  deleteUserSettings 
} from "../../services/dashboard/userSettingsService";
import { updateUserSettingsSchema } from "../../schemas/userSettingsSchema";
import logger from "../../utils/logger";
import { ZodError } from "zod";

/**
 * Controlador para salvar ou atualizar as configurações do usuário.
 * Rick's comment: Salvando configurações com validação porque dados inválidos são o caos.
 */
export const saveUserSettings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      logger.warn("[saveUserSettings] Tentativa de acesso sem userId válido");
      res.status(401).json({ 
        success: false,
        message: "Não autorizado." 
      });
      return;
    }

    // Rick's comment: Validação com Zod porque dados malformados quebram tudo
    const validatedSettings = updateUserSettingsSchema.parse(req.body);
    
    logger.info(`[saveUserSettings] Salvando configurações para userId: ${userId}`);
    const updatedSettings = await createOrUpdateUserSettings(userId, validatedSettings);

    res.status(200).json({
      success: true,
      message: "Configurações salvas com sucesso.",
      data: updatedSettings
    });
  } catch (error) {
    if (error instanceof ZodError) {
      logger.warn(`[saveUserSettings] Dados inválidos:`, error.errors);
      res.status(400).json({
        success: false,
        message: "Dados de configuração inválidos.",
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
      return;
    }

    logger.error("[saveUserSettings] Erro ao salvar configurações:", error);
    res.status(500).json({ 
      success: false,
      message: "Erro interno ao salvar as configurações." 
    });
  }
};
  

/**
 * Controlador para buscar as configurações do usuário.
 * Rick's comment: Buscando configurações com fallback para padrões porque todo mundo precisa de configurações.
 */
export const fetchUserSettings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId; // Rick's comment: Corrigido para usar userId consistentemente
    if (!userId) {
      logger.warn("[fetchUserSettings] Tentativa de acesso sem userId válido");
      res.status(401).json({ 
        success: false,
        message: "Não autorizado." 
      });
      return;
    }

    logger.info(`[fetchUserSettings] Buscando configurações para userId: ${userId}`);
    let settings = await getUserSettings(userId);

    // Rick's comment: Se não tem configurações, cria as padrão automaticamente
    if (!settings) {
      logger.info(`[fetchUserSettings] Criando configurações padrão para userId: ${userId}`);
      settings = await createDefaultUserSettings(userId);
    }

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    logger.error("[fetchUserSettings] Erro ao buscar configurações:", error);
    res.status(500).json({ 
      success: false,
      message: "Erro interno ao buscar as configurações." 
    });
  }
};

/**
 * Controlador para deletar as configurações do usuário.
 * Rick's comment: Porque às vezes você precisa resetar tudo e começar do zero.
 */
export const deleteUserSettingsController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      logger.warn("[deleteUserSettingsController] Tentativa de acesso sem userId válido");
      res.status(401).json({ 
        success: false,
        message: "Não autorizado." 
      });
      return;
    }

    logger.info(`[deleteUserSettingsController] Deletando configurações para userId: ${userId}`);
    const deleted = await deleteUserSettings(userId);

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: "Configurações não encontradas para deletar."
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Configurações deletadas com sucesso."
    });
  } catch (error) {
    logger.error("[deleteUserSettingsController] Erro ao deletar configurações:", error);
    res.status(500).json({ 
      success: false,
      message: "Erro interno ao deletar as configurações." 
    });
  }
};

/**
 * Controlador para resetar configurações para os padrões.
 * Rick's comment: Reset para configurações padrão porque todo mundo comete erros.
 */
export const resetUserSettings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      logger.warn("[resetUserSettings] Tentativa de acesso sem userId válido");
      res.status(401).json({ 
        success: false,
        message: "Não autorizado." 
      });
      return;
    }

    logger.info(`[resetUserSettings] Resetando configurações para userId: ${userId}`);
    
    // Rick's comment: Deleta as configurações existentes e cria as padrão
    await deleteUserSettings(userId);
    const defaultSettings = await createDefaultUserSettings(userId);

    res.status(200).json({
      success: true,
      message: "Configurações resetadas para os padrões com sucesso.",
      data: defaultSettings
    });
  } catch (error) {
    logger.error("[resetUserSettings] Erro ao resetar configurações:", error);
    res.status(500).json({ 
      success: false,
      message: "Erro interno ao resetar as configurações." 
    });
  }
};
  
