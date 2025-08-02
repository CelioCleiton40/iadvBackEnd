import {
  getMagistradoData,
  fetchMagistradoFromDataJud,
  fetchProcessosByMagistrado,
  calculateMagistradoStats,
  listMagistradosByTribunal,
  saveMagistradoToDatabase,
  getMagistradoFromDatabase
} from '../../src/services/dashboard/judgeService';
import { client } from '../../src/config/dataBase';
import fetch from 'node-fetch';

// Rick: Mock do fetch para testes controlados
jest.mock('node-fetch');
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Rick: Mock do MongoDB
jest.mock('../../src/config/dataBase', () => ({
  client: {
    db: jest.fn(() => ({
      collection: jest.fn(() => ({
        findOne: jest.fn(),
        updateOne: jest.fn()
      }))
    }))
  }
}));

describe('🏛️ Judge Service - Integração com DataJud e PJe', () => {
  const mockMagistradoId = 'magistrado-test-123';
  const mockTribunal = 'tjmg';
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn(); // Rick: Silencia logs nos testes
    console.error = jest.fn();
    console.warn = jest.fn();
  });

  describe('🔍 fetchMagistradoFromDataJud', () => {
    it('deve buscar magistrado no DataJud com sucesso', async () => {
      // Rick: Mock da resposta do DataJud
      const mockDataJudResponse = {
        hits: {
          hits: [{
            _source: {
              id: mockMagistradoId,
              nome: 'João Batista Martins Prata Braga',
              tribunal: 'TRF1',
              orgaoJulgador: '8ª Vara Federal',
              competencia: 'Federal',
              situacao: 'ativo',
              dataPosse: '2020-01-15'
            }
          }]
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDataJudResponse)
      } as any);

      const result = await fetchMagistradoFromDataJud(mockMagistradoId, mockApiKey);

      expect(result).toEqual({
        id: mockMagistradoId,
        jurisprudencia: [],
        estatisticas: {
          procedentes: 0,
          parciais: 0,
          improcedentes: 0
        },
        tempoMedio: 'N/A',
        processos: 0,
        decisoesRecentes: [],
        tendencias: ['Tribunal: TRF1', 'Órgão: 8ª Vara Federal'],
        alertas: []
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api-publica.datajud.cnj.jus.br/api_publica_magistrados/_search',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': `APIKey ${mockApiKey}`,
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('deve fazer fallback para API externa quando DataJud falha', async () => {
      // Rick: Mock falha do DataJud
      mockFetch
        .mockResolvedValueOnce({ ok: false, status: 404 } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            idJuiz: mockMagistradoId,
            jurisprudencia: ['Precedente 1'],
            estatisticas: { procedentes: 10, parciais: 5, improcedentes: 2 },
            tempo_medio_julgamento: '120 dias',
            processos_ativos: 25,
            decisoes_recentes: [],
            tendencias: ['Tendência 1'],
            alertas: ['Alerta 1']
          })
        } as any);

      const result = await fetchMagistradoFromDataJud(mockMagistradoId, mockApiKey);

      expect(result.jurisprudencia).toEqual(['Precedente 1']);
      expect(result.processos).toBe(25);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('📊 calculateMagistradoStats', () => {
    it('deve calcular estatísticas baseado nos processos', async () => {
      // Rick: Mock da resposta de processos
      const mockProcessosResponse = {
        hits: {
          hits: [
            { _source: { numeroProcesso: '001', situacao: 'Em andamento' } },
            { _source: { numeroProcesso: '002', situacao: 'Julgado' } },
            { _source: { numeroProcesso: '003', situacao: 'Julgado' } },
            { _source: { numeroProcesso: '004', situacao: 'Em andamento' } }
          ]
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProcessosResponse)
      } as any);

      const stats = await calculateMagistradoStats(mockMagistradoId, mockTribunal, mockApiKey);

      expect(stats.totalProcessos).toBe(4);
      expect(stats.processosPendentes).toBe(2);
      expect(stats.processosJulgados).toBe(2);
      expect(stats.tempoMedioJulgamento).toBe(180);
      expect(stats.produtividade.sentencas).toBe(1); // 60% de 2
    });

    it('deve retornar estatísticas zeradas em caso de erro', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API Error'));

      const stats = await calculateMagistradoStats(mockMagistradoId, mockTribunal, mockApiKey);

      expect(stats.totalProcessos).toBe(0);
      expect(stats.processosPendentes).toBe(0);
      expect(stats.processosJulgados).toBe(0);
    });
  });

  describe('💾 Cache Management', () => {
    const mockCollection = {
      findOne: jest.fn(),
      updateOne: jest.fn()
    };

    beforeEach(() => {
      (client.db as jest.Mock).mockReturnValue({
        collection: jest.fn().mockReturnValue(mockCollection)
      });
    });

    it('deve salvar magistrado no cache com TTL', async () => {
      const mockJuizData = {
        id: mockMagistradoId,
        jurisprudencia: [],
        estatisticas: { procedentes: 0, parciais: 0, improcedentes: 0 },
        tempoMedio: 'N/A',
        processos: 0,
        decisoesRecentes: [],
        tendencias: [],
        alertas: []
      };

      mockCollection.updateOne.mockResolvedValueOnce({ acknowledged: true });

      await saveMagistradoToDatabase(mockJuizData);

      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { id: mockMagistradoId },
        {
          $set: expect.objectContaining({
            ...mockJuizData,
            lastUpdated: expect.any(Date),
            cacheExpiry: expect.any(Date)
          })
        },
        { upsert: true }
      );
    });

    it('deve retornar dados do cache se válido', async () => {
      const mockCachedData = {
        id: mockMagistradoId,
        jurisprudencia: ['Cached'],
        cacheExpiry: new Date(Date.now() + 3600000), // Rick: 1 hora no futuro
        lastUpdated: new Date()
      };

      mockCollection.findOne.mockResolvedValueOnce(mockCachedData);

      const result = await getMagistradoFromDatabase(mockMagistradoId);

      expect(result).toEqual(expect.objectContaining({
        id: mockMagistradoId,
        jurisprudencia: ['Cached']
      }));
      expect(result).not.toHaveProperty('cacheExpiry');
      expect(result).not.toHaveProperty('lastUpdated');
    });

    it('deve retornar null se cache expirado', async () => {
      const mockExpiredData = {
        id: mockMagistradoId,
        cacheExpiry: new Date(Date.now() - 1000), // Rick: 1 segundo no passado
        lastUpdated: new Date()
      };

      mockCollection.findOne.mockResolvedValueOnce(mockExpiredData);

      const result = await getMagistradoFromDatabase(mockMagistradoId);

      expect(result).toBeNull();
    });
  });

  describe('🎯 getMagistradoData - Função Principal', () => {
    const mockCollection = {
      findOne: jest.fn(),
      updateOne: jest.fn()
    };

    beforeEach(() => {
      (client.db as jest.Mock).mockReturnValue({
        collection: jest.fn().mockReturnValue(mockCollection)
      });
    });

    it('deve usar cache válido quando disponível', async () => {
      const mockCachedData = {
        id: mockMagistradoId,
        jurisprudencia: ['Cached'],
        cacheExpiry: new Date(Date.now() + 3600000),
        lastUpdated: new Date()
      };

      mockCollection.findOne.mockResolvedValueOnce(mockCachedData);

      const result = await getMagistradoData(mockMagistradoId, mockTribunal, mockApiKey, false);

      expect(result.jurisprudencia).toEqual(['Cached']);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('deve buscar dados frescos quando forceRefresh = true', async () => {
      // Rick: Mock cache válido
      mockCollection.findOne.mockResolvedValueOnce({
        id: mockMagistradoId,
        cacheExpiry: new Date(Date.now() + 3600000)
      });

      // Rick: Mock DataJud response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          hits: {
            hits: [{
              _source: {
                id: mockMagistradoId,
                nome: 'João Batista',
                tribunal: 'TRF1',
                orgaoJulgador: '8ª Vara',
                competencia: 'Federal',
                situacao: 'ativo'
              }
            }]
          }
        })
      } as any);

      // Rick: Mock stats
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ hits: { hits: [] } })
      } as any);

      mockCollection.updateOne.mockResolvedValueOnce({ acknowledged: true });

      const result = await getMagistradoData(mockMagistradoId, mockTribunal, mockApiKey, true);

      expect(result.tendencias).toContain('Tribunal: TRF1');
      expect(mockFetch).toHaveBeenCalled();
    });

    it('deve usar fallback em caso de erro total', async () => {
      const fallbackData = {
        id: mockMagistradoId,
        jurisprudencia: ['Fallback'],
        estatisticas: { procedentes: 0, parciais: 0, improcedentes: 0 },
        tempoMedio: 'N/A',
        processos: 0,
        decisoesRecentes: [],
        tendencias: [],
        alertas: [],
        cacheExpiry: new Date(Date.now() - 1000),
        lastUpdated: new Date(),
        _id: 'some-mongo-id'
      };

      // Rick: Mock cache expirado na primeira busca, fallback na segunda
      mockCollection.findOne
        .mockResolvedValueOnce(null) // Primeira busca (cache válido)
        .mockResolvedValueOnce(fallbackData); // Segunda busca (fallback no catch)

      // Rick: Mock erro nas APIs
      mockFetch.mockRejectedValue(new Error('Network Error'));

      const result = await getMagistradoData(mockMagistradoId, mockTribunal, mockApiKey, false);

      expect(result.jurisprudencia).toEqual(['Fallback']);
      expect(result).not.toHaveProperty('_id');
      expect(result).not.toHaveProperty('cacheExpiry');
      expect(result).not.toHaveProperty('lastUpdated');
    });
  });

  describe('📋 listMagistradosByTribunal', () => {
    it('deve listar magistrados por tribunal', async () => {
      const mockResponse = {
        hits: {
          hits: [
            {
              _source: {
                id: '1',
                nome: 'Magistrado 1',
                tribunal: 'TJMG',
                situacao: 'ativo'
              }
            },
            {
              _source: {
                id: '2',
                nome: 'Magistrado 2',
                tribunal: 'TJMG',
                situacao: 'ativo'
              }
            }
          ]
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as any);

      const result = await listMagistradosByTribunal(mockTribunal, mockApiKey, 10, 0);

      expect(result).toHaveLength(2);
      expect(result[0].nome).toBe('Magistrado 1');
      expect(result[1].nome).toBe('Magistrado 2');
    });

    it('deve retornar array vazio em caso de erro', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API Error'));

      const result = await listMagistradosByTribunal(mockTribunal, mockApiKey);

      expect(result).toEqual([]);
    });
  });

  describe('🧪 Teste Real - João Batista Martins Prata Braga', () => {
    it('deve processar dados do juiz real corretamente', async () => {
      const realJudgeData = {
        id: 'joao-batista-prata-braga',
        nome: 'João Batista Martins Prata Braga',
        tribunal: 'TRF1',
        orgaoJulgador: '8ª Vara Federal',
        competencia: 'Federal',
        situacao: 'ativo' as const,
        dataPosse: '2020-01-15'
      };

      // Rick: Mock resposta realista
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          hits: {
            hits: [{ _source: realJudgeData }]
          }
        })
      } as any);

      const result = await fetchMagistradoFromDataJud('joao-batista-prata-braga');

      expect(result.id).toBe('joao-batista-prata-braga');
      expect(result.tendencias).toContain('Tribunal: TRF1');
      expect(result.tendencias).toContain('Órgão: 8ª Vara Federal');
      expect(result.alertas).toEqual([]); // Rick: Ativo, sem alertas
    });

    it('deve buscar estatísticas completas do juiz real', async () => {
      const mockProcessos = {
        hits: {
          hits: Array.from({ length: 50 }, (_, i) => ({
            _source: {
              numeroProcesso: `5000000-${i.toString().padStart(2, '0')}.2024.4.01.3800`,
              classe: 'Ação Ordinária',
              assunto: 'Direito Previdenciário',
              dataAutuacao: '2024-01-15',
              orgaoJulgador: '8ª Vara Federal',
              magistrado: 'joao-batista-prata-braga',
              situacao: i % 3 === 0 ? 'Julgado' : 'Em andamento'
            }
          }))
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProcessos)
      } as any);

      const stats = await calculateMagistradoStats(
        'joao-batista-prata-braga',
        'trf1'
      );

      expect(stats.totalProcessos).toBe(50);
      expect(stats.processosJulgados).toBeGreaterThan(0);
      expect(stats.processosPendentes).toBeGreaterThan(0);
      expect(stats.produtividade.sentencas).toBeGreaterThan(0);
    });
  });

  describe('🔒 Tratamento de Erros e Edge Cases', () => {
    it('deve lidar com resposta malformada do DataJud', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ invalid: 'response' })
      } as any);

      // Rick: Deve fazer fallback para API externa
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      } as any);

      await expect(fetchMagistradoFromDataJud(mockMagistradoId))
        .rejects.toThrow('API externa indisponível');
    });

    it('deve validar parâmetros de entrada', async () => {
      await expect(getMagistradoData(''))
        .rejects.toThrow();
    });

    it('deve lidar com timeout de rede', async () => {
      mockFetch.mockImplementationOnce(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      await expect(fetchMagistradoFromDataJud(mockMagistradoId))
        .rejects.toThrow('Timeout');
    });
  });
});

// Rick: Teste de integração real (comentado para não fazer requests reais)
/*
describe('🌐 Teste de Integração Real', () => {
  it('deve conectar com DataJud real (apenas para desenvolvimento)', async () => {
    // Rick: Descomente apenas para testes manuais com API key real
    // const realApiKey = process.env.DATAJUD_API_KEY;
    // if (!realApiKey) {
    //   console.log('DATAJUD_API_KEY não configurada, pulando teste real');
    //   return;
    // }
    
    // const result = await listMagistradosByTribunal('tjmg', realApiKey, 5);
    // console.log('Magistrados encontrados:', result.length);
    // expect(result).toBeInstanceOf(Array);
  });
});
*/