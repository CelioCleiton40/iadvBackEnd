// Testes de Integração para Autenticação
// Testando o fluxo completo como se fosse um portal entre dimensões

import request from 'supertest';
import app from '../../src/app';
import { connectToDatabase, disconnectFromDatabase } from '../../src/config/dataBase';
import { hashPassword } from '../../src/security/encryption';
import { generateRandomEmail, generateRandomString } from '../utils/testHelpers';

// Mock das dependências externas
jest.mock('../../src/config/dataBase');
jest.mock('../../src/jobs/notificationScheduler', () => ({
  NotificationScheduler: jest.fn().mockImplementation(() => ({
    start: jest.fn()
  }))
}));

const mockConnectToDatabase = jest.mocked(connectToDatabase);
const mockDisconnectFromDatabase = jest.mocked(disconnectFromDatabase);

// Mock do banco de dados
const mockUsers: any[] = [];
const mockCollection = {
  findOne: jest.fn(),
  insertOne: jest.fn(),
  find: jest.fn().mockReturnValue({
    toArray: jest.fn().mockResolvedValue(mockUsers),
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis()
  }),
  updateOne: jest.fn(),
  deleteOne: jest.fn(),
  countDocuments: jest.fn().mockResolvedValue(0)
};

const mockDb = {
  collection: jest.fn().mockReturnValue(mockCollection)
};

mockConnectToDatabase.mockResolvedValue(mockDb as any);
mockDisconnectFromDatabase.mockResolvedValue(undefined);

