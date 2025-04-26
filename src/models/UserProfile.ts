import { Db, ObjectId } from "mongodb";
import { IUserProfile } from "../types/userProfile.types";

// Nome da coleção
const COLLECTION_NAME = "userProfiles";

export class UserProfileModel {
  private db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  /**
   * Cria ou atualiza o perfil de um usuário.
   * @param userId - ID do usuário (ObjectId ou string).
   * @param data - Dados do perfil a serem criados ou atualizados.
   * @returns O perfil criado ou atualizado.
   */
  public async upsertUserProfile(
    userId: ObjectId | string,
    data: Partial<IUserProfile>
  ): Promise<IUserProfile | null> {
    const userIdString = typeof userId === "string" ? userId : userId.toString();
    const now = new Date().toISOString();

    try {
      const result = await this.db.collection<IUserProfile>(COLLECTION_NAME).findOneAndUpdate(
        { userId: userIdString },
        {
          $set: {
            ...data,
            updatedAt: now,
          },
          $setOnInsert: {
            userId: userIdString,
            createdAt: now,
          },
        },
        {
          returnDocument: "after",
          upsert: true,
        }
      );

      return result.value || null;
    } catch (error) {
      console.error("[UserProfileModel] Erro ao criar/atualizar perfil:", error);
      throw new Error("Erro ao criar ou atualizar o perfil do usuário.");
    }
  }

  /**
   * Busca o perfil de um usuário pelo ID.
   * @param userId - ID do usuário (ObjectId ou string).
   * @returns O perfil do usuário ou null se não encontrado.
   */
  public async getUserProfileByUserId(
    userId: ObjectId | string
  ): Promise<IUserProfile | null> {
    const userIdString = typeof userId === "string" ? userId : userId.toString();

    try {
      const profile = await this.db.collection<IUserProfile>(COLLECTION_NAME).findOne({ userId: userIdString });

      if (!profile) {
        console.warn("[UserProfileModel] Perfil não encontrado para o userId:", userIdString);
        return null;
      }

      return profile;
    } catch (error) {
      console.error("[UserProfileModel] Erro ao buscar perfil:", error);
      throw new Error("Erro ao buscar o perfil do usuário.");
    }
  }

  /**
   * Exclui o perfil de um usuário pelo ID.
   * @param userId - ID do usuário (ObjectId ou string).
   * @returns True se o perfil foi excluído, false caso contrário.
   */
  public async deleteProfile(userId: ObjectId | string): Promise<boolean> {
    const userIdString = typeof userId === "string" ? userId : userId.toString();

    try {
      const result = await this.db.collection(COLLECTION_NAME).deleteOne({ userId: userIdString });
      return result.deletedCount > 0;
    } catch (error) {
      console.error("[UserProfileModel] Erro ao excluir perfil:", error);
      throw new Error("Erro ao excluir o perfil do usuário.");
    }
  }

  /**
   * Lista todos os perfis de usuário.
   * @returns Uma lista de perfis de usuário.
   */
  public async listAllProfiles(): Promise<IUserProfile[]> {
    try {
      const profiles = await this.db.collection<IUserProfile>(COLLECTION_NAME).find({}).toArray();
      return profiles;
    } catch (error) {
      console.error("[UserProfileModel] Erro ao listar perfis:", error);
      throw new Error("Erro ao listar os perfis de usuário.");
    }
  }
}