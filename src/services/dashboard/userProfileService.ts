import { connectToDatabase } from '../../config/dataBase';
import { ObjectId } from 'mongodb';
import { IUserProfile } from '../../types/userProfile.types';
import { userProfileSchema, updateUserProfileSchema, UserProfileInput, UpdateUserProfileInput } from '../../schemas/userProfile';
import logger from '../../utils/logger';

const COLLECTION_NAME = 'userProfiles';

/**
 * Validação reforçada do ID do usuário.
 * @param userId - ID do usuário a ser validado.
 * @throws Erro se o ID for inválido ou malformado.
 */
const validateUserId = (userId: string): void => {
  if (typeof userId !== 'string' || userId.trim().length === 0) {
    logger.warn("[validateUserId] ID de usuário inválido:", userId);
    throw new Error('ID de usuário inválido.');
  }

  if (!ObjectId.isValid(userId)) {
    logger.warn("[validateUserId] Formato de ID inválido:", userId);
    throw new Error('Formato de ID inválido.');
  }
};

// Rick's comment: Função sanitizeUserData removida - agora o Zod faz isso automaticamente com transforms

/**
 * Valida e sanitiza os dados do perfil.
 * Rick's comment: Validação que funciona de verdade, não essa bagunça anterior.
 * @param data - Dados brutos do perfil.
 * @param isUpdate - Se é uma atualização parcial ou criação completa.
 * @returns Dados validados e sanitizados.
 * @throws Erro de validação com detalhes sobre os campos inválidos.
 */
const validateAndSanitizeUserProfile = (data: Partial<IUserProfile>, isUpdate: boolean = false): UserProfileInput | UpdateUserProfileInput => {
  // Rick's comment: Remove campos que não devem ser alterados pelo usuário
  delete (data as any).userId;
  delete (data as any)._id;
  delete (data as any).createdAt;
  delete (data as any).updatedAt;

  const schema = isUpdate ? updateUserProfileSchema : userProfileSchema;
  const parsed = schema.safeParse(data);

  if (!parsed.success) {
    const details = parsed.error.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message
    }));

    logger.warn(`[validateAndSanitizeUserProfile] Erro de validação:`, details);
    const validationError = new Error('Erro de validação');
    (validationError as any).details = details;
    throw validationError;
  }

  return parsed.data;
};

/**
 * Busca o perfil do usuário pelo ID do usuário.
 * @param userId - ID do usuário.
 * @returns Perfil do usuário ou null se não encontrado.
 * @throws Erro em caso de falha ao acessar o banco de dados.
 */
export const getProfileByUserId = async (userId: string): Promise<IUserProfile | null> => {
  try {
    validateUserId(userId);
    const db = await connectToDatabase();
    const profile = await db.collection(COLLECTION_NAME).findOne<IUserProfile>({ userId });

    // Retorna perfil com dados mascarados para segurança
    if (profile) {
      profile.cpf = profile.cpf?.replace(/(\d{3})\d{6}(\d{2})/, '$1******$2'); // Mascarar CPF
      profile.telefone = profile.telefone?.replace(/(\d{2})\d{5}(\d{4})/, '($1) *****-$2'); // Mascarar telefone
    }

    return profile || null;
  } catch (error) {
    logger.error('[getProfileByUserId] Erro ao buscar perfil:', error);
    throw new Error('Erro ao buscar o perfil do usuário.');
  }
};

/**
 * Cria ou atualiza o perfil do usuário.
 * Rick's comment: Upsert que funciona de verdade, com validação e tudo mais.
 * @param userId - ID do usuário.
 * @param data - Dados do perfil a serem criados ou atualizados.
 * @returns Perfil criado ou atualizado.
 * @throws Erro em caso de falha na validação ou acesso ao banco de dados.
 */
