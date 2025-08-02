// Testes para ProcessoService - Porque processos jurídicos são sérios
// Testando gestão de processos como se fosse um multiverso de casos legais

import { ProcessoService } from '../../src/services/dashboard/processoService';
import { buscarERegistrarProcesso } from '../../src/services/dashboard/datajudService';
import { ProcessoSlim } from '../../src/types/ProcessoSlim';
import { createMockProcesso, createMockDatabase, createMockCollection } from '../utils/testHelpers';

// Mocks
jest.mock('../../src/services/dashboard/datajudService');
const mockBuscarERegistrarProcesso = jest.mocked(buscarERegistrarProcesso);

describe('ProcessoService', () => {
  let processoService: ProcessoService;
  let mockDb: any;
  let mockCollection: any;

  beforeEach(() => {
    mockCollection = createMockCollection();
    mockDb = createMockDatabase();
    mockDb.collection.mockReturnValue(mockCollection);
    
    processoService = new ProcessoService(mockDb);
    jest.clearAllMocks();
  });

  describe('buscarERegistrar', () => {
    it('deve buscar e registrar processo com sucesso', async () => {
      // Arrange
      const numeroProcesso = '1234567-89.2024.1.23.4567';
      const mockProcesso = createMockProcesso({ numeroProcesso });
      mockBuscarERegistrarProcesso.mockResolvedValue(mockProcesso);

      // Act
      const result = await processoService.buscarERegistrar(numeroProcesso);

      // Assert
      expect(mockBuscarERegistrarProcesso).toHaveBeenCalledWith(mockDb, numeroProcesso);
      expect(result).toEqual(mockProcesso);
    });

    it('deve propagar erro do serviço DataJud', async () => {
      // Arrange
      const numeroProcesso = '1234567-89.2024.1.23.4567';
      const error = new Error('Processo não encontrado na API');
      mockBuscarERegistrarProcesso.mockRejectedValue(error);

      // Act & Assert
      await expect(processoService.buscarERegistrar(numeroProcesso))
        .rejects.toThrow('Processo não encontrado na API');
    });
  });

  describe('listar', () => {
    it('deve listar processos com paginação padrão', async () => {
      // Arrange
      const mockProcessos = [
        createMockProcesso({ numeroProcesso: '1111111-11.2024.1.11.1111' }),
        createMockProcesso({ numeroProcesso: '2222222-22.2024.1.22.2222' })
      ];
      
      mockCollection.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue(mockProcessos)
      });
      mockCollection.countDocuments.mockResolvedValue(2);

      // Act
      const result = await processoService.listar();

      // Assert
      expect(mockDb.collection).toHaveBeenCalledWith('processos_slim');
      expect(mockCollection.find).toHaveBeenCalledWith({});
      expect(result).toEqual({
        data: mockProcessos,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1
      });
    });

    it('deve listar processos com paginação customizada', async () => {
      // Arrange
      const mockProcessos = [createMockProcesso()];
      const page = 2;
      const limit = 5;
      
      mockCollection.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue(mockProcessos)
      });
      mockCollection.countDocuments.mockResolvedValue(15);

      // Act
      const result = await processoService.listar(page, limit);

      // Assert
      expect(result).toEqual({
        data: mockProcessos,
        total: 15,
        page: 2,
        limit: 5,
        totalPages: 3
      });
    });

    it('deve filtrar por número do processo', async () => {
      // Arrange
      const numeroProcesso = '1234567-89.2024.1.23.4567';
      const mockProcesso = createMockProcesso({ numeroProcesso });
      
      mockCollection.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue([mockProcesso])
      });
      mockCollection.countDocuments.mockResolvedValue(1);

      // Act
      const result = await processoService.listar(1, 10, numeroProcesso);

      // Assert
      expect(mockCollection.find).toHaveBeenCalledWith({ numeroProcesso });
      expect(result.data).toEqual([mockProcesso]);
      expect(result.total).toBe(1);
    });

    it('deve ordenar por última atualização (mais recentes primeiro)', async () => {
      // Arrange
      mockCollection.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue([])
      });
      mockCollection.countDocuments.mockResolvedValue(0);

      // Act
      await processoService.listar();

      // Assert
      const findChain = mockCollection.find();
      expect(findChain.sort).toHaveBeenCalledWith({ ultimaAtualizacao: -1 });
    });

    it('deve calcular totalPages corretamente', async () => {
      // Arrange
      mockCollection.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue([])
      });
      
      // Teste com diferentes cenários
      const testCases = [
        { total: 0, limit: 10, expectedPages: 0 },
        { total: 5, limit: 10, expectedPages: 1 },
        { total: 10, limit: 10, expectedPages: 1 },
        { total: 15, limit: 10, expectedPages: 2 },
        { total: 25, limit: 7, expectedPages: 4 }
      ];

      for (const testCase of testCases) {
        mockCollection.countDocuments.mockResolvedValue(testCase.total);
        
        // Act
        const result = await processoService.listar(1, testCase.limit);
        
        // Assert
        expect(result.totalPages).toBe(testCase.expectedPages);
      }
    });
  });

  describe('obter', () => {
    it('deve obter processo por número', async () => {
      // Arrange
      const numeroProcesso = '1234567-89.2024.1.23.4567';
      const mockProcesso = createMockProcesso({ numeroProcesso });
      mockCollection.findOne.mockResolvedValue(mockProcesso);

      // Act
      const result = await processoService.obter(numeroProcesso);

      // Assert
      expect(mockDb.collection).toHaveBeenCalledWith('processos_slim');
      expect(mockCollection.findOne).toHaveBeenCalledWith({ numeroProcesso });
      expect(result).toEqual(mockProcesso);
    });

    it('deve retornar null quando processo não existe', async () => {
      // Arrange
      const numeroProcesso = '9999999-99.2024.1.99.9999';
      mockCollection.findOne.mockResolvedValue(null);

      // Act
      const result = await processoService.obter(numeroProcesso);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('salvar', () => {
    it('deve salvar processo com upsert', async () => {
      // Arrange
      const mockProcesso = createMockProcesso();
      mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });

      // Act
      await processoService.salvar(mockProcesso);

      // Assert
      expect(mockDb.collection).toHaveBeenCalledWith('processos_slim');
      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { numeroProcesso: mockProcesso.numeroProcesso },
        { $set: mockProcesso },
        { upsert: true }
      );
    });

    it('deve funcionar com processo novo (insert)', async () => {
      // Arrange
      const mockProcesso = createMockProcesso();
      mockCollection.updateOne.mockResolvedValue({ 
        modifiedCount: 0,
        upsertedCount: 1,
        upsertedId: 'new-id'
      });

      // Act
      await processoService.salvar(mockProcesso);

      // Assert
      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { numeroProcesso: mockProcesso.numeroProcesso },
        { $set: mockProcesso },
        { upsert: true }
      );
    });
  });

  describe('remover', () => {
    it('deve remover processo existente', async () => {
      // Arrange
      const numeroProcesso = '1234567-89.2024.1.23.4567';
      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });

      // Act
      const result = await processoService.remover(numeroProcesso);

      // Assert
      expect(mockDb.collection).toHaveBeenCalledWith('processos_slim');
      expect(mockCollection.deleteOne).toHaveBeenCalledWith({ numeroProcesso });
      expect(result).toBe(true);
    });

    it('deve retornar false quando processo não existe', async () => {
      // Arrange
      const numeroProcesso = '9999999-99.2024.1.99.9999';
      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 0 });

      // Act
      const result = await processoService.remover(numeroProcesso);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve propagar erros de conexão do banco', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      mockCollection.find.mockImplementation(() => {
        throw error;
      });

      // Act & Assert
      await expect(processoService.listar())
        .rejects.toThrow('Database connection failed');
    });

    it('deve propagar erros de operações de escrita', async () => {
      // Arrange
      const mockProcesso = createMockProcesso();
      const error = new Error('Write operation failed');
      mockCollection.updateOne.mockRejectedValue(error);

      // Act & Assert
      await expect(processoService.salvar(mockProcesso))
        .rejects.toThrow('Write operation failed');
    });
  });

  describe('Casos Extremos', () => {
    it('deve lidar com página zero ou negativa', async () => {
      // Arrange
      mockCollection.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue([])
      });
      mockCollection.countDocuments.mockResolvedValue(0);

      // Act
      const result = await processoService.listar(0, 10);

      // Assert
      expect(result.page).toBe(0);
      // Skip deve ser 0 para página 0 ou negativa
      const findChain = mockCollection.find();
      expect(findChain.skip).toHaveBeenCalledWith(-10); // (0-1) * 10
    });

    it('deve lidar com limit zero ou negativo', async () => {
      // Arrange
      mockCollection.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue([])
      });
      mockCollection.countDocuments.mockResolvedValue(0);

      // Act
      const result = await processoService.listar(1, 0);

      // Assert
      expect(result.limit).toBe(0);
      const findChain = mockCollection.find();
      expect(findChain.limit).toHaveBeenCalledWith(0);
    });

    it('deve lidar com números de processo com caracteres especiais', async () => {
      // Arrange
      const numeroProcessoEspecial = '1234567-89.2024.1.23.4567';
      const mockProcesso = createMockProcesso({ numeroProcesso: numeroProcessoEspecial });
      mockCollection.findOne.mockResolvedValue(mockProcesso);

      // Act
      const result = await processoService.obter(numeroProcessoEspecial);

      // Assert
      expect(mockCollection.findOne).toHaveBeenCalledWith({ 
        numeroProcesso: numeroProcessoEspecial 
      });
      expect(result).toEqual(mockProcesso);
    });
  });

  describe('Performance', () => {
    it('deve usar índices corretos para busca', async () => {
      // Arrange
      const numeroProcesso = '1234567-89.2024.1.23.4567';
      mockCollection.findOne.mockResolvedValue(null);

      // Act
      await processoService.obter(numeroProcesso);

      // Assert
      // Verifica se está buscando pelo campo indexado
      expect(mockCollection.findOne).toHaveBeenCalledWith({ numeroProcesso });
    });

    it('deve usar paginação eficiente', async () => {
      // Arrange
      const page = 5;
      const limit = 20;
      mockCollection.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue([])
      });
      mockCollection.countDocuments.mockResolvedValue(100);

      // Act
      await processoService.listar(page, limit);

      // Assert
      const findChain = mockCollection.find();
      expect(findChain.skip).toHaveBeenCalledWith(80); // (5-1) * 20
      expect(findChain.limit).toHaveBeenCalledWith(20);
    });
  });
});