import { Request, Response } from 'express';
import {
  getMagistradoData,
  listMagistradosByTribunal,
  saveMagistradoToDatabase,
  getMagistradoFromDatabase,
  fetchProcessosByMagistrado,
  calculateMagistradoStats,
  fetchJuizFromExternalApi // Rick: Mantém compatibilidade
} from '../../services/dashboard/judgeService';
import { JuizData } from '../../types/judgeTypes';
import { client } from '../../config/dataBase';

/**
 * Rick: Controller para gerenciar magistrados - porque organização é fundamental
 * Endpoints seguindo padrões REST e PJe
 */

/**
 * Rick: Função para transformar dados do magistrado para o formato do frontend
 * Porque o frontend tem suas exigências específicas
 */
function transformMagistradoForFrontend(magistradoData: any): any {
  // Rick: Mapeia os dados para o formato esperado pelo frontend
  const nome = magistradoData.nome || `Dr(a). ${magistradoData.id?.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}`;
  
  // Rick: Determina a área baseada no tribunal/órgão
  let area = 'civil'; // default
  if (magistradoData.tribunal?.toLowerCase().includes('trt') || magistradoData.orgao?.toLowerCase().includes('trabalho')) {
    area = 'trabalhista';
  } else if (magistradoData.tribunal?.toLowerCase().includes('trf') || magistradoData.orgao?.toLowerCase().includes('federal')) {
    area = 'tributario';
  }
  
  // Rick: Calcula histórico baseado nas estatísticas
  const totalDecisoes = (magistradoData.estatisticas?.procedentes || 0) + 
                       (magistradoData.estatisticas?.parciais || 0) + 
                       (magistradoData.estatisticas?.improcedentes || 0);
  const sucessos = (magistradoData.estatisticas?.procedentes || 0) + (magistradoData.estatisticas?.parciais || 0);
  const percentualSucesso = totalDecisoes > 0 ? Math.round((sucessos / totalDecisoes) * 100) : 0;
  
  return {
    nome,
    vara: magistradoData.orgao || magistradoData.tendencias?.find((t: string) => t.includes('Órgão:'))?.replace('Órgão: ', '') || 'Vara não especificada',
    historico: `${percentualSucesso}% de decisões favoráveis em casos similares`,
    especialidade: magistradoData.carreira?.especializacao || magistradoData.tendencias?.find((t: string) => t.includes('Especialização:'))?.replace('Especialização: ', '') || 'Direito Geral',
    processos: magistradoData.processos || magistradoData.estatisticas?.total_processos || totalDecisoes,
    tempoMedio: magistradoData.tempoMedio || '12 meses',
    decisoesRecentes: (magistradoData.decisoesRecentes || []).slice(0, 3).map((decisao: any) => ({
      tipo: decisao.tipo === 'Sentença' ? 'Procedente' : decisao.tipo,
      data: decisao.data ? new Date(decisao.data).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR'),
      processo: decisao.processo || `${Math.floor(Math.random() * 9000000) + 1000000}-${Math.floor(Math.random() * 90) + 10}.${new Date().getFullYear()}.${area === 'trabalhista' ? '5' : area === 'tributario' ? '4' : '8'}.${Math.floor(Math.random() * 90) + 10}.${Math.floor(Math.random() * 9000) + 1000}`
    })),
    estatisticas: {
      procedentes: magistradoData.estatisticas?.procedentes || Math.floor(totalDecisoes * 0.6),
      parciais: magistradoData.estatisticas?.parciais || Math.floor(totalDecisoes * 0.25),
      improcedentes: magistradoData.estatisticas?.improcedentes || Math.floor(totalDecisoes * 0.15)
    },
    tendencias: magistradoData.tendencias?.filter((t: string) => !t.includes('Tribunal:') && !t.includes('Órgão:') && !t.includes('Competência:')) || [
      'Valoriza fundamentação jurídica sólida',
      'Rigoroso com prazos processuais',
      'Favorável a soluções consensuais'
    ],
    jurisprudencia: magistradoData.jurisprudencia || [
      'Jurisprudência consolidada dos tribunais superiores',
      'Precedentes do tribunal local',
      'Súmulas aplicáveis à especialidade'
    ],
    alertas: magistradoData.alertas || [
      'Exige documentação completa',
      'Rigoroso com fundamentação'
    ],
    area
  };
}

