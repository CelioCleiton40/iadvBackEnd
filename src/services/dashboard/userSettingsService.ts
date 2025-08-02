import { client } from "../../config/dataBase";
import { ObjectId } from "mongodb";
import { IUserSettings } from "../../types/settingsTypes";
import logger from "../../utils/logger";
import { UpdateUserSettingsInput } from "../../schemas/userSettingsSchema";

const DB_NAME = "iadvdb";
const COLLECTION_NAME = "userSettings";

/**
 * Salva ou atualiza as configurações do usuário no banco de dados.
 */
export const createOrUpdateUserSettings = async (
  userId: string,
  settings: UpdateUserSettingsInput
): Promise<IUserSettings> => {
  try {
    if (!ObjectId.isValid(userId)) {
      logger.error(`[createOrUpdateUserSettings] userId inválido: ${userId}`);
      throw new Error("ID de usuário inválido.");
    }

    const db = client.db(DB_NAME);
    const userObjectId = new ObjectId(userId);
    const now = new Date();

    logger.info(`[createOrUpdateUserSettings] Atualizando configurações para userId: ${userId}`);

    const result = await db.collection(COLLECTION_NAME).findOneAndUpdate(
      { userId: userObjectId },
      {
        $set: {
          ...settings,
          userId: userObjectId,
          updatedAt: now
        },
        $setOnInsert: {
          createdAt: now
        }
      },
      {
        upsert: true,
        returnDocument: "after"
      }
    );

    if (!result) {
      logger.error(`[createOrUpdateUserSettings] Falha ao salvar configurações para userId: ${userId}`);
      throw new Error("Falha ao salvar configurações.");
    }

    logger.info(`[createOrUpdateUserSettings] Configurações salvas com sucesso para userId: ${userId}`);
    return result as unknown as IUserSettings;
  } catch (error) {
    logger.error("[createOrUpdateUserSettings] Erro ao salvar configurações:", error);
    throw new Error("Erro ao processar as configurações.");
  }
};

/**
 * Busca as configurações do usuário no banco de dados.
 */
export const getUserSettings = async (userId: string): Promise<IUserSettings | null> => {
  try {
    if (!ObjectId.isValid(userId)) {
      logger.error(`[getUserSettings] userId inválido: ${userId}`);
      throw new Error("ID de usuário inválido.");
    }

    const db = client.db(DB_NAME);
    const userObjectId = new ObjectId(userId);

    logger.info(`[getUserSettings] Buscando configurações para userId: ${userId}`);
    
    const settings = await db.collection(COLLECTION_NAME).findOne({ userId: userObjectId });

    if (!settings) {
      logger.info(`[getUserSettings] Configurações não encontradas para userId: ${userId}`);
      return null;
    }

    logger.info(`[getUserSettings] Configurações encontradas para userId: ${userId}`);
    return settings as unknown as IUserSettings;
  } catch (error) {
    logger.error("[getUserSettings] Erro ao buscar configurações:", error);
    throw new Error("Erro ao buscar as configurações.");
  }
};

/**
 * Cria configurações padrão para um novo usuário.
 */
export const createDefaultUserSettings = async (userId: string): Promise<IUserSettings> => {
  try {
    if (!ObjectId.isValid(userId)) {
      logger.error(`[createDefaultUserSettings] userId inválido: ${userId}`);
      throw new Error("ID de usuário inválido.");
    }

    const defaultSettings: UpdateUserSettingsInput = {
      language: 'pt-BR',
      timezone: 'America/Sao_Paulo',
      notifications: {
        email: true,
        push: true,
        deadlineAlerts: true,
        alertDaysBefore: 3
      },
      appearance: {
        theme: 'system',
        compactMode: false,
        animations: true
      },
      privacy: {
        twoFactorAuth: false,
        activityLog: true,
        dataSharing: false
      }
    };

    return await createOrUpdateUserSettings(userId, defaultSettings);
  } catch (error) {
    logger.error("[createDefaultUserSettings] Erro ao criar configurações padrão:", error);
    throw new Error("Erro ao criar configurações padrão.");
  }
};

/**
 * Deleta as configurações do usuário.
 */
export const deleteUserSettings = async (userId: string): Promise<boolean> => {
  try {
    if (!ObjectId.isValid(userId)) {
      logger.error(`[deleteUserSettings] userId inválido: ${userId}`);
      throw new Error("ID de usuário inválido.");
    }

    const db = client.db(DB_NAME);
    const userObjectId = new ObjectId(userId);

    logger.info(`[deleteUserSettings] Deletando configurações para userId: ${userId}`);
    
    const result = await db.collection(COLLECTION_NAME).deleteOne({ userId: userObjectId });

    if (result.deletedCount === 0) {
      logger.warn(`[deleteUserSettings] Nenhuma configuração encontrada para deletar userId: ${userId}`);
      return false;
    }

    logger.info(`[deleteUserSettings] Configurações deletadas com sucesso para userId: ${userId}`);
    return true;
  } catch (error) {
    logger.error("[deleteUserSettings] Erro ao deletar configurações:", error);
    throw new Error("Erro ao deletar as configurações.");
  }
};
