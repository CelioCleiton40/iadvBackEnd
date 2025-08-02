// Testes para ValidateRequest - Porque dados ruins não devem passar
// Testando validação como se fosse um filtro de realidades alternativas

import { Request, Response, NextFunction } from 'express';
import { validateRequest } from '../../src/middlewares/validateRequest';
import { z } from 'zod';
import { createMockRequest, createMockResponse } from '../utils/testHelpers';

// Mock do logger
jest.mock('../../src/utils/logger', () => ({
  warn: jest.fn(),
  info: jest.fn(),
  error: jest.fn()
}));

describe('ValidateRequest Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('Schema Validation', () => {
    it('deve passar validação com dados corretos', async () => {
      // Arrange
      const schema = z.object({
        name: z.string().min(3),
        email: z.string().email(),
        age: z.number().min(18)
      });

      mockReq.body = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 25
      };

      const middleware = validateRequest(schema);

      // Act
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it('deve rejeitar dados inválidos', async () => {
      // Arrange
      const schema = z.object({
        name: z.string().min(3),
        email: z.string().email(),
        age: z.number().min(18)
      });

      mockReq.body = {
        name: 'Jo', // muito curto
        email: 'invalid-email', // email inválido
        age: 16 // menor que 18
      };

      const middleware = validateRequest(schema);

      // Act
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Dados inválidos',
        details: expect.arrayContaining([
          expect.objectContaining({ field: 'name' }),
          expect.objectContaining({ field: 'email' }),
          expect.objectContaining({ field: 'age' })
        ])
      });
    });

    it('deve validar campos aninhados', async () => {
      // Arrange
      const schema = z.object({
        user: z.object({
          name: z.string().min(3),
          contact: z.object({
            email: z.string().email()
          })
        })
      });

      mockReq.body = {
        user: {
          name: 'Jo', // muito curto
          contact: {
            email: 'invalid-email' // email inválido
          }
        }
      };

      const middleware = validateRequest(schema);

      // Act
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Dados inválidos',
        details: expect.arrayContaining([
          expect.objectContaining({ field: 'user.name' }),
          expect.objectContaining({ field: 'user.contact.email' })
        ])
      });
    });
  });

  describe('Tipos de Validação', () => {
    it('deve validar tipos primitivos', async () => {
      // Arrange
      const schema = z.object({
        string: z.string(),
        number: z.number(),
        boolean: z.boolean(),
        date: z.date()
      });

      mockReq.body = {
        string: 123, // deveria ser string
        number: '123', // deveria ser number
        boolean: 'true', // deveria ser boolean
        date: '2023-01-01' // deveria ser Date
      };

      const middleware = validateRequest(schema);

      // Act
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Dados inválidos',
        details: expect.arrayContaining([
          expect.objectContaining({ field: 'string' }),
          expect.objectContaining({ field: 'number' }),
          expect.objectContaining({ field: 'boolean' }),
          expect.objectContaining({ field: 'date' })
        ])
      });
    });

    it('deve validar arrays', async () => {
      // Arrange
      const schema = z.object({
        items: z.array(z.string().min(3))
      });

      mockReq.body = {
        items: ['ok', 'a', 123, 'valid']
      };

      const middleware = validateRequest(schema);

      // Act
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Dados inválidos',
        details: expect.arrayContaining([
          expect.objectContaining({ field: 'items.1' }),
          expect.objectContaining({ field: 'items.2' })
        ])
      });
    });

    it('deve validar enums', async () => {
      // Arrange
      const schema = z.object({
        role: z.enum(['admin', 'user', 'guest'])
      });

      mockReq.body = {
        role: 'superuser' // valor não permitido
      };

      const middleware = validateRequest(schema);

      // Act
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Dados inválidos',
        details: expect.arrayContaining([
          expect.objectContaining({ field: 'role' })
        ])
      });
    });
  });

  describe('Validações Personalizadas', () => {
    it('deve validar com refinamentos personalizados', async () => {
      // Arrange
      const schema = z.object({
        password: z.string().min(8).refine(
          (val) => /[A-Z]/.test(val) && /[0-9]/.test(val),
          { message: 'A senha deve conter pelo menos uma letra maiúscula e um número' }
        )
      });

      mockReq.body = {
        password: 'weakpassword' // sem maiúscula e sem número
      };

      const middleware = validateRequest(schema);

      // Act
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Dados inválidos',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'password',
            message: 'A senha deve conter pelo menos uma letra maiúscula e um número'
          })
        ])
      });
    });

    it('deve validar com transformações', async () => {
      // Arrange
      const schema = z.object({
        email: z.string().email().transform(val => val.toLowerCase()),
        name: z.string().transform(val => val.trim())
      });

      mockReq.body = {
        email: 'USER@EXAMPLE.COM',
        name: '  John Doe  '
      };

      const middleware = validateRequest(schema);

      // Act
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      // Transformações não alteram o body original no middleware
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve passar erros não relacionados ao Zod para o próximo middleware', async () => {
      // Arrange
      const schema = z.object({
        name: z.string()
      });

      const error = new Error('Database error');
      const mockSchemaWithError = {
        parseAsync: jest.fn().mockRejectedValue(error)
      };

      mockReq.body = { name: 'John' };

      const middleware = validateRequest(mockSchemaWithError as unknown as z.ZodSchema);

      // Act
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it('deve lidar com body vazio', async () => {
      // Arrange
      const schema = z.object({
        name: z.string()
      });

      mockReq.body = undefined;

      const middleware = validateRequest(schema);

      // Act
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Dados inválidos',
        details: expect.arrayContaining([
          expect.objectContaining({ field: expect.any(String) })
        ])
      });
    });
  });

  describe('Casos de Uso Reais', () => {
    it('deve validar schema de login', async () => {
      // Arrange
      const loginSchema = z.object({
        email: z.string().email({ message: 'Email inválido' }),
        password: z.string().min(8, { message: 'Senha inválida' })
      }).strict();

      mockReq.body = {
        email: 'user@example.com',
        password: 'password123'
      };

      const middleware = validateRequest(loginSchema);

      // Act
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
    });

    it('deve validar schema de registro de usuário', async () => {
      // Arrange
      const registerSchema = z.object({
        email: z.string().email({ message: 'Email inválido' }),
        password: z.string()
          .min(8, { message: 'A senha deve ter pelo menos 8 caracteres' })
          .regex(/[a-z]/, { message: 'A senha deve conter pelo menos uma letra minúscula' })
          .regex(/[A-Z]/, { message: 'A senha deve conter pelo menos uma letra maiúscula' })
          .regex(/[0-9]/, { message: 'A senha deve conter pelo menos um número' }),
        role: z.enum(['advogado', 'procuradoria', 'magistrado'], { message: 'Tipo de usuário inválido' })
      });

      mockReq.body = {
        email: 'user@example.com',
        password: 'Password123',
        role: 'advogado'
      };

      const middleware = validateRequest(registerSchema);

      // Act
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
    });

    it('deve validar schema de processo', async () => {
      // Arrange
      const processoSchema = z.object({
        numeroProcesso: z.string().regex(/^\d{7}-\d{2}\.\d{4}\.\d{1}\.\d{2}\.\d{4}$/, {
          message: 'Número de processo inválido. Use o formato: 0000000-00.0000.0.00.0000'
        }),
        classe: z.string(),
        tribunal: z.string(),
        dataAjuizamento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
          message: 'Data inválida. Use o formato: YYYY-MM-DD'
        })
      });

      mockReq.body = {
        numeroProcesso: '1234567-89.2024.1.23.4567',
        classe: 'Ação Civil Pública',
        tribunal: 'TJRN',
        dataAjuizamento: '2024-01-15'
      };

      const middleware = validateRequest(processoSchema);

      // Act
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
    });
  });
});