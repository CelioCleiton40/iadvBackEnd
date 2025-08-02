import fetch from 'node-fetch';
import { client } from '../../config/dataBase';
import { JuizData } from '../../types/judgeTypes';
import { ObjectId } from 'mongodb';

// Rick: Configurações baseadas nos padrões do PJe - porque seguir padrões é coisa de gente inteligente
const DATAJUD_API_BASE = 'https://api-publica.datajud.cnj.jus.br';
const PJE_API_BASE = 'https://pje.tjmg.jus.br/pje/api/v1'; // Exemplo - cada tribunal tem seu endpoint
const DB_NAME = 'iadvdb';
const JUDGE_COLLECTION_NAME = 'magistrados'; // Nome mais profissional
const CACHE_TTL = 3600000; // 1 hora em ms - porque cache é vida

// Rick: Headers padrão seguindo as especificações do CNJ
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'User-Agent': 'iAdv-Backend/1.0.0'
};

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

// Rick: Interfaces seguindo padrões do PJe - estrutura orientada a recursos
interface PJeApiResponse<T> {
  status: 'ok' | 'error' | 'in-progress';
  code: number;
  data?: T;
  messages?: string[];
  timestamp?: string;
}

interface MagistradoDataJud {
  id: string;
  nome: string;
  tribunal: string;
  orgaoJulgador: string;
  competencia: string;
  situacao: 'ativo' | 'inativo' | 'aposentado';
  dataPosse?: string;
  dataAposentadoria?: string;
}

interface ProcessoMetadata {
  numeroProcesso: string;
  classe: string;
  assunto: string;
  dataAutuacao: string;
  orgaoJulgador: string;
  magistrado?: string;
  situacao: string;
}

interface EstatisticasMagistrado {
  totalProcessos: number;
  processosPendentes: number;
  processosJulgados: number;
  tempoMedioJulgamento: number; // em dias
  produtividade: {
    mes: number;
    ano: number;
    sentencas: number;
    decisoes: number;
    despachos: number;
  };
}

// Rick: Interface para resposta da API externa (se existir)
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
 * Rick: Busca dados do magistrado no DataJud seguindo padrões do PJe
 * Endpoint: /api/v1/magistrados/{id}
 */
export async function fetchMagistradoFromDataJud(id: string, apiKey?: string): Promise<JuizData> {
  try {
    // Rick: Headers com autenticação se disponível
    const headers = {
      ...DEFAULT_HEADERS,
      ...(apiKey && { 'Authorization': `APIKey ${apiKey}` })
    };

    // Rick: Primeiro tenta buscar no DataJud (dados oficiais)
    const datajudResponse = await fetch(`${DATAJUD_API_BASE}/api_publica_magistrados/_search`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: {
          match: {
            id: id
          }
        },
        size: 1
      })
    });

    if (datajudResponse.ok) {
      const datajudData = await datajudResponse.json();
      if (datajudData.hits?.hits?.length > 0) {
        return transformDataJudToJuizData(datajudData.hits.hits[0]._source);
      }
    }

    // Rick: Fallback para API externa (se configurada)
    return await fetchFromExternalApi(id);

  } catch (error: any) {
    console.error('Erro ao buscar dados do magistrado:', error.message);
    throw new Error(`Falha ao buscar dados do magistrado: ${error.message}`);
  }
}

/**
 * Rick: Transforma dados do DataJud para o formato interno
 */
function transformDataJudToJuizData(magistrado: MagistradoDataJud): JuizData {
  return {
    id: magistrado.id,
    jurisprudencia: [], // Rick: DataJud não fornece jurisprudência diretamente
    estatisticas: {
      procedentes: 0,
      parciais: 0,
      improcedentes: 0
    },
    tempoMedio: 'N/A',
    processos: 0,
    decisoesRecentes: [],
    tendencias: [`Tribunal: ${magistrado.tribunal}`, `Órgão: ${magistrado.orgaoJulgador}`],
    alertas: magistrado.situacao !== 'ativo' ? [`Magistrado ${magistrado.situacao}`] : []
  };
}

