// Testes para JWT - Porque segurança não é brincadeira
// Testando tokens como se fossem portais interdimensionais

import { generateToken, verifyToken, UserPayload } from '../../src/security/jwt';
import { createMockUser } from '../utils/testHelpers';

// Mock do módulo de configuração
jest.mock('../../src/config/env', () => ({
  JWT_SECRET: 'test-jwt-secret-key-for-testing-purposes-only'
}));

describe('JWT Security Module', () => {
  describe('generateToken', () => {
    it('deve gerar um token válido com payload correto', () => {
      // Arrange
      const payload = createMockUser();
      
      // Act
      const token = generateToken(payload);
      
      // Assert
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT tem 3 partes
    });

    it('deve rejeitar payload sem userId', () => {
      // Arrange
      const invalidPayload = { email: 'test@test.com' } as UserPayload;
      
      // Act & Assert
      expect(() => generateToken(invalidPayload))
        .toThrow('Payload inválido: userId e email são obrigatórios.');
    });

    it('deve rejeitar payload sem email', () => {
      // Arrange
      const invalidPayload = { userId: '123' } as UserPayload;
      
      // Act & Assert
      expect(() => generateToken(invalidPayload))
        .toThrow('Payload inválido: userId e email são obrigatórios.');
    });

    it('deve incluir campos obrigatórios no token', () => {
      // Arrange
      const payload = createMockUser({
        userId: 'test-user-id',
        email: 'test@example.com',
        role: 'advogado'
      });
      
      // Act
      const token = generateToken(payload);
      const decoded = verifyToken(token);
      
      // Assert
      expect(decoded.userId).toBe('test-user-id');
      expect(decoded.email).toBe('test@example.com');
      expect(decoded.role).toBe('advogado');
    });
  });

  describe('verifyToken', () => {
    it('deve verificar e decodificar token válido', () => {
      // Arrange
      const payload = createMockUser();
      const token = generateToken(payload);
      
      // Act
      const decoded = verifyToken(token);
      
      // Assert
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
    });

    it('deve rejeitar token inválido', () => {
      // Arrange
      const invalidToken = 'token.invalido.aqui';
      
      // Act & Assert
      expect(() => verifyToken(invalidToken))
        .toThrow('Token inválido ou expirado.');
    });

    it('deve rejeitar token vazio', () => {
      // Act & Assert
      expect(() => verifyToken(''))
        .toThrow('Token ausente ou malformado.');
    });

    it('deve rejeitar token null', () => {
      // Act & Assert
      expect(() => verifyToken(null as any))
        .toThrow('Token ausente ou malformado.');
    });

    it('deve rejeitar token que não é string', () => {
      // Act & Assert
      expect(() => verifyToken(123 as any))
        .toThrow('Token ausente ou malformado.');
    });

    it('deve verificar se token contém campos obrigatórios', () => {
      // Arrange - Criando um token com payload incompleto usando JWT diretamente
      const jwt = require('jsonwebtoken');
      const incompletePayload = { userId: 'test' }; // sem email
      const token = jwt.sign(incompletePayload, 'test-jwt-secret-key-for-testing-purposes-only');
      
      // Act & Assert
      expect(() => verifyToken(token))
        .toThrow('Token inválido ou expirado.');
    });

    it('deve verificar expiração do token', () => {
      // Arrange - Token expirado
      const jwt = require('jsonwebtoken');
      const payload = createMockUser();
      const expiredToken = jwt.sign(
        payload, 
        'test-jwt-secret-key-for-testing-purposes-only',
        { expiresIn: '-1h' } // Expirado há 1 hora
      );
      
      // Act & Assert
      expect(() => verifyToken(expiredToken))
        .toThrow('Token inválido ou expirado.');
    });
  });

  describe('Token Lifecycle', () => {
    it('deve manter consistência entre geração e verificação', () => {
      // Arrange
      const originalPayload = createMockUser({
        userId: 'user-123',
        email: 'user@test.com',
        role: 'magistrado'
      });
      
      // Act
      const token = generateToken(originalPayload);
      const decodedPayload = verifyToken(token);
      
      // Assert
      expect(decodedPayload.userId).toBe(originalPayload.userId);
      expect(decodedPayload.email).toBe(originalPayload.email);
      expect(decodedPayload.role).toBe(originalPayload.role);
    });

    it('deve incluir timestamps de criação e expiração', () => {
      // Arrange
      const payload = createMockUser();
      const beforeGeneration = Math.floor(Date.now() / 1000);
      
      // Act
      const token = generateToken(payload);
      const decoded = verifyToken(token);
      
      const afterGeneration = Math.floor(Date.now() / 1000);
      
      // Assert
      expect(decoded.iat).toBeGreaterThanOrEqual(beforeGeneration);
      expect(decoded.iat).toBeLessThanOrEqual(afterGeneration);
      expect(decoded.exp).toBeGreaterThan(decoded.iat!);
      expect(decoded.exp! - decoded.iat!).toBe(3600); // 1 hora em segundos
    });
  });
});