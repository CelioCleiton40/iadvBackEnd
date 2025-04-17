import { connectToDatabase } from '../config/dataBase';
import { ObjectId } from 'mongodb';
import { IUserProfile } from '../types/userProfile.types';
import { advogadoSchema } from '../utils/validation';
import logger from '../utils/logger';

const COLLECTION_NAME = 'userProfiles';

// Validação reforçada do ID do usuário
const validateUserId = (userId: string) => {
  if (typeof userId !== 'string' || userId.trim().length === 0) {
    throw new Error('ID de usuário inválido.');
  }

  if (!ObjectId.isValid(userId)) {
     throw new Error('Formato de ID inválido.');
  }
};

// Sanitiza dados antes da validação
const sanitizeUserData = (data: Partial<IUserProfile>) => ({
  ...data,
  nomeCompleto: data.nomeCompleto?.trim().replace(/\s+/g, ' '),
  email: data.email?.trim().toLowerCase(),
  cpf: data.cpf?.replace(/\D/g, ''),
  telefone: data.telefone?.replace(/\D/g, ''),
});

// Valida os dados do perfil e evita campos perigosos
const validateAndSanitizeUserProfile = (data: Partial<IUserProfile>) => {
  delete (data as any).userId; // Bloqueia tentativa de sobrescrever userId

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

// Busca perfil por userId
export const getProfileByUserId = async (userId: string) => {
  try {
    validateUserId(userId);
    const db = await connectToDatabase();
    const profile = await db.collection(COLLECTION_NAME).findOne({ userId });

    // Retorna perfil com dados mascarados para segurança
    if (profile) {
      profile.cpf = profile.cpf?.replace(/(\d{3})\d{6}(\d{2})/, '$1******$2');
      profile.telefone = profile.telefone?.replace(/(\d{2})\d{5}(\d{4})/, '($1) *****-$2');
    }

    return profile || null;
  } catch (error) {
    logger.error('Erro ao buscar perfil do usuário:', error);
    throw new Error('Erro ao buscar o perfil do usuário.');
  }
};

// Cria ou atualiza perfil de forma segura
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

// Exclui perfil
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