/**
 * Rick: Fallback para API externa (mantém compatibilidade)
 */
async function fetchFromExternalApi(id: string): Promise<JuizData> {
  // Rick: Implementação da API externa original (se existir)
  const response = await fetch(`https://api-externa.com/juiz/${id}`);
  
  if (!response.ok) {
    throw new Error(`API externa indisponível: ${response.status}`);
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
}

/**
 * Rick: Busca processos por magistrado seguindo padrões do PJe
 * Endpoint: /api/v1/magistrados/{id}/processos
 */
export async function fetchProcessosByMagistrado(
  magistradoId: string, 
  tribunal: string,
  apiKey?: string,
  limit: number = 100,
  vara?: string
): Promise<ProcessoMetadata[]> {
  try {
    const headers = {
      ...DEFAULT_HEADERS,
      ...(apiKey && { 'Authorization': `APIKey ${apiKey}` })
    };

    // Rick: Busca processos no DataJud por magistrado
    const queryMust: any[] = [
      { match: { magistrado: magistradoId } },
      { range: { dataAutuacao: { gte: "2023-01-01" } } } // Rick: Últimos 2 anos
    ];

    // Rick: Adiciona filtro por vara se especificado
    if (vara) {
      queryMust.push({ match: { orgaoJulgador: vara } });
    }

    const response = await fetch(`${DATAJUD_API_BASE}/api_publica_${tribunal.toLowerCase()}/_search`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: {
          bool: {
            must: queryMust
          }
        },
        size: limit,
        sort: [{ dataAutuacao: { order: "desc" } }]
      })
    });

    if (!response.ok) {
      throw new Error(`Erro na consulta de processos: ${response.status}`);
    }

    const data = await response.json();
    return data.hits?.hits?.map((hit: any) => hit._source) || [];

  } catch (error: any) {
    console.error('Erro ao buscar processos do magistrado:', error.message);
    return [];
  }
}

/**
 * Rick: Calcula estatísticas do magistrado baseado nos processos
 */
export async function calculateMagistradoStats(
  magistradoId: string,
  tribunal: string,
  apiKey?: string,
  vara?: string
): Promise<EstatisticasMagistrado> {
  try {
    const processos = await fetchProcessosByMagistrado(magistradoId, tribunal, apiKey, 1000, vara);
    
    const totalProcessos = processos.length;
    const processosPendentes = processos.filter(p => p.situacao === 'Em andamento').length;
    const processosJulgados = processos.filter(p => p.situacao === 'Julgado').length;
    
    // Rick: Cálculo básico do tempo médio (seria melhor com dados reais de movimentação)
    const tempoMedioJulgamento = processosJulgados > 0 ? 180 : 0; // 180 dias como estimativa
    
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    return {
      totalProcessos,
      processosPendentes,
      processosJulgados,
      tempoMedioJulgamento,
      produtividade: {
        mes: currentMonth,
        ano: currentYear,
        sentencas: Math.floor(processosJulgados * 0.6), // Rick: Estimativa
        decisoes: Math.floor(processosJulgados * 0.3),
        despachos: Math.floor(processosJulgados * 0.1)
      }
    };

  } catch (error: any) {
    console.error('Erro ao calcular estatísticas:', error.message);
    return {
      totalProcessos: 0,
      processosPendentes: 0,
      processosJulgados: 0,
      tempoMedioJulgamento: 0,
      produtividade: {
        mes: new Date().getMonth() + 1,
        ano: new Date().getFullYear(),
        sentencas: 0,
        decisoes: 0,
        despachos: 0
      }
    };
  }
}

/**
 * Rick: Salva os dados do magistrado no MongoDB com cache
 */
export async function saveMagistradoToDatabase(juizData: JuizData): Promise<void> {
  const collection = client.db(DB_NAME).collection(JUDGE_COLLECTION_NAME);

  try {
    const dataWithCache = {
      ...juizData,
      lastUpdated: new Date(),
      cacheExpiry: new Date(Date.now() + CACHE_TTL)
    };

    await collection.updateOne(
      { id: juizData.id },
      { $set: dataWithCache },
      { upsert: true }
    );
  } catch (error: any) {
    console.error('Erro ao salvar magistrado no banco:', error.message);
    throw new Error(`Não foi possível salvar os dados do magistrado localmente.`);
  }
}

