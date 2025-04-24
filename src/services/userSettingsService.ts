import { client } from "../config/dataBase";
import { ObjectId } from "mongodb";
import { IUserSettings } from "../types/settingsTypes";

/**
 * Salva ou atualiza as configurações do usuário no banco de dados.
 * @param userId - ID do usuário.
 * @param settings - Dados das configurações.
 * @returns Configurações atualizadas.
 */
export const createOrUpdateUserSettings = async (userId: string, settings: Partial<IUserSettings>) => {
  try {
    // Validação básica do userId
    if (!ObjectId.isValid(userId)) {
      throw new Error("ID de usuário inválido.");
    }

    const db = client.db("iadvdb");
    const now = new Date();

    // Atualiza ou cria as configurações do usuário
    const result = await db.collection("userSettings").findOneAndUpdate(
      { userId }, // Filtro pelo userId
      {
        $set: {
          ...settings,
          updatedAt: now // Atualiza a data da última modificação
        },
        $setOnInsert: {
          userId,
          createdAt: now // Define a data de criação apenas na primeira inserção
        }
      },
      {
        upsert: true, // Cria um novo documento se não existir
        returnDocument: "after" // Retorna o documento atualizado
      }
    );

    return result?.value || null;
  } catch (error) {
    console.error("[createOrUpdateUserSettings] Erro ao salvar configurações:", error);
    throw new Error("Erro ao processar as configurações.");
  }
};

/**
 * Busca as configurações do usuário no banco de dados.
 * @param userId - ID do usuário.
 * @returns Configurações do usuário ou null se não encontradas.
 */
export const getUserSettings = async (userId: string): Promise<IUserSettings | null> => {
  try {
    // Validação básica do userId
    if (!ObjectId.isValid(userId)) {
      throw new Error("ID de usuário inválido.");
    }

    const db = client.db("iadvdb");
    const settings = await db.collection("userSettings").findOne({ userId });

    return settings?.value || null;
  } catch (error) {
    console.error("[getUserSettings] Erro ao buscar configurações:", error);
    throw new Error("Erro ao buscar as configurações.");
  }
};