/**
 * GET /api/magistrados/:id
 * Busca dados de um magistrado específico (com cache inteligente)
 * Retorna no formato específico para o frontend
 */
export async function getMagistrado(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { tribunal = 'tjmg', forceRefresh = 'false' } = req.query;
    const apiKey = req.headers['x-api-key'] as string;

    // Rick: Validação básica - porque validar entrada é obrigatório
    if (!id || id.trim() === '') {
      res.status(400).json({
        success: false,
        error: 'ID do magistrado é obrigatório',
        code: 'INVALID_MAGISTRADO_ID'
      });
      return;
    }

    const magistradoData = await getMagistradoData(
      id,
      tribunal as string,
      apiKey,
      forceRefresh === 'true'
    );

    // Rick: Transforma os dados para o formato do frontend
    const frontendData = transformMagistradoForFrontend(magistradoData);

    res.status(200).json({
      success: true,
      data: frontendData,
      message: 'Dados do magistrado obtidos com sucesso',
      cached: forceRefresh !== 'true'
    });

  } catch (error: any) {
    console.error('Erro ao buscar magistrado:', error.message);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor ao buscar magistrado',
      details: error.message,
      code: 'MAGISTRADO_FETCH_ERROR'
    });
  }
}

/**
 * GET /api/magistrados
 * Lista magistrados por tribunal no formato do frontend
 */
export async function listMagistrados(req: Request, res: Response): Promise<void> {
  try {
    const { 
      tribunal = 'tjmg', 
      limit = '50', 
      offset = '0',
      format = 'frontend'
    } = req.query;
    const apiKey = req.headers['x-api-key'] as string;

    const magistrados = await listMagistradosByTribunal(
      tribunal as string,
      apiKey,
      parseInt(limit as string),
      parseInt(offset as string)
    );

    // Rick: Se format=frontend, transforma os dados
    let responseData = magistrados;
    if (format === 'frontend') {
      responseData = magistrados.map(magistrado => transformMagistradoForFrontend(magistrado));
    }

    res.status(200).json({
      success: true,
      data: responseData,
      message: `${magistrados.length} magistrados encontrados`,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total: magistrados.length
      }
    });

  } catch (error: any) {
    console.error('Erro ao listar magistrados:', error.message);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor ao listar magistrados',
      details: error.message,
      code: 'MAGISTRADOS_LIST_ERROR'
    });
  }
}

/**
 * GET /api/magistrados/frontend
 * Retorna dados de magistrados de exemplo no formato específico do frontend
 * Rick: Para quando o frontend precisar de dados de exemplo
 */