/**
 * Rick: Busca dados do magistrado no banco local com verificação de cache
 */
export async function getMagistradoFromDatabase(id: string): Promise<JuizData | null> {
  const collection = client.db(DB_NAME).collection(JUDGE_COLLECTION_NAME);

  try {
    const magistrado = await collection.findOne({ id: id });

    if (!magistrado) return null;

    // Rick: Verifica se o cache ainda é válido
    const now = new Date();
    if (magistrado.cacheExpiry && new Date(magistrado.cacheExpiry) < now) {
      console.log(`Cache expirado para magistrado ${id}`);
      return null; // Rick: Cache expirado, força nova busca
    }

    const { _id, lastUpdated, cacheExpiry, ...rest } = magistrado;

    return rest as JuizData;
  } catch (error: any) {
    console.error('Erro ao buscar magistrado no banco:', error.message);
    return null;
  }
}

/**
 * Rick: Função principal que integra cache, DataJud e APIs externas
 * Seguindo padrões do PJe para busca inteligente de dados
 */
export async function getMagistradoData(
  id: string,
  tribunal: string = 'tjmg',
  apiKey?: string,
  forceRefresh: boolean = false,
  vara?: string
): Promise<JuizData> {
  // Rick: Validação de parâmetros - porque validar entrada é básico
  if (!id || id.trim() === '') {
    throw new Error('ID do magistrado é obrigatório');
  }
  
  if (!tribunal || tribunal.trim() === '') {
    throw new Error('Tribunal é obrigatório');
  }

  try {
    // Rick: 1. Verifica cache local primeiro (se não forçar refresh)
    if (!forceRefresh) {
      const cachedData = await getMagistradoFromDatabase(id);
      if (cachedData) {
        console.log(`Dados do magistrado ${id} obtidos do cache`);
        return cachedData;
      }
    }

    // Rick: 2. Busca dados frescos do DataJud
    console.log(`Buscando dados frescos do magistrado ${id}`);
    const magistradoData = await fetchMagistradoFromDataJud(id, apiKey);

    // Rick: 3. Enriquece com estatísticas se possível
    try {
      const stats = await calculateMagistradoStats(id, tribunal, apiKey, vara);
      magistradoData.processos = stats.totalProcessos;
      magistradoData.tempoMedio = `${stats.tempoMedioJulgamento} dias`;
      magistradoData.tendencias.push(
        `Processos pendentes: ${stats.processosPendentes}`,
        `Processos julgados: ${stats.processosJulgados}`,
        `Produtividade mensal: ${stats.produtividade.sentencas} sentenças`
      );
      
      // Rick: Adiciona informação da vara se especificada
      if (vara) {
        magistradoData.tendencias.push(`Vara: ${vara}`);
      }
    } catch (statsError) {
      console.warn('Não foi possível obter estatísticas detalhadas:', statsError);
    }

    // Rick: 4. Salva no cache para próximas consultas
    await saveMagistradoToDatabase(magistradoData);

    return magistradoData;

  } catch (error: any) {
    console.error('Erro ao obter dados do magistrado:', error.message);
    
    // Rick: Fallback para cache mesmo expirado em caso de erro
    try {
      const collection = client.db(DB_NAME).collection(JUDGE_COLLECTION_NAME);
      const fallbackData = await collection.findOne({ id: id });
      if (fallbackData) {
        console.log('Usando dados em cache como fallback');
        const { _id, lastUpdated, cacheExpiry, ...rest } = fallbackData;
        return rest as JuizData;
      }
    } catch (fallbackError) {
      console.error('Erro no fallback:', fallbackError);
    }

    throw new Error(`Não foi possível obter dados do magistrado ${id}: ${error.message}`);
  }
}

/**
 * Rick: Lista magistrados por tribunal seguindo padrões do PJe
 * Endpoint: /api/v1/tribunais/{tribunal}/magistrados
 */
