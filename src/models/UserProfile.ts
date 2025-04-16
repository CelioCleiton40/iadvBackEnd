import { Db, WithId, Document, ObjectId } from "mongodb";
import { IUserProfile } from "../types/userProfile.types";

// Nome da coleção
const COLLECTION_NAME = "userProfiles";

// Criação automática ou atualização
export const upsertUserProfile = async (
  db: Db,
  userId: ObjectId,
  data: Partial<IUserProfile>
): Promise<WithId<Document> | null> => {
  const result = await db.collection(COLLECTION_NAME).findOneAndUpdate(
    { userId },
    {
      $set: {
        ...data,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    {
      returnDocument: "after",
      upsert: true,
    }
  );
  return result?.value || null;
};

// Buscar perfil existente
export const getUserProfileByUserId = async (
  db: Db,
  userId: ObjectId
): Promise<WithId<Document> | null> => {
  return await db.collection(COLLECTION_NAME).findOne({ userId });
};
