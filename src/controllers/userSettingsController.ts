import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import { createOrUpdateUserSettings, getUserSettings } from "../services/userSettingsService";

/**
 * Controlador para salvar ou atualizar as configurações do usuário.
 */
export const saveUserSettings = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ message: "Não autorizado." });
        return;
      }
  
      const settings = req.body;
      const updatedSettings = await createOrUpdateUserSettings(userId, settings);
  
      res.status(200).json({
        message: "Configurações salvas com sucesso.",
        settings: updatedSettings
      });
    } catch (error) {
      console.error("[saveUserSettings] Erro ao salvar configurações:", error);
      res.status(500).json({ message: "Erro interno ao salvar as configurações." });
    }
  };
  

/**
 * Controlador para buscar as configurações do usuário.
 */
export const fetchUserSettings = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ message: "Não autorizado." });
        return; // precisa sair da função, mas sem retornar a resposta
      }
  
      const settings = await getUserSettings(userId);
  
      if (!settings) {
        res.status(404).json({ message: "Configurações não encontradas." });
        return;
      }
  
      res.status(200).json(settings);
    } catch (error) {
      console.error("[fetchUserSettings] Erro ao buscar configurações:", error);
      res.status(500).json({ message: "Erro interno ao buscar as configurações." });
    }
  };
  
