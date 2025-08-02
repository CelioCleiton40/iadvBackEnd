import axios from 'axios';
import { Db } from 'mongodb';
import { Processo } from '../../types/Processo';
import { ProcessoSlim } from '../../types/ProcessoSlim';
import { mapApiToSlim } from '../../utils/mapProcesso';
import logger from '../../utils/logger';
import dotenv from 'dotenv';

dotenv.config();

const { DATAJUD_API_URL, DATAJUD_API_KEY } = process.env;

if (!DATAJUD_API_URL || !DATAJUD_API_KEY) {
  throw new Error('DATAJUD_API_URL or DATAJUD_API_KEY is not defined. Check your .env file.');
}

// Rick's comment: Configuração da API do CNJ - porque até o multiverso jurídico precisa de organização
const DATAJUD_CONFIG = {
  baseURL: DATAJUD_API_URL,
  timeout: 30000, // 30 segundos - tempo suficiente para processos interdimensionais
  headers: {
    'Authorization': `APIKey ${DATAJUD_API_KEY}`,
    'Content-Type': 'application/json',
    'User-Agent': 'iAdv-Backend/1.0.0'
  }
};

/**
 * Busca um processo no DataJud CNJ, converte para ProcessoSlim
 * e registra/atualiza no MongoDB.
 * 
 * Rick's comment: Esta função é o portal interdimensional para os dados jurídicos do CNJ.
 * Não é magia, é só uma API bem documentada... ao contrário da minha vida.
 *
 * @param db            Conexão MongoDB
 * @param numeroProcesso Número do processo (formato CNJ: 0000000-00.0000.0.00.0000)
 * @returns              ProcessoSlim salvo no banco
 * @throws              Error se processo não encontrado ou erro na API
 */
export async function buscarERegistrarProcesso(
  db: Db,
  numeroProcesso: string
): Promise<ProcessoSlim> {
  try {
    logger.info(`[DataJud] Iniciando busca do processo: ${numeroProcesso}`);
    
    // Rick's comment: Validação básica - porque nem todo mundo sabe digitar um número de processo
    if (!numeroProcesso || numeroProcesso.trim().length === 0) {
      throw new Error('Número do processo é obrigatório');
    }

    // ---------- 1. Verificar se já existe no banco ----------
    const processoExistente = await db.collection<ProcessoSlim>('processos_slim')
      .findOne({ numeroProcesso: numeroProcesso.trim() });
    
    if (processoExistente) {
      logger.info(`[DataJud] Processo ${numeroProcesso} encontrado no cache local`);
      return processoExistente;
    }

    // ---------- 2. Chamada à API do CNJ ----------
    const query = {
      query: {
        match: {
          numeroProcesso: numeroProcesso.trim()
        }
      },
      size: 1 // Rick's comment: Só precisamos do primeiro resultado, não de todo o multiverso
    };

    logger.info(`[DataJud] Consultando API CNJ para processo: ${numeroProcesso}`);
    
    const response = await axios.post(DATAJUD_CONFIG.baseURL!, query, {
      headers: DATAJUD_CONFIG.headers,
      timeout: DATAJUD_CONFIG.timeout
    });

    // Rick's comment: Verificar se a API retornou alguma coisa útil
    if (!response.data || !response.data.hits || response.data.hits.total.value === 0) {
      logger.warn(`[DataJud] Processo ${numeroProcesso} não encontrado na API CNJ`);
      throw new Error(`Processo ${numeroProcesso} não encontrado no DataJud CNJ`);
    }

    // ---------- 3. Conversão API → ProcessoSlim ----------
    const hit = response.data.hits.hits[0];
    const processoBruto: Processo = hit._source;
    const processoSlim: ProcessoSlim = mapApiToSlim(hit);

    logger.info(`[DataJud] Processo ${numeroProcesso} convertido para ProcessoSlim`);

    // ---------- 4. Persistência no MongoDB ----------
    await db.collection<ProcessoSlim>('processos_slim').updateOne(
      { numeroProcesso: processoSlim.numeroProcesso },
      { 
        $set: {
          ...processoSlim,
          ultimaConsulta: new Date().toISOString() // Rick's comment: Timestamp para controle de cache
        }
      },
      { upsert: true }
    );

    logger.info(`[DataJud] Processo ${numeroProcesso} salvo no banco com sucesso`);
    return processoSlim;

  } catch (error: any) {
    // Rick's comment: Tratamento de erro digno de um cientista louco
    logger.error(`[DataJud] Erro ao buscar processo ${numeroProcesso}:`, {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });

    if (error.code === 'ECONNABORTED') {
      throw new Error('Timeout na consulta ao DataJud CNJ. Tente novamente.');
    }
    
    if (error.response?.status === 401) {
      throw new Error('Erro de autenticação na API DataJud CNJ. Verifique a API Key.');
    }
    
    if (error.response?.status === 429) {
      throw new Error('Limite de requisições excedido na API DataJud CNJ. Tente novamente mais tarde.');
    }
    
    if (error.response?.status >= 500) {
      throw new Error('Erro interno na API DataJud CNJ. Tente novamente mais tarde.');
    }

    // Rick's comment: Se chegou até aqui, é erro nosso ou algo muito estranho
    throw new Error(`Erro ao consultar processo: ${error.message}`);
  }
}
