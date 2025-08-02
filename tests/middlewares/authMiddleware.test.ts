// Testes para AuthMiddleware - Porque autenticação é a primeira linha de defesa
// Testando middleware como se fosse um portal de segurança interdimensional

import { Request, Response, NextFunction } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../../src/middlewares/authMiddleware';
import { generateToken } from '../../src/security/jwt';
import { createMockRequest, createMockResponse, createMockUser } from '../utils/testHelpers';

// Mock do módulo JWT
jest.mock('../../src/security/jwt');
const mockVerifyToken = jest.mocked(require('../../src/security/jwt').verifyToken);

describe('AuthMiddleware', () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('Token Validation', () => {
    it('deve permitir acesso com token válido', () => {
      // Arrange
      const mockUser = createMockUser();
      mockReq.headers = {
        authorization: 'Bearer valid-token-here'
      };
      mockVerifyToken.mockReturnValue(mockUser);

      // Act
      authMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      // Assert
      expect(mockVerifyToken).toHaveBeenCalledWith('valid-token-here');
      expect(mockReq.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('deve rejeitar requisição sem header Authorization', () => {
      // Arrange
      mockReq.headers = {};

      // Act
      authMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Acesso não autorizado: token ausente ou malformado.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('deve rejeitar header Authorization sem Bearer', () => {
      // Arrange
      mockReq.headers = {
        authorization: 'Basic invalid-format'
      };

      // Act
      authMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Acesso não autorizado: token ausente ou malformado.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('deve rejeitar Bearer sem token', () => {
      // Arrange
      mockReq.headers = {
        authorization: 'Bearer '
      };

      // Act
      authMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Acesso não autorizado: token ausente.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('deve rejeitar token inválido', () => {
      // Arrange
      mockReq.headers = {
        authorization: 'Bearer invalid-token'
      };
      mockVerifyToken.mockImplementation(() => {
        throw new Error('Token inválido');
      });

      // Act
      authMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Acesso negado: token inválido ou expirado.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Payload Validation', () => {
    it('deve rejeitar payload sem userId', () => {
      // Arrange
      mockReq.headers = {
        authorization: 'Bearer valid-token'
      };
      mockVerifyToken.mockReturnValue({
        email: 'test@test.com',
        // userId ausente
      } as any);

      // Act
      authMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Token inválido: informações incompletas.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('deve rejeitar payload sem email', () => {
      // Arrange
      mockReq.headers = {
        authorization: 'Bearer valid-token'
      };
      mockVerifyToken.mockReturnValue({
        userId: '123',
        // email ausente
      } as any);

      // Act
      authMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Token inválido: informações incompletas.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('deve rejeitar payload null', () => {
      // Arrange
      mockReq.headers = {
        authorization: 'Bearer valid-token'
      };
      mockVerifyToken.mockReturnValue(null as any);

      // Act
      authMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Token inválido: informações incompletas.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('deve capturar erros de verificação de token', () => {
      // Arrange
      mockReq.headers = {
        authorization: 'Bearer malformed-token'
      };
      mockVerifyToken.mockImplementation(() => {
        throw new Error('JWT malformed');
      });

      // Act
      authMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Acesso negado: token inválido ou expirado.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('deve capturar erros não relacionados a JWT', () => {
      // Arrange
      mockReq.headers = {
        authorization: 'Bearer some-token'
      };
      mockVerifyToken.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      // Act
      authMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Acesso negado: token inválido ou expirado.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Request Enhancement', () => {
    it('deve adicionar user ao request com todos os campos', () => {
      // Arrange
      const mockUser = createMockUser({
        userId: 'user-123',
        email: 'user@test.com',
        role: 'advogado'
      });
      mockReq.headers = {
        authorization: 'Bearer valid-token'
      };
      mockVerifyToken.mockReturnValue(mockUser);

      // Act
      authMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      // Assert
      expect(mockReq.user).toEqual(mockUser);
      expect(mockReq.user?.userId).toBe('user-123');
      expect(mockReq.user?.email).toBe('user@test.com');
      expect(mockReq.user?.role).toBe('advogado');
    });

    it('deve preservar outros campos do request', () => {
      // Arrange
      const mockUser = createMockUser();
      mockReq = {
        ...createMockRequest(),
        body: { data: 'test' },
        params: { id: '123' },
        query: { filter: 'active' },
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        }
      };
      mockVerifyToken.mockReturnValue(mockUser);

      // Act
      authMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      // Assert
      expect(mockReq.body).toEqual({ data: 'test' });
      expect(mockReq.params).toEqual({ id: '123' });
      expect(mockReq.query).toEqual({ filter: 'active' });
      expect(mockReq.headers?.['content-type']).toBe('application/json');
      expect(mockReq.user).toEqual(mockUser);
    });
  });

  describe('Integration Scenarios', () => {
    it('deve funcionar com diferentes tipos de role', () => {
      // Arrange
      const roles = ['advogado', 'procuradoria', 'magistrado'] as const;
      
      roles.forEach(role => {
        const mockUser = createMockUser({ role });
        mockReq.headers = {
          authorization: 'Bearer valid-token'
        };
        mockVerifyToken.mockReturnValue(mockUser);

        // Act
        authMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

        // Assert
        expect(mockReq.user?.role).toBe(role);
        expect(mockNext).toHaveBeenCalled();
        
        // Reset para próxima iteração
        jest.clearAllMocks();
      });
    });

    it('deve funcionar com tokens de diferentes formatos válidos', () => {
      // Arrange
      const tokenFormats = [
        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature',
        'Bearer short-token',
        'Bearer very-long-token-with-many-characters-and-numbers-123456789'
      ];
      
      tokenFormats.forEach(authHeader => {
        const mockUser = createMockUser();
        mockReq.headers = { authorization: authHeader };
        mockVerifyToken.mockReturnValue(mockUser);

        // Act
        authMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

        // Assert
        expect(mockNext).toHaveBeenCalled();
        expect(mockReq.user).toEqual(mockUser);
        
        // Reset para próxima iteração
        jest.clearAllMocks();
      });
    });
  });
});