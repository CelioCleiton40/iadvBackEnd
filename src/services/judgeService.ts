import fetch from 'node-fetch';
import { client } from '../config/dataBase';
import { JuizData } from '../types/judgeTypes';
import { ObjectId } from 'mongodb';

const EXTERNAL_API_URL = 'https://api-externa.com/juiz'; // substituir pela real
const DB_NAME = 'iadvdb';
const JUDGE_COLLECTION_NAME = 'juizes';

// Valida o tipo de decisão e normaliza se necessário
function validateTipoDecisao(tipo: string): "Procedente" | "Improcedente" | "Parcialmente Procedente" {
  switch (tipo) {
    case "Procedente":
    case "Improcedente":
    case "Parcialmente Procedente":
      return tipo;
    default:
      return "Improcedente"; // valor padrão
  }
}

interface ExternalApiJudgmentResponse {
  idJuiz: string;
  jurisprudencia: string[];
  estatisticas: {
    procedentes: number;
    parciais: number;
    improcedentes: number;
  };
  tempo_medio_julgamento: string;
  processos_ativos: number;
  decisoes_recentes: Array<{
    tipo: string;
    processo: string;
    data: string;
  }>;
  tendencias: string[];
  alertas: string[];
}

/**
 * Busca dados do juiz na API externa
 */
export async function fetchJuizFromExternalApi(id: string): Promise<JuizData> {
  try {
    const response = await fetch(`${EXTERNAL_API_URL}/${id}`);

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
    }

    const rawData: ExternalApiJudgmentResponse = await response.json();

    const decisoesRecentes = (rawData.decisoes_recentes || []).map(d => ({
      ...d,
      tipo: validateTipoDecisao(d.tipo)
    }));

    return {
      id: rawData.idJuiz,
      jurisprudencia: rawData.jurisprudencia || [],
      estatisticas: rawData.estatisticas || {
        procedentes: 0,
        parciais: 0,
        improcedentes: 0,
      },
      tempoMedio: rawData.tempo_medio_julgamento || 'N/A',
      processos: rawData.processos_ativos || 0,
      decisoesRecentes,
      tendencias: rawData.tendencias || [],
      alertas: rawData.alertas || [],
    };
  } catch (error: any) {
    console.error('Erro ao buscar dados do juiz:', error.message);
    throw new Error(`Falha ao buscar dados do juiz: ${error.message}`);
  }
}

/**
 * Salva os dados do juiz no MongoDB
 */
export async function saveJuizToDatabase(juizData: JuizData): Promise<void> {
  const collection = client.db(DB_NAME).collection(JUDGE_COLLECTION_NAME);

  try {
    await collection.updateOne(
      { id: juizData.id },
      { $set: juizData },
      { upsert: true }
    );
  } catch (error: any) {
    console.error('Erro ao salvar juiz no banco:', error.message);
    throw new Error(`Não foi possível salvar os dados do juiz localmente.`);
  }
}

/**
 * Busca dados do juiz no banco local
 */
export async function getJuizFromDatabase(id: string): Promise<JuizData | null> {
  const collection = client.db(DB_NAME).collection(JUDGE_COLLECTION_NAME);

  try {
    const juiz = await collection.findOne({ _id: new ObjectId(id) });

    if (!juiz) return null;

    const { _id, ...rest } = juiz;

    return {
      id: typeof _id === 'object' && _id instanceof ObjectId ? _id.toHexString() : _id,
      ...rest,
    } as JuizData;
  } catch (error: any) {
    console.error('Erro ao buscar juiz no banco:', error.message);
    return null;
  }
}