export const createOrUpdateProfile = async (userId: string, data: Partial<IUserProfile>): Promise<IUserProfile | null> => {
  try {
    validateUserId(userId);
    logger.info(`[createOrUpdateProfile] Iniciando criação/atualização do perfil para userId: ${userId}`);

    // Rick's comment: Verifica se é atualização (perfil já existe)
    const db = await connectToDatabase();
    const existingProfile = await db.collection(COLLECTION_NAME).findOne({ userId });
    const isUpdate = !!existingProfile;

    const validatedData = validateAndSanitizeUserProfile(data, isUpdate);
    const now = new Date().toISOString();

    const updateData: any = {
      ...validatedData,
      userId, // Rick's comment: Garante que o userId esteja sempre presente
      updatedAt: now
    };

    const result = await db.collection(COLLECTION_NAME).findOneAndUpdate(
      { userId },
      {
        $set: updateData,
        $setOnInsert: {
          _id: new ObjectId(),
          profileId: new ObjectId(), // Rick's comment: ID único para busca pública
          createdAt: now
        }
      },
      {
        upsert: true,
        returnDocument: 'after'
      }
    );

    if (!result) {
      logger.error(`[createOrUpdateProfile] Falha ao criar/atualizar perfil para userId: ${userId}`);
      throw new Error('Falha ao processar o perfil.');
    }

    logger.info(`[createOrUpdateProfile] Perfil ${isUpdate ? 'atualizado' : 'criado'} com sucesso para userId: ${userId}`);
    
    // Rick's comment: Remove dados sensíveis antes de retornar
    const profileToReturn = result as unknown as IUserProfile;
    if (profileToReturn.cpf) {
      profileToReturn.cpf = profileToReturn.cpf.replace(/(\d{3})\d{6}(\d{2})/, '$1******$2');
    }
    if (profileToReturn.telefone) {
      profileToReturn.telefone = profileToReturn.telefone.replace(/(\d{2})\d{5}(\d{4})/, '($1) *****-$2');
    }

    return profileToReturn;
  } catch (error: any) {
    logger.error('[createOrUpdateProfile] Erro ao criar/atualizar perfil:', error);
    if (error.details) throw error; // Rick's comment: Repassa erros de validação
    throw new Error('Erro ao processar os dados do perfil.');
  }
};

/**
 * Exclui o perfil do usuário.
 * @param userId - ID do usuário.
 * @returns True se o perfil foi excluído, false caso contrário.
 * @throws Erro em caso de falha ao acessar o banco de dados.
 */
export const deleteProfile = async (userId: string): Promise<boolean> => {
  try {
    validateUserId(userId);
    const db = await connectToDatabase();
    const result = await db.collection(COLLECTION_NAME).deleteOne({ userId });
    return result.deletedCount > 0;
  } catch (error) {
    logger.error('[deleteProfile] Erro ao excluir perfil:', error);
    throw new Error('Erro ao excluir o perfil do usuário.');
  }
};

/**
 * Busca o perfil do usuário pelo profileId.
 * @param profileId - ID do perfil.
 * @returns Perfil do usuário ou null se não encontrado.
 * @throws Erro em caso de falha ao acessar o banco de dados.
 */
export const getProfileByProfileId = async (profileId: string): Promise<IUserProfile | null> => {
  try {
    if (!ObjectId.isValid(profileId)) {
      logger.warn("[getProfileByProfileId] ID de perfil inválido:", profileId);
      throw new Error('ID de perfil inválido.');
    }

    const db = await connectToDatabase();
    const profile = await db.collection(COLLECTION_NAME).findOne<IUserProfile>({ profileId: new ObjectId(profileId) });

    // Retorna perfil com dados mascarados para segurança
    if (profile) {
      profile.cpf = profile.cpf?.replace(/(\d{3})\d{6}(\d{2})/, '$1******$2'); // Mascarar CPF
      profile.telefone = profile.telefone?.replace(/(\d{2})\d{5}(\d{4})/, '($1) *****-$2'); // Mascarar telefone
    }

    return profile || null;
  } catch (error) {
    logger.error('[getProfileByProfileId] Erro ao buscar perfil:', error);
    throw new Error('Erro ao buscar o perfil do usuário.');
  }
};