export async function listMagistradosByTribunal(
  tribunal: string,
  apiKey?: string,
  limit: number = 50,
  offset: number = 0,
  vara?: string
): Promise<MagistradoDataJud[]> {
  try {
    const headers = {
      ...DEFAULT_HEADERS,
      ...(apiKey && { 'Authorization': `APIKey ${apiKey}` })
    };

    const queryMust: any[] = [
      { term: { tribunal: tribunal.toUpperCase() } },
      { term: { situacao: 'ativo' } }
    ];

    // Rick: Adiciona filtro por vara se especificado
    if (vara) {
      queryMust.push({ match: { orgaoJulgador: vara } });
    }

    const response = await fetch(`${DATAJUD_API_BASE}/api_publica_${tribunal.toLowerCase()}/_search`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: {
          bool: {
            must: queryMust
          }
        },
        size: limit,
        from: offset,
        sort: [{ nome: { order: "asc" } }]
      })
    });

    if (!response.ok) {
      throw new Error(`Erro na consulta de magistrados: ${response.status}`);
    }

    const data = await response.json();
    return data.hits?.hits?.map((hit: any) => hit._source) || [];

  } catch (error: any) {
    console.error('Erro ao listar magistrados:', error.message);
    return [];
  }
}

/**
 * Rick: Busca magistrados por vara específica
 * Útil para filtrar magistrados que atuam em uma vara determinada
 */
export async function listMagistradosByVara(
  tribunal: string,
  vara: string,
  apiKey?: string,
  limit: number = 50,
  offset: number = 0
): Promise<MagistradoDataJud[]> {
  try {
    const headers = {
      ...DEFAULT_HEADERS,
      ...(apiKey && { 'Authorization': `APIKey ${apiKey}` })
    };

    const response = await fetch(`${DATAJUD_API_BASE}/api_publica_${tribunal.toLowerCase()}/_search`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: {
          bool: {
            must: [
              { term: { tribunal: tribunal.toUpperCase() } },
              { term: { situacao: 'ativo' } },
              { match: { orgaoJulgador: vara } }
            ]
          }
        },
        size: limit,
        from: offset,
        sort: [{ nome: { order: "asc" } }]
      })
    });

    if (!response.ok) {
      throw new Error(`Erro na consulta de magistrados por vara: ${response.status}`);
    }

    const data = await response.json();
    return data.hits?.hits?.map((hit: any) => hit._source) || [];

  } catch (error: any) {
    console.error('Erro ao listar magistrados por vara:', error.message);
    return [];
  }
}

/**
 * Rick: Lista todas as varas disponíveis em um tribunal
 * Útil para popular dropdowns e filtros de vara
 */
export async function listVarasByTribunal(
  tribunal: string,
  apiKey?: string,
  limit: number = 100
): Promise<string[]> {
  try {
    const headers = {
      ...DEFAULT_HEADERS,
      ...(apiKey && { 'Authorization': `APIKey ${apiKey}` })
    };

    const response = await fetch(`${DATAJUD_API_BASE}/api_publica_${tribunal.toLowerCase()}/_search`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: {
          bool: {
            must: [
              { term: { tribunal: tribunal.toUpperCase() } },
              { term: { situacao: 'ativo' } }
            ]
          }
        },
        size: 0, // Rick: Não queremos documentos, só agregações
        aggs: {
          varas: {
            terms: {
              field: "orgaoJulgador.keyword",
              size: limit
            }
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Erro na consulta de varas: ${response.status}`);
    }

    const data = await response.json();
    return data.aggregations?.varas?.buckets?.map((bucket: any) => bucket.key) || [];

  } catch (error: any) {
    console.error('Erro ao listar varas:', error.message);
    return [];
  }
}

// Rick: Mantém compatibilidade com funções antigas
export const fetchJuizFromExternalApi = fetchMagistradoFromDataJud;
export const saveJuizToDatabase = saveMagistradoToDatabase;
export const getJuizFromDatabase = getMagistradoFromDatabase;
