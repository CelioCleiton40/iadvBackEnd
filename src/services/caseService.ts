import { client } from '../config/dataBase';
import { Caso } from '../models/caseModel';
import { createCasoSchema } from '../schemas/caseSchema';
import { ObjectId, FindOneAndUpdateOptions, WithId } from 'mongodb';

const getCasoCollection = () => client.db('iadvdb').collection<Caso>('casos');

const validateObjectId = (id: string, label: string) => {
  if (!ObjectId.isValid(id)) throw new Error(`ID de ${label} inválido.`);
  return new ObjectId(id);
};

/**
 * Converte data (se vier como string) para objeto Date.
 */
const parseData = (data?: string | Date): Date | undefined => {
  if (!data) return undefined;
  return typeof data === 'string' ? new Date(data) : data;
};

/**
 * Cria um novo caso.
 */
export const createCaso = async (userId: string, casoData: unknown): Promise<Caso> => {
  const userObjectId = validateObjectId(userId, 'usuário');
  const validatedData = createCasoSchema.parse(casoData);
  
  const novoCaso: Caso = {
    ...validatedData,
    data: parseData(validatedData.data),
    criadoPor: userObjectId,
    criadoEm: new Date(),
    atualizadoEm: new Date(),
  };
  
  const result = await getCasoCollection().insertOne(novoCaso);
  
  return { ...novoCaso, _id: result.insertedId };
};

/**
 * Retorna todos os casos de um usuário.
 */
export const getCasosByUserId = async (userId: string): Promise<Caso[]> => {
  const userObjectId = validateObjectId(userId, 'usuário');
  return getCasoCollection()
    .find({ criadoPor: userObjectId })
    .toArray();
};

/**
 * Retorna um único caso se o usuário for o criador.
 */
export const getCasoById = async (casoId: string, userId: string): Promise<Caso | null> => {
  const [casoObjectId, userObjectId] = [validateObjectId(casoId, 'caso'), validateObjectId(userId, 'usuário')];
  return getCasoCollection().findOne({ _id: casoObjectId, criadoPor: userObjectId });
};

/**
 * Atualiza um caso se o usuário for o criador.
 */
export const updateCaso = async (
  casoId: string,
  userId: string,
  casoData: unknown
): Promise<WithId<Caso>> => {
  const [casoObjectId, userObjectId] = [
    validateObjectId(casoId, 'caso'),
    validateObjectId(userId, 'usuário'),
  ];
  
  const validatedData = createCasoSchema.parse(casoData);
  
  const updateFields: Partial<Caso> = {
    nome: validatedData.nome,
    descricao: validatedData.descricao,
    categoria: validatedData.categoria,
    imagem: validatedData.imagem,
    local: validatedData.local,
    data: parseData(validatedData.data),
    atualizadoEm: new Date(),
  };
  
  const options = { returnDocument: 'after' } as FindOneAndUpdateOptions;
  
  const result = await getCasoCollection().findOneAndUpdate(
    { _id: casoObjectId, criadoPor: userObjectId },
    { $set: updateFields },
    options
  );
  
  if (!result) {
    throw new Error('Você não tem permissão ou o caso não foi encontrado.');
  }
  
  return result;
};

/**
 * Exclui um caso se o usuário for o criador.
 */
export const deleteCaso = async (casoId: string, userId: string): Promise<boolean> => {
  const [casoObjectId, userObjectId] = [validateObjectId(casoId, 'caso'), validateObjectId(userId, 'usuário')];
  
  const result = await getCasoCollection().deleteOne({ _id: casoObjectId, criadoPor: userObjectId });
  
  if (result.deletedCount !== 1) {
    throw new Error('Você não tem permissão ou o caso não foi encontrado.');
  }
  
  return true;
};