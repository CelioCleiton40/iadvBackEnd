// Setup global para testes
// Configurações que todo teste precisa - porque organização é fundamental

import dotenv from 'dotenv';

// Carrega variáveis de ambiente para testes
dotenv.config({ path: '.env.test' });

// Configurações globais de teste
global.console = {
  ...console,
  // Silencia logs durante os testes (menos poluição visual)
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Mock do MongoDB para evitar conexões reais durante testes
jest.mock('../src/config/dataBase', () => ({
  connectToDatabase: jest.fn().mockResolvedValue({
    collection: jest.fn().mockReturnValue({
      findOne: jest.fn(),
      find: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([]),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis()
      }),
      insertOne: jest.fn(),
      updateOne: jest.fn(),
      deleteOne: jest.fn(),
      countDocuments: jest.fn().mockResolvedValue(0)
    })
  }),
  disconnectFromDatabase: jest.fn().mockResolvedValue(undefined),
  client: {
    db: jest.fn().mockReturnValue({
      collection: jest.fn().mockReturnValue({
        findOne: jest.fn(),
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([]),
          sort: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis()
        }),
        insertOne: jest.fn(),
        updateOne: jest.fn(),
        deleteOne: jest.fn(),
        countDocuments: jest.fn().mockResolvedValue(0)
      })
    })
  }
}));

// Mock do Winston Logger
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}));

// Variáveis de ambiente para testes
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only';
process.env.DATABASE_URL = 'mongodb://localhost:27017/iadvdb_test';
process.env.PORT = '3001';

// Timeout global para operações assíncronas
jest.setTimeout(10000);

// Cleanup após cada teste
afterEach(() => {
  jest.clearAllMocks();
});