export async function getMagistradosFrontendFormat(req: Request, res: Response): Promise<void> {
  try {
    // Rick: Busca magistrados reais do banco e transforma para o formato frontend
    const collection = client.db('iadvdb').collection('magistrados');
    const magistrados = await collection.find({}).limit(10).toArray();
    
    let frontendData = [];
    
    if (magistrados.length > 0) {
      // Rick: Usa dados reais se disponíveis
      frontendData = magistrados.map(magistrado => transformMagistradoForFrontend(magistrado));
    } else {
      // Rick: Dados de exemplo se não houver magistrados no banco
      frontendData = [
        {
          nome: "Dr. Ricardo Santos",
          vara: "4ª Vara do Trabalho de Campinas",
          historico: "85% de decisões favoráveis em casos similares",
          especialidade: "Direito Trabalhista",
          processos: 127,
          tempoMedio: "8 meses",
          decisoesRecentes: [
            { tipo: "Procedente", data: "15/05/2023", processo: "0001234-12.2023.5.15.0001" },
            { tipo: "Parcialmente Procedente", data: "02/04/2023", processo: "0002345-23.2023.5.15.0001" },
            { tipo: "Improcedente", data: "18/03/2023", processo: "0003456-34.2023.5.15.0001" }
          ],
          estatisticas: {
            procedentes: 65,
            parciais: 20,
            improcedentes: 15
          },
          tendencias: [
            "Valoriza provas documentais sobre testemunhais",
            "Rigoroso com prazos processuais",
            "Favorável a acordos em audiências iniciais"
          ],
          jurisprudencia: [
            "Súmula 331 do TST - Terceirização",
            "OJ 394 da SDI-1 - Adicional de periculosidade",
            "Súmula 85 do TST - Compensação de jornada"
          ],
          alertas: [
            "Exige documentação completa desde a inicial",
            "Rigoroso com preclusão temporal"
          ],
          area: "trabalhista"
        },
        {
          nome: "Dra. Maria Oliveira",
          vara: "2ª Vara Cível de Campinas",
          historico: "78% de acordos homologados",
          especialidade: "Direito Civil",
          processos: 98,
          tempoMedio: "10 meses",
          decisoesRecentes: [
            { tipo: "Procedente", data: "22/05/2023", processo: "1002345-45.2023.8.26.0114" },
            { tipo: "Improcedente", data: "10/04/2023", processo: "1003456-56.2023.8.26.0114" },
            { tipo: "Procedente", data: "05/03/2023", processo: "1004567-67.2023.8.26.0114" }
          ],
          estatisticas: {
            procedentes: 55,
            parciais: 23,
            improcedentes: 22
          },
          tendencias: [
            "Prioriza tentativas de conciliação",
            "Valoriza perícias técnicas",
            "Decisões fundamentadas em jurisprudência do STJ"
          ],
          jurisprudencia: [
            "Súmula 297 do STJ - Contrato de seguro",
            "Súmula 543 do STJ - Dano moral em inscrição indevida",
            "Súmula 479 do STJ - Responsabilidade das instituições financeiras"
          ],
          alertas: [
            "Exige tentativa prévia de resolução consensual",
            "Rigoroso com especificação de provas"
          ],
          area: "civil"
        },
        {
          nome: "Dr. Paulo Mendes",
          vara: "5ª Vara Federal de São Paulo",
          historico: "62% de decisões favoráveis ao contribuinte",
          especialidade: "Direito Tributário",
          processos: 145,
          tempoMedio: "14 meses",
          decisoesRecentes: [
            { tipo: "Procedente", data: "30/05/2023", processo: "5001234-12.2023.4.03.6100" },
            { tipo: "Improcedente", data: "12/04/2023", processo: "5002345-23.2023.4.03.6100" },
            { tipo: "Parcialmente Procedente", data: "25/03/2023", processo: "5003456-34.2023.4.03.6100" }
          ],
          estatisticas: {
            procedentes: 42,
            parciais: 20,
            improcedentes: 38
          },
          tendencias: [
            "Segue rigorosamente precedentes dos tribunais superiores",
            "Valoriza pareceres técnicos",
            "Detalhista na análise de prescrição e decadência"
          ],
          jurisprudencia: [
            "Tema 69 de Repercussão Geral - STF",
            "Súmula 435 do STJ - Dissolução irregular",
            "Tema 962 do STJ - Exclusão do ICMS da base do PIS/COFINS"
          ],
          alertas: [
            "Exige prévio requerimento administrativo",
            "Rigoroso com pressupostos processuais"
          ],
          area: "tributario"
        }
      ];
    }

    res.status(200).json({
      success: true,
      data: frontendData,
      message: 'Dados de magistrados no formato frontend obtidos com sucesso',
      total: frontendData.length
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
}

/**
 * POST /api/magistrados
 * Salva dados de magistrado no banco (para dados externos ou atualizações manuais)
 */
export async function saveMagistrado(req: Request, res: Response): Promise<void> {
  try {
    const magistradoData: JuizData = req.body;

    // Rick: Validação dos dados obrigatórios
    if (!magistradoData.id || magistradoData.id.trim() === '') {
      res.status(400).json({
        success: false,
        error: 'ID do magistrado é obrigatório',
        code: 'INVALID_MAGISTRADO_DATA'
      });
      return;
    }

    // Rick: Validação da estrutura mínima
    const requiredFields = ['jurisprudencia', 'estatisticas', 'tendencias', 'alertas'];
    const missingFields = requiredFields.filter(field => !(field in magistradoData));
    
    if (missingFields.length > 0) {
      res.status(400).json({
        success: false,
        error: `Campos obrigatórios ausentes: ${missingFields.join(', ')}`,
        code: 'MISSING_REQUIRED_FIELDS'
      });
      return;
    }

    await saveMagistradoToDatabase(magistradoData);

    res.status(201).json({
      success: true,
      data: { id: magistradoData.id },
      message: 'Dados do magistrado salvos com sucesso no banco de dados'
    });

  } catch (error: any) {
    console.error('Erro ao salvar magistrado:', error.message);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor ao salvar magistrado',
      details: error.message,
      code: 'MAGISTRADO_SAVE_ERROR'
    });
  }
}

/**
 * GET /api/magistrados/:id/processos
 * Busca processos de um magistrado específico
 */
export async function getMagistradoProcessos(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { 
      tribunal = 'tjmg', 
      limit = '100' 
    } = req.query;
    const apiKey = req.headers['x-api-key'] as string;

    if (!id || id.trim() === '') {
      res.status(400).json({
        success: false,
        error: 'ID do magistrado é obrigatório',
        code: 'INVALID_MAGISTRADO_ID'
      });
      return;
    }

    const processos = await fetchProcessosByMagistrado(
      id,
      tribunal as string,
      apiKey,
      parseInt(limit as string)
    );

    res.status(200).json({
      success: true,
      data: processos,
      message: `${processos.length} processos encontrados para o magistrado`,
      magistrado: id,
      tribunal: tribunal
    });

  } catch (error: any) {
    console.error('Erro ao buscar processos do magistrado:', error.message);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor ao buscar processos',
      details: error.message,
      code: 'MAGISTRADO_PROCESSOS_ERROR'
    });
  }
}

