import { connectToDatabase } from '../config/dataBase';
import { ObjectId } from 'mongodb';
import { IUserProfile } from '../types/userProfile.types';
import { advogadoSchema } from '../utils/validation';
import logger from '../utils/logger';

const COLLECTION_NAME = 'userProfiles';

const validateUserId = (userId: string) => {
  if (typeof userId !== 'string' || userId.trim().length === 0) {
    throw new Error('ID de usuário inválido.');
  }
};

const sanitizeUserData = (data: Partial<IUserProfile>) => ({
  ...data,
  nomeCompleto: data.nomeCompleto?.trim(),
  email: data.email?.trim().toLowerCase(),
  cpf: data.cpf?.replace(/\D/g, ''),
  telefone: data.telefone?.replace(/\D/g, ''),
});

const validateAndSanitizeUserProfile = (data: Partial<IUserProfile>) => {
  delete (data as any).userId; // Proteção extra

  const cleanData = sanitizeUserData(data);
  const parsed = advogadoSchema.safeParse(cleanData);

  if (!parsed.success) {
    const details = parsed.error.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message
    }));

    const validationError = new Error('Erro de validação');
    (validationError as any).details = details;
    throw validationError;
  }

  return parsed.data;
};

export const getProfileByUserId = async (userId: string) => {
  try {
    validateUserId(userId);
    const db = await connectToDatabase();
    return await db.collection(COLLECTION_NAME).findOne({ userId }) || null;
  } catch (error) {
    logger.error('Erro ao buscar perfil do usuário:', error);
    throw new Error('Erro ao buscar o perfil do usuário.');
  }
};

export const createOrUpdateProfile = async (userId: string, data: Partial<IUserProfile>) => {
  try {
    validateUserId(userId);

    const validatedData = validateAndSanitizeUserProfile(data);
    const db = await connectToDatabase();
    const now = new Date();

    const result = await db.collection(COLLECTION_NAME).findOneAndUpdate(
      { userId },
      {
        $set: {
          ...validatedData,
          atualizadoEm: now
        },
        $setOnInsert: {
          userId,
          criadoEm: now
        }
      },
      {
        upsert: true,
        returnDocument: 'after'
      }
    );

    return result?.value || null;
  } catch (error: any) {
    logger.error('Erro ao criar ou atualizar o perfil:', error);
    if (error.details) throw error;
    throw new Error('Erro ao processar os dados do perfil.');
  }
};

export const deleteProfile = async (userId: string) => {
  try {
    validateUserId(userId);
    const db = await connectToDatabase();
    const result = await db.collection(COLLECTION_NAME).deleteOne({ userId });
    return result.deletedCount > 0;
  } catch (error) {
    logger.error('Erro ao excluir perfil do usuário:', error);
    throw new Error('Erro ao excluir o perfil do usuário.');
  }
};
