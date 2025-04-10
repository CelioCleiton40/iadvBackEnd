import { ObjectId } from "mongodb";
import { connectToDatabase } from "../config/dataBase";
import { Advogado } from "../models/advogadoModel";

const collectionName = "advogados";

export const advogadoService = {
  async criar(advogado: Advogado) {
    const db = await connectToDatabase();
    const data = {
      ...advogado,
      criadoEm: new Date(),
      atualizadoEm: new Date(),
    };

    // Remove _id se estiver undefined
    const { _id, ...dataWithoutId } = data;
    const result = await db.collection<Advogado>(collectionName).insertOne(dataWithoutId);
    return result.insertedId;
  },

  async listarTodos(): Promise<Advogado[]> {
    const db = await connectToDatabase();
    return await db.collection<Advogado>(collectionName).find().toArray();
  },

  async buscarPorId(id: string): Promise<Advogado | null> {
    if (!ObjectId.isValid(id)) {
      throw new Error("ID inválido");
    }
    const db = await connectToDatabase();
    return await db
      .collection<Advogado>(collectionName)
      .findOne({ _id: new ObjectId(id) });
  },

  async atualizar(id: string, dados: Partial<Advogado>) {
    if (!ObjectId.isValid(id)) {
      throw new Error("ID inválido");
    }
    const db = await connectToDatabase();
    return await db
      .collection<Advogado>(collectionName)
      .updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            ...dados,
            atualizadoEm: new Date(),
          },
        }
      );
  },

  async deletar(id: string) {
    if (!ObjectId.isValid(id)) {
      throw new Error("ID inválido");
    }
    const db = await connectToDatabase();
    return await db
      .collection<Advogado>(collectionName)
      .deleteOne({ _id: new ObjectId(id) });
  },
};