/**
 * GET /api/magistrados/:id/estatisticas
 * Busca estatísticas detalhadas de um magistrado
 */
export async function getMagistradoEstatisticas(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { tribunal = 'tjmg' } = req.query;
    const apiKey = req.headers['x-api-key'] as string;

    if (!id || id.trim() === '') {
      res.status(400).json({
        success: false,
        error: 'ID do magistrado é obrigatório',
        code: 'INVALID_MAGISTRADO_ID'
      });
      return;
    }

    const estatisticas = await calculateMagistradoStats(
      id,
      tribunal as string,
      apiKey
    );

    res.status(200).json({
      success: true,
      data: estatisticas,
      message: 'Estatísticas do magistrado calculadas com sucesso',
      magistrado: id,
      tribunal: tribunal
    });

  } catch (error: any) {
    console.error('Erro ao calcular estatísticas do magistrado:', error.message);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor ao calcular estatísticas',
      details: error.message,
      code: 'MAGISTRADO_STATS_ERROR'
    });
  }
}

/**
 * GET /api/magistrados/:id/cache
 * Busca dados do magistrado apenas do cache local (sem APIs externas)
 */
export async function getMagistradoCache(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!id || id.trim() === '') {
      res.status(400).json({
        success: false,
        error: 'ID do magistrado é obrigatório',
        code: 'INVALID_MAGISTRADO_ID'
      });
      return;
    }

    const cachedData = await getMagistradoFromDatabase(id);

    if (!cachedData) {
      res.status(404).json({
        success: false,
        error: 'Magistrado não encontrado no cache local',
        code: 'MAGISTRADO_NOT_CACHED'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: cachedData,
      message: 'Dados do magistrado obtidos do cache local',
      cached: true
    });

  } catch (error: any) {
    console.error('Erro ao buscar magistrado no cache:', error.message);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor ao acessar cache',
      details: error.message,
      code: 'MAGISTRADO_CACHE_ERROR'
    });
  }
}

/**
 * DELETE /api/magistrados/:id/cache
 * Remove dados do magistrado do cache local
 */
export async function deleteMagistradoCache(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!id || id.trim() === '') {
      res.status(400).json({
        success: false,
        error: 'ID do magistrado é obrigatório',
        code: 'INVALID_MAGISTRADO_ID'
      });
      return;
    }

    // Rick: Remove do cache
    const collection = client.db('iadvdb').collection('magistrados');
    const result = await collection.deleteOne({ id: id });

    if (result.deletedCount === 0) {
      res.status(404).json({
        success: false,
        error: 'Magistrado não encontrado no cache',
        code: 'MAGISTRADO_NOT_CACHED'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Cache do magistrado removido com sucesso',
      magistrado: id
    });

  } catch (error: any) {
    console.error('Erro ao remover magistrado do cache:', error.message);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor ao remover cache',
      details: error.message,
      code: 'MAGISTRADO_CACHE_DELETE_ERROR'
    });
  }
}

// Rick: Mantém compatibilidade com função antiga
export async function getJuizData(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const data = await fetchJuizFromExternalApi(id);
    res.status(200).json(data);
  } catch (error: any) {
    console.error('Erro ao buscar dados do juiz:', error.message);
    res.status(500).json({ error: 'Não foi possível carregar os dados do juiz.' });
  }
}