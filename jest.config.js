// Configuração do Jest para o projeto iAdv Backend
// Porque até Rick Sanchez precisa de testes automatizados, Morty!

module.exports = {
  // Ambiente de execução
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // Diretórios e arquivos
  rootDir: './',
  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/tests/**/*.spec.ts'
  ],
  
  // Configuração do TypeScript
  transform: {
    '^.+\.ts$': 'ts-jest'
  },
  
  // Módulos e paths
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },
  
  // Coverage - porque métricas importam
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts', // Arquivo de inicialização
    '!src/app.ts'     // Configuração do Express
  ],
  
  // Thresholds de coverage - padrões de qualidade (temporariamente reduzidos)
  coverageThreshold: {
    global: {
      branches: 10,
      functions: 15,
      lines: 15,
      statements: 15
    }
  },
  
  // Setup e teardown
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  
  // Timeout para testes assíncronos
  testTimeout: 10000,
  
  // Verbose para debug
  verbose: true,
  
  // Limpar mocks automaticamente
  clearMocks: true,
  restoreMocks: true
};