describe('Auth Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsers.length = 0; // Limpa array de usuários
  });

  describe('POST /api/auth/login', () => {
    describe('Login com Sucesso', () => {
      it('deve fazer login com credenciais válidas', async () => {
        // Arrange
        const email = 'advogado@test.com';
        const password = 'MinhaSenh@123';
        const hashedPassword = await hashPassword(password);
        
        const mockUser = {
          _id: '507f1f77bcf86cd799439011',
          email,
          password: hashedPassword,
          role: 'advogado',
          createdAt: new Date()
        };
        
        mockCollection.findOne.mockResolvedValue(mockUser);

        // Act
        const response = await request(app)
          .post('/api/auth/login')
          .send({ email, password })
          .expect(200);

        // Assert
        expect(response.body).toHaveProperty('message', 'Login realizado com sucesso!');
        expect(response.body).toHaveProperty('token');
        expect(response.body).toHaveProperty('user');
        expect(response.body.user).toEqual({
          id: '507f1f77bcf86cd799439011',
          email,
          role: 'advogado'
        });
        expect(typeof response.body.token).toBe('string');
      });

      it('deve fazer login com diferentes tipos de usuário', async () => {
        // Arrange
        const testCases = [
          { role: 'advogado', email: 'advogado@test.com' },
          { role: 'procuradoria', email: 'procurador@test.com' },
          { role: 'magistrado', email: 'juiz@test.com' }
        ];

        for (const testCase of testCases) {
          const password = 'Senha123!';
          const hashedPassword = await hashPassword(password);
          
          const mockUser = {
            _id: '507f1f77bcf86cd799439011',
            email: testCase.email,
            password: hashedPassword,
            role: testCase.role,
            createdAt: new Date()
          };
          
          mockCollection.findOne.mockResolvedValue(mockUser);

          // Act
          const response = await request(app)
            .post('/api/auth/login')
            .send({ email: testCase.email, password })
            .expect(200);

          // Assert
          expect(response.body.user.role).toBe(testCase.role);
          expect(response.body.user.email).toBe(testCase.email);
        }
      });
    });

    describe('Validação de Entrada', () => {
      it('deve rejeitar email inválido', async () => {
        // Act
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'email-invalido',
            password: 'MinhaSenh@123'
          })
          .expect(400);

        // Assert
        expect(response.body).toHaveProperty('error', 'Dados inválidos');
        expect(response.body.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'email',
              message: expect.stringContaining('Email inválido')
            })
          ])
        );
      });

      it('deve rejeitar senha muito curta', async () => {
        // Act
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'user@test.com',
            password: '123'
          })
          .expect(400);

        // Assert
        expect(response.body).toHaveProperty('error', 'Dados inválidos');
        expect(response.body.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'password',
              message: expect.stringContaining('Senha inválida')
            })
          ])
        );
      });

      it('deve rejeitar dados ausentes', async () => {
        // Act
        const response = await request(app)
          .post('/api/auth/login')
          .send({})
          .expect(400);

        // Assert
        expect(response.body).toHaveProperty('error', 'Dados inválidos');
        expect(response.body.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ field: 'email' }),
            expect.objectContaining({ field: 'password' })
          ])
        );
      });

      it('deve rejeitar campos extras', async () => {
        // Act
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'user@test.com',
            password: 'MinhaSenh@123',
            extraField: 'not allowed'
          })
          .expect(400);

        // Assert
        expect(response.body).toHaveProperty('error', 'Dados inválidos');
      });
    });

    describe('Falhas de Autenticação', () => {
      it('deve rejeitar usuário inexistente', async () => {
        // Arrange
        mockCollection.findOne.mockResolvedValue(null);

        // Act
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'inexistente@test.com',
            password: 'MinhaSenh@123'
          })
          .expect(400);

        // Assert
        expect(response.body).toHaveProperty('error', 'Credenciais inválidas.');
      });

      it('deve rejeitar senha incorreta', async () => {
        // Arrange
        const email = 'user@test.com';
        const correctPassword = 'SenhaCorreta123!';
        const wrongPassword = 'SenhaErrada123!';
        const hashedPassword = await hashPassword(correctPassword);
        
        const mockUser = {
          _id: '507f1f77bcf86cd799439011',
          email,
          password: hashedPassword,
          role: 'advogado',
          createdAt: new Date()
        };
        
        mockCollection.findOne.mockResolvedValue(mockUser);

        // Act
        const response = await request(app)
          .post('/api/auth/login')
          .send({ email, password: wrongPassword })
          .expect(400);

        // Assert
        expect(response.body).toHaveProperty('error', 'Credenciais inválidas.');
      });
    });

    describe('Headers e Content-Type', () => {
      it('deve aceitar Content-Type application/json', async () => {
        // Arrange
        const email = 'user@test.com';
        const password = 'MinhaSenh@123';
        const hashedPassword = await hashPassword(password);
        
        const mockUser = {
          _id: '507f1f77bcf86cd799439011',
          email,
          password: hashedPassword,
          role: 'advogado',
          createdAt: new Date()
        };
        
        mockCollection.findOne.mockResolvedValue(mockUser);

        // Act
        const response = await request(app)
          .post('/api/auth/login')
          .set('Content-Type', 'application/json')
          .send({ email, password })
          .expect(200);

        // Assert
        expect(response.headers['content-type']).toMatch(/application\/json/);
      });

      it('deve retornar JSON válido', async () => {
        // Arrange
        mockCollection.findOne.mockResolvedValue(null);

        // Act
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'user@test.com',
            password: 'MinhaSenh@123'
          })
          .expect(400);

        // Assert
        expect(() => JSON.parse(JSON.stringify(response.body))).not.toThrow();
        expect(response.headers['content-type']).toMatch(/application\/json/);
      });
    });

    describe('Segurança', () => {
      it('não deve retornar senha no response', async () => {
        // Arrange
        const email = 'user@test.com';
        const password = 'MinhaSenh@123';
        const hashedPassword = await hashPassword(password);
        
        const mockUser = {
          _id: '507f1f77bcf86cd799439011',
          email,
          password: hashedPassword,
          role: 'advogado',
          createdAt: new Date()
        };
        
        mockCollection.findOne.mockResolvedValue(mockUser);

        // Act
        const response = await request(app)
          .post('/api/auth/login')
          .send({ email, password })
          .expect(200);

        // Assert
        expect(response.body.user).not.toHaveProperty('password');
        expect(JSON.stringify(response.body)).not.toContain(hashedPassword);
      });

      it('deve usar mensagens genéricas para falhas de autenticação', async () => {
        // Arrange
        const testCases = [
          { scenario: 'usuário inexistente', mockUser: null },
          { 
            scenario: 'senha incorreta', 
            mockUser: {
              _id: '507f1f77bcf86cd799439011',
              email: 'user@test.com',
              password: await hashPassword('outraSenha'),
              role: 'advogado'
            }
          }
        ];

        for (const testCase of testCases) {
          mockCollection.findOne.mockResolvedValue(testCase.mockUser);

          // Act
          const response = await request(app)
            .post('/api/auth/login')
            .send({
              email: 'user@test.com',
              password: 'MinhaSenh@123'
            })
            .expect(400);

          // Assert
          expect(response.body.error).toBe('Credenciais inválidas.');
        }
      });
    });

    describe('Performance e Limites', () => {
      it('deve responder em tempo razoável', async () => {
        // Arrange
        const email = 'user@test.com';
        const password = 'MinhaSenh@123';
        const hashedPassword = await hashPassword(password);
        
        const mockUser = {
          _id: '507f1f77bcf86cd799439011',
          email,
          password: hashedPassword,
          role: 'advogado',
          createdAt: new Date()
        };
        
        mockCollection.findOne.mockResolvedValue(mockUser);

        // Act
        const startTime = Date.now();
        await request(app)
          .post('/api/auth/login')
          .send({ email, password })
          .expect(200);
        const endTime = Date.now();

        // Assert
        const responseTime = endTime - startTime;
        expect(responseTime).toBeLessThan(5000); // Menos de 5 segundos
      });

      it('deve lidar com emails longos', async () => {
        // Arrange
        const longEmail = 'a'.repeat(50) + '@' + 'b'.repeat(50) + '.com';
        const password = 'MinhaSenh@123';
        const hashedPassword = await hashPassword(password);
        
        const mockUser = {
          _id: '507f1f77bcf86cd799439011',
          email: longEmail,
          password: hashedPassword,
          role: 'advogado',
          createdAt: new Date()
        };
        
        mockCollection.findOne.mockResolvedValue(mockUser);

        // Act
        const response = await request(app)
          .post('/api/auth/login')
          .send({ email: longEmail, password })
          .expect(200);

        // Assert
        expect(response.body.user.email).toBe(longEmail);
      });
    });
  });

  describe('Middleware Integration', () => {
    it('deve aplicar middlewares de segurança', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@test.com',
          password: 'MinhaSenh@123'
        });

      // Assert - Verificar headers de segurança
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
    });

    it('deve aplicar CORS corretamente', async () => {
      // Act
      const response = await request(app)
        .options('/api/auth/login')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST');

      // Assert
      expect(response.headers).toHaveProperty('access-control-allow-origin');
      expect(response.headers).toHaveProperty('access-control-allow-methods');
    });
  });
});