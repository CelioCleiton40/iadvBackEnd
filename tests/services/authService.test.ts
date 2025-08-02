// Testes para AuthService - Porque autenticação é ciência, não magia
// Testando login como se fosse um portal para dimensões seguras

import { ObjectId } from 'mongodb';
import { loginUser } from '../../src/services/authService';
import { comparePasswords } from '../../src/security/encryption';
import { generateToken } from '../../src/security/jwt';
import { createMockUserComplete, createMockDatabase, createMockCollection } from '../utils/testHelpers';

// Mocks dos módulos
jest.mock('../../src/security/encryption');
jest.mock('../../src/security/jwt');
jest.mock('../../src/config/dataBase');

const mockComparePasswords = jest.mocked(comparePasswords);
const mockGenerateToken = jest.mocked(generateToken);

// Mock do client do MongoDB
const mockCollection = createMockCollection();
const mockDb = createMockDatabase();
const mockClient = {
  db: jest.fn().mockReturnValue(mockDb)
};

// Mock do módulo dataBase
jest.mock('../../src/config/dataBase', () => ({
  client: {
    db: jest.fn().mockReturnValue({
      collection: jest.fn()
    })
  }
}));

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configurar mocks do banco de dados
    const { client } = require('../../src/config/dataBase');
    client.db.mockReturnValue({
      collection: jest.fn().mockReturnValue(mockCollection)
    });
  });

  describe('loginUser', () => {
    describe('Validação de Entrada', () => {
      it('deve rejeitar email vazio', async () => {
        // Act & Assert
        await expect(loginUser('', 'password123'))
          .rejects.toThrow('E-mail e senha são obrigatórios.');
      });

      it('deve rejeitar senha vazia', async () => {
        // Act & Assert
        await expect(loginUser('user@test.com', ''))
          .rejects.toThrow('E-mail e senha são obrigatórios.');
      });

      it('deve rejeitar email com formato inválido', async () => {
        // Act & Assert
        await expect(loginUser('email-invalido', 'password123'))
          .rejects.toThrow('Formato de e-mail inválido.');
      });

      it('deve aceitar email com formato válido', async () => {
        // Arrange
        const validEmails = [
          'user@test.com',
          'user.name@domain.co.uk',
          'user+tag@example.org',
          'user123@test-domain.com'
        ];

        // Mock para não encontrar usuário (para testar apenas validação)
        mockCollection.findOne.mockResolvedValue(null);

        for (const email of validEmails) {
          // Act & Assert
          await expect(loginUser(email, 'password123'))
            .rejects.toThrow('Credenciais inválidas.');
        }
      });
    });

    describe('Busca de Usuário', () => {
      it('deve buscar usuário pelo email', async () => {
        // Arrange
        const email = 'user@test.com';
        const password = 'password123';
        const mockUser = createMockUserComplete({ email });
        
        mockCollection.findOne.mockResolvedValue(mockUser);
        mockComparePasswords.mockResolvedValue(true);
        mockGenerateToken.mockReturnValue('mock-token');

        // Act
        await loginUser(email, password);

        // Assert
        const { client } = require('../../src/config/dataBase');
        expect(client.db).toHaveBeenCalledWith('iadvdb');
        expect(mockCollection.findOne).toHaveBeenCalledWith({ email });
      });

      it('deve rejeitar quando usuário não existe', async () => {
        // Arrange
        mockCollection.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(loginUser('nonexistent@test.com', 'password123'))
          .rejects.toThrow('Credenciais inválidas.');
      });
    });

    describe('Verificação de Senha', () => {
      it('deve verificar senha correta', async () => {
        // Arrange
        const email = 'user@test.com';
        const password = 'password123';
        const mockUser = createMockUserComplete({ 
          email,
          password: '$2b$10$hashedpassword'
        });
        
        mockCollection.findOne.mockResolvedValue(mockUser);
        mockComparePasswords.mockResolvedValue(true);
        mockGenerateToken.mockReturnValue('mock-token');

        // Act
        await loginUser(email, password);

        // Assert
        expect(mockComparePasswords).toHaveBeenCalledWith(
          password,
          mockUser.password
        );
      });

      it('deve rejeitar senha incorreta', async () => {
        // Arrange
        const email = 'user@test.com';
        const password = 'wrongpassword';
        const mockUser = createMockUserComplete({ email });
        
        mockCollection.findOne.mockResolvedValue(mockUser);
        mockComparePasswords.mockResolvedValue(false);

        // Act & Assert
        await expect(loginUser(email, password))
          .rejects.toThrow('Credenciais inválidas.');
      });
    });

    describe('Geração de Token', () => {
      it('deve gerar token com dados corretos', async () => {
        // Arrange
        const email = 'user@test.com';
        const password = 'password123';
        const mockUser = createMockUserComplete({ 
          _id: new ObjectId('507f1f77bcf86cd799439011'),
          email,
          role: 'advogado'
        });
        
        mockCollection.findOne.mockResolvedValue(mockUser);
        mockComparePasswords.mockResolvedValue(true);
        mockGenerateToken.mockReturnValue('generated-token');

        // Act
        await loginUser(email, password);

        // Assert
        expect(mockGenerateToken).toHaveBeenCalledWith({
          userId: '507f1f77bcf86cd799439011',
          email: email,
          role: 'advogado'
        });
      });

      it('deve retornar dados do usuário e token', async () => {
        // Arrange
        const email = 'user@test.com';
        const password = 'password123';
        const mockUser = createMockUserComplete({ 
          _id: new ObjectId('507f1f77bcf86cd799439011'),
          email,
          role: 'magistrado'
        });
        
        mockCollection.findOne.mockResolvedValue(mockUser);
        mockComparePasswords.mockResolvedValue(true);
        mockGenerateToken.mockReturnValue('auth-token-123');

        // Act
        const result = await loginUser(email, password);

        // Assert
        expect(result).toEqual({
          token: 'auth-token-123',
          user: {
            id: '507f1f77bcf86cd799439011',
            email: email,
            role: 'magistrado',
            createdAt: expect.any(Date)
          }
        });
      });
    });

    describe('Casos de Erro', () => {
      it('deve tratar erro de conexão com banco', async () => {
        // Arrange
        mockCollection.findOne.mockRejectedValue(new Error('Database connection failed'));

        // Act & Assert
        await expect(loginUser('user@test.com', 'password123'))
          .rejects.toThrow('Database connection failed');
      });

      it('deve tratar erro na comparação de senhas', async () => {
        // Arrange
        const mockUser = createMockUserComplete();
        mockCollection.findOne.mockResolvedValue(mockUser);
        mockComparePasswords.mockRejectedValue(new Error('Bcrypt error'));

        // Act & Assert
        await expect(loginUser('user@test.com', 'password123'))
          .rejects.toThrow('Bcrypt error');
      });

      it('deve tratar erro na geração de token', async () => {
        // Arrange
        const mockUser = createMockUserComplete();
        mockCollection.findOne.mockResolvedValue(mockUser);
        mockComparePasswords.mockResolvedValue(true);
        mockGenerateToken.mockImplementation(() => {
          throw new Error('JWT generation failed');
        });

        // Act & Assert
        await expect(loginUser('user@test.com', 'password123'))
          .rejects.toThrow('JWT generation failed');
      });
    });

    describe('Segurança', () => {
      it('deve usar mensagem genérica para usuário não encontrado', async () => {
        // Arrange
        mockCollection.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(loginUser('nonexistent@test.com', 'password123'))
          .rejects.toThrow('Credenciais inválidas.');
        
        // Não deve revelar se o usuário existe ou não
      });

      it('deve usar mensagem genérica para senha incorreta', async () => {
        // Arrange
        const mockUser = createMockUserComplete();
        mockCollection.findOne.mockResolvedValue(mockUser);
        mockComparePasswords.mockResolvedValue(false);

        // Act & Assert
        await expect(loginUser('user@test.com', 'wrongpassword'))
          .rejects.toThrow('Credenciais inválidas.');
        
        // Mesma mensagem para não revelar se o email existe
      });

      it('deve funcionar com diferentes tipos de usuário', async () => {
        // Arrange
        const roles = ['advogado', 'procuradoria', 'magistrado'] as const;
        
        for (const role of roles) {
          const mockUser = createMockUserComplete({ role });
          mockCollection.findOne.mockResolvedValue(mockUser);
          mockComparePasswords.mockResolvedValue(true);
          mockGenerateToken.mockReturnValue(`token-${role}`);

          // Act
          const result = await loginUser('user@test.com', 'password123');

          // Assert
          expect(result.user.role).toBe(role);
          expect(result.token).toBe(`token-${role}`);
          
          // Reset para próxima iteração
          jest.clearAllMocks();
          mockDb.collection.mockReturnValue(mockCollection);
        }
      });
    });

    describe('Performance e Limites', () => {
      it('deve funcionar com emails longos válidos', async () => {
        // Arrange
        const longEmail = 'a'.repeat(50) + '@' + 'b'.repeat(50) + '.com';
        const mockUser = createMockUserComplete({ email: longEmail });
        
        mockCollection.findOne.mockResolvedValue(mockUser);
        mockComparePasswords.mockResolvedValue(true);
        mockGenerateToken.mockReturnValue('token');

        // Act
        const result = await loginUser(longEmail, 'password123');

        // Assert
        expect(result.user.email).toBe(longEmail);
      });

      it('deve funcionar com senhas complexas', async () => {
        // Arrange
        const complexPassword = 'P@ssw0rd!@#$%^&*()_+-=[]{}|;:,.<>?';
        const mockUser = createMockUserComplete();
        
        mockCollection.findOne.mockResolvedValue(mockUser);
        mockComparePasswords.mockResolvedValue(true);
        mockGenerateToken.mockReturnValue('token');

        // Act
        const result = await loginUser('user@test.com', complexPassword);

        // Assert
        expect(mockComparePasswords).toHaveBeenCalledWith(
          complexPassword,
          mockUser.password
        );
        expect(result).toBeDefined();
      });
    });
  });
});