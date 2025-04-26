import { connectToDatabase } from '../config/dataBase';
import { ObjectId } from 'mongodb';
import { IUserProfile } from '../types/userProfile.types';
import { advogadoSchema } from '../utils/validation';
import logger from '../utils/logger';

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

/**
 * Sanitiza dados antes da validação para evitar problemas de formatação.
 * @param data - Dados brutos do perfil.
 * @returns Dados sanitizados.
 */
const sanitizeUserData = (data: Partial<IUserProfile>): Partial<IUserProfile> => ({
  ...data,
  nomeCompleto: data.nomeCompleto?.trim().replace(/\s+/g, ' '), // Remove espaços extras
  email: data.email?.trim().toLowerCase(), // Normaliza o email
  cpf: data.cpf?.replace(/\D/g, ''), // Remove caracteres não numéricos
  telefone: data.telefone?.replace(/\D/g, '') // Remove caracteres não numéricos
});

/**
 * Valida e sanitiza os dados do perfil.
 * @param data - Dados brutos do perfil.
 * @returns Dados validados e sanitizados.
 * @throws Erro de validação com detalhes sobre os campos inválidos.
 */
const validateAndSanitizeUserProfile = (data: Partial<IUserProfile>): Partial<IUserProfile> => {
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
 * @param userId - ID do usuário.
 * @param data - Dados do perfil a serem criados ou atualizados.
 * @returns Perfil criado ou atualizado.
 * @throws Erro em caso de falha na validação ou acesso ao banco de dados.
 */
export const createOrUpdateProfile = async (userId: string, data: Partial<IUserProfile>): Promise<IUserProfile | null> => {
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
          userId, // Garante que o userId esteja sempre presente
          atualizadoEm: now
        },
        $setOnInsert: {
          profileId: new ObjectId(), // Cria um profileId único
          criadoEm: now
        }
      },
      {
        upsert: true,
        returnDocument: 'after'
      }
    );
    if (!result) {
      logger.warn("[createOrUpdateProfile] Nenhum perfil encontrado ou atualizado:", userId);
      throw new Error('Nenhum perfil encontrado ou atualizado.');
    }

    return result as unknown as IUserProfile;
  } catch (error: any) {
    logger.error('[createOrUpdateProfile] Erro ao criar/atualizar perfil:', error);
    if (error.details) throw error;
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