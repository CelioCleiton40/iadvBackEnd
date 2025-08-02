// Testes para AuthController - Porque controllers são a interface com o mundo
// Testando endpoints como se fossem portais de entrada para o sistema

import { Request, Response } from 'express';
import { login } from '../../src/controllers/authController';
import { loginUser } from '../../src/services/authService';
import { loginSchema } from '../../src/utils/validation';
import { createMockRequest, createMockResponse } from '../utils/testHelpers';
import { ZodError } from 'zod';

// Mocks
jest.mock('../../src/services/authService');
jest.mock('../../src/utils/validation');

const mockLoginUser = jest.mocked(loginUser);
const mockLoginSchema = {
  parse: jest.fn()
};

// Mock do loginSchema
jest.mocked(require('../../src/utils/validation')).loginSchema = mockLoginSchema;

describe('AuthController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    jest.clearAllMocks();
  });

  describe('login', () => {
    describe('Casos de Sucesso', () => {
      it('deve realizar login com sucesso', async () => {
        // Arrange
        const loginData = {
          email: 'user@test.com',
          password: 'password123'
        };
        const mockAuthResult = {
          token: 'mock-jwt-token',
          user: {
            id: '507f1f77bcf86cd799439011',
            email: 'user@test.com',
            role: 'advogado',
            createdAt: new Date('2024-01-01')
          }
        };

        mockReq.body = loginData;
        mockLoginSchema.parse.mockReturnValue(loginData);
        mockLoginUser.mockResolvedValue(mockAuthResult);

        // Act
        await login(mockReq as Request, mockRes as Response);

        // Assert
        expect(mockLoginSchema.parse).toHaveBeenCalledWith(loginData);
        expect(mockLoginUser).toHaveBeenCalledWith(loginData.email, loginData.password);
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          message: 'Login realizado com sucesso!',
          token: mockAuthResult.token,
          user: mockAuthResult.user
        });
      });

      it('deve retornar dados corretos do usuário', async () => {
        // Arrange
        const loginData = {
          email: 'magistrado@tribunal.com',
          password: 'senhaSegura123'
        };
        const mockAuthResult = {
          token: 'jwt-magistrado-token',
          user: {
            id: 'magistrado-id',
            email: 'magistrado@tribunal.com',
            role: 'magistrado',
            createdAt: new Date('2024-01-01')
          }
        };

        mockReq.body = loginData;
        mockLoginSchema.parse.mockReturnValue(loginData);
        mockLoginUser.mockResolvedValue(mockAuthResult);

        // Act
        await login(mockReq as Request, mockRes as Response);

        // Assert
        expect(mockRes.json).toHaveBeenCalledWith({
          message: 'Login realizado com sucesso!',
          token: 'jwt-magistrado-token',
          user: {
            id: 'magistrado-id',
            email: 'magistrado@tribunal.com',
            role: 'magistrado',
            createdAt: expect.any(Date)
          }
        });
      });
    });

    describe('Validação de Entrada', () => {
      it('deve rejeitar dados inválidos com ZodError', async () => {
        // Arrange
        const invalidData = {
          email: 'email-invalido',
          password: '123' // muito curta
        };
        
        const zodError = new ZodError([
          {
            code: 'invalid_string',
            path: ['email'],
            message: 'Email inválido',
            validation: 'email'
          },
          {
            code: 'too_small',
            path: ['password'],
            message: 'Senha deve ter pelo menos 8 caracteres',
            minimum: 8,
            type: 'string',
            inclusive: true
          }
        ]);

        mockReq.body = invalidData;
        mockLoginSchema.parse.mockImplementation(() => {
          throw zodError;
        });

        // Act
        await login(mockReq as Request, mockRes as Response);

        // Assert
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          error: 'Dados inválidos',
          details: [
            {
              field: 'email',
              message: 'Email inválido'
            },
            {
              field: 'password',
              message: 'Senha deve ter pelo menos 8 caracteres'
            }
          ]
        });
        expect(mockLoginUser).not.toHaveBeenCalled();
      });

      it('deve tratar campos aninhados em ZodError', async () => {
        // Arrange
        const zodError = new ZodError([
          {
            code: 'invalid_string',
            path: ['user', 'contact', 'email'],
            message: 'Email inválido',
            validation: 'email'
          }
        ]);

        mockReq.body = { user: { contact: { email: 'invalid' } } };
        mockLoginSchema.parse.mockImplementation(() => {
          throw zodError;
        });

        // Act
        await login(mockReq as Request, mockRes as Response);

        // Assert
        expect(mockRes.json).toHaveBeenCalledWith({
          error: 'Dados inválidos',
          details: [
            {
              field: 'user.contact.email',
              message: 'Email inválido'
            }
          ]
        });
      });
    });

    describe('Erros de Autenticação', () => {
      it('deve tratar credenciais inválidas', async () => {
        // Arrange
        const loginData = {
          email: 'user@test.com',
          password: 'senhaErrada'
        };
        const authError = new Error('Credenciais inválidas.');

        mockReq.body = loginData;
        mockLoginSchema.parse.mockReturnValue(loginData);
        mockLoginUser.mockRejectedValue(authError);

        // Act
        await login(mockReq as Request, mockRes as Response);

        // Assert
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          error: 'Credenciais inválidas.'
        });
      });

      it('deve tratar usuário não encontrado', async () => {
        // Arrange
        const loginData = {
          email: 'inexistente@test.com',
          password: 'password123'
        };
        const authError = new Error('Credenciais inválidas.');

        mockReq.body = loginData;
        mockLoginSchema.parse.mockReturnValue(loginData);
        mockLoginUser.mockRejectedValue(authError);

        // Act
        await login(mockReq as Request, mockRes as Response);

        // Assert
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          error: 'Credenciais inválidas.'
        });
      });

      it('deve tratar erro de geração de token', async () => {
        // Arrange
        const loginData = {
          email: 'user@test.com',
          password: 'password123'
        };
        const jwtError = new Error('JWT generation failed');

        mockReq.body = loginData;
        mockLoginSchema.parse.mockReturnValue(loginData);
        mockLoginUser.mockRejectedValue(jwtError);

        // Act
        await login(mockReq as Request, mockRes as Response);

        // Assert
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          error: 'JWT generation failed'
        });
      });
    });

    describe('Erros de Sistema', () => {
      it('deve tratar erro de conexão com banco', async () => {
        // Arrange
        const loginData = {
          email: 'user@test.com',
          password: 'password123'
        };
        const dbError = new Error('Database connection failed');

        mockReq.body = loginData;
        mockLoginSchema.parse.mockReturnValue(loginData);
        mockLoginUser.mockRejectedValue(dbError);

        // Act
        await login(mockReq as Request, mockRes as Response);

        // Assert
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          error: 'Database connection failed'
        });
      });

      it('deve tratar erro sem mensagem', async () => {
        // Arrange
        const loginData = {
          email: 'user@test.com',
          password: 'password123'
        };
        const unknownError = new Error();
        unknownError.message = ''; // Erro sem mensagem

        mockReq.body = loginData;
        mockLoginSchema.parse.mockReturnValue(loginData);
        mockLoginUser.mockRejectedValue(unknownError);

        // Act
        await login(mockReq as Request, mockRes as Response);

        // Assert
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          error: 'Erro inesperado ao realizar login.'
        });
      });

      it('deve tratar erro que não é instância de Error', async () => {
        // Arrange
        const loginData = {
          email: 'user@test.com',
          password: 'password123'
        };
        const stringError = 'String error';

        mockReq.body = loginData;
        mockLoginSchema.parse.mockReturnValue(loginData);
        mockLoginUser.mockRejectedValue(stringError);

        // Act
        await login(mockReq as Request, mockRes as Response);

        // Assert
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          error: 'Erro inesperado ao realizar login.'
        });
      });
    });

    describe('Fluxo Completo', () => {
      it('deve executar fluxo completo de validação e autenticação', async () => {
        // Arrange
        const loginData = {
          email: 'advogado@escritorio.com',
          password: 'MinhaSenh@123'
        };
        const mockAuthResult = {
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          user: {
            id: '507f1f77bcf86cd799439011',
            email: 'advogado@escritorio.com',
            role: 'advogado',
            createdAt: new Date('2024-01-01')
          }
        };

        mockReq.body = loginData;
        mockLoginSchema.parse.mockReturnValue(loginData);
        mockLoginUser.mockResolvedValue(mockAuthResult);

        // Act
        await login(mockReq as Request, mockRes as Response);

        // Assert - Verificar execução
        expect(mockLoginSchema.parse).toHaveBeenCalledWith(loginData);
        expect(mockLoginUser).toHaveBeenCalledWith(loginData.email, loginData.password);
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          message: 'Login realizado com sucesso!',
          token: mockAuthResult.token,
          user: mockAuthResult.user
        });
      });

      it('deve parar execução em caso de erro de validação', async () => {
        // Arrange
        const invalidData = { email: 'invalid', password: '123' };
        const zodError = new ZodError([
          {
            code: 'invalid_string',
            path: ['email'],
            message: 'Email inválido',
            validation: 'email'
          }
        ]);

        mockReq.body = invalidData;
        mockLoginSchema.parse.mockImplementation(() => {
          throw zodError;
        });

        // Act
        await login(mockReq as Request, mockRes as Response);

        // Assert - loginUser não deve ser chamado
        expect(mockLoginUser).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(400);
      });
    });

    describe('Casos Extremos', () => {
      it('deve lidar com body undefined', async () => {
        // Arrange
        mockReq.body = undefined;
        const zodError = new ZodError([
          {
            code: 'invalid_type',
            path: [],
            message: 'Required',
            expected: 'object',
            received: 'undefined'
          }
        ]);
        mockLoginSchema.parse.mockImplementation(() => {
          throw zodError;
        });

        // Act
        await login(mockReq as Request, mockRes as Response);

        // Assert
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          error: 'Dados inválidos',
          details: [
            {
              field: '',
              message: 'Required'
            }
          ]
        });
      });

      it('deve lidar com múltiplos erros de validação', async () => {
        // Arrange
        const zodError = new ZodError([
          {
            code: 'invalid_string',
            path: ['email'],
            message: 'Email inválido',
            validation: 'email'
          },
          {
            code: 'too_small',
            path: ['password'],
            message: 'Senha muito curta',
            minimum: 8,
            type: 'string',
            inclusive: true
          },
          {
            code: 'custom',
            path: ['password'],
            message: 'Senha deve conter caracteres especiais'
          }
        ]);

        mockReq.body = { email: 'invalid', password: '123' };
        mockLoginSchema.parse.mockImplementation(() => {
          throw zodError;
        });

        // Act
        await login(mockReq as Request, mockRes as Response);

        // Assert
        expect(mockRes.json).toHaveBeenCalledWith({
          error: 'Dados inválidos',
          details: [
            { field: 'email', message: 'Email inválido' },
            { field: 'password', message: 'Senha muito curta' },
            { field: 'password', message: 'Senha deve conter caracteres especiais' }
          ]
        });
      });
    });
  });
});