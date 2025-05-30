import axios from 'axios';
import { Db } from 'mongodb';
import { Processo } from '../types/Processo';
import dotenv from 'dotenv';

dotenv.config();

const DATAJUD_API_URL = process.env.DATAJUD_API_URL;
const DATAJUD_API_KEY = process.env.DATAJUD_API_KEY;

if (!DATAJUD_API_URL || !DATAJUD_API_KEY) {
  throw new Error('DATAJUD_API_URL or DATAJUD_API_KEY is not defined. Please check your .env file.');
}

/**
 * Busca um processo no DataJud e registra no MongoDB.
 * @param db conexão com o banco MongoDB
 * @param numeroProcesso número do processo a ser buscado
 */
export async function buscarERegistrarProcesso(db: Db, numeroProcesso: string): Promise<Processo> {
  const headers = {
    Authorization: `APIKey ${DATAJUD_API_KEY}`,
    'Content-Type': 'application/json',
  };

  const query = {
    query: {
      match: { numeroProcesso },
    },
  };

  const { data } = await axios.post(DATAJUD_API_URL!, query, { headers });

  if (data.hits.total.value === 0) {
    throw new Error('Processo não encontrado');
  }

  const processoData: Processo = data.hits.hits[0]._source;

  // Salvar no MongoDB com upsert
  await db.collection<Processo>('processos').updateOne(
    { numeroProcesso },
    { $set: processoData },
    { upsert: true }
  );

  return processoData;
}
