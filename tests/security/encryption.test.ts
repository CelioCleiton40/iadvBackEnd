// Testes para Encryption - Porque senhas em texto plano são coisa do passado
// Testando criptografia como se fosse ciência quântica (mas é só bcrypt)

import { hashPassword, comparePasswords } from '../../src/security/encryption';

describe('Encryption Module', () => {
  describe('hashPassword', () => {
    it('deve gerar hash válido para senha', async () => {
      // Arrange
      const password = 'MinhaSenh@123';
      
      // Act
      const hash = await hashPassword(password);
      
      // Assert
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash).not.toBe(password); // Hash não deve ser igual à senha original
      expect(hash.length).toBeGreaterThan(50); // bcrypt gera hashes longos
    });

    it('deve gerar hashes diferentes para a mesma senha', async () => {
      // Arrange
      const password = 'MinhaSenh@123';
      
      // Act
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      // Assert
      expect(hash1).not.toBe(hash2); // Salt diferente = hash diferente
    });

    it('deve funcionar com senhas especiais', async () => {
      // Arrange
      const specialPasswords = [
        'Senh@C0mC@r@ct3r3sEsp3c!@!s',
        '123456789',
        'àáâãäåæçèéêëìíîïñòóôõöøùúûüý',
        '密码测试',
        '🔐🔑🛡️'
      ];
      
      // Act & Assert
      for (const password of specialPasswords) {
        const hash = await hashPassword(password);
        expect(hash).toBeDefined();
        expect(hash).not.toBe(password);
      }
    });

    it('deve funcionar com senha vazia', async () => {
      // Arrange
      const password = '';
      
      // Act
      const hash = await hashPassword(password);
      
      // Assert
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
    });

    it('deve ser determinístico na verificação', async () => {
      // Arrange
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      
      // Act
      const isValid1 = await comparePasswords(password, hash);
      const isValid2 = await comparePasswords(password, hash);
      
      // Assert
      expect(isValid1).toBe(true);
      expect(isValid2).toBe(true);
    });
  });

  describe('comparePasswords', () => {
    it('deve validar senha correta', async () => {
      // Arrange
      const password = 'MinhaSenh@Secreta123';
      const hash = await hashPassword(password);
      
      // Act
      const isValid = await comparePasswords(password, hash);
      
      // Assert
      expect(isValid).toBe(true);
    });

    it('deve rejeitar senha incorreta', async () => {
      // Arrange
      const correctPassword = 'SenhaCorreta123!';
      const wrongPassword = 'SenhaErrada456!';
      const hash = await hashPassword(correctPassword);
      
      // Act
      const isValid = await comparePasswords(wrongPassword, hash);
      
      // Assert
      expect(isValid).toBe(false);
    });

    it('deve ser case-sensitive', async () => {
      // Arrange
      const password = 'SenhaComCaseSensitive';
      const hash = await hashPassword(password);
      
      // Act
      const isValidLower = await comparePasswords(password.toLowerCase(), hash);
      const isValidUpper = await comparePasswords(password.toUpperCase(), hash);
      const isValidCorrect = await comparePasswords(password, hash);
      
      // Assert
      expect(isValidLower).toBe(false);
      expect(isValidUpper).toBe(false);
      expect(isValidCorrect).toBe(true);
    });

    it('deve rejeitar hash inválido', async () => {
      // Arrange
      const password = 'QualquerSenha123';
      const invalidHash = 'hash-invalido-aqui';
      
      // Act & Assert
      await expect(comparePasswords(password, invalidHash))
        .rejects.toThrow();
    });

    it('deve rejeitar senha vazia com hash válido', async () => {
      // Arrange
      const password = 'SenhaValida123';
      const hash = await hashPassword(password);
      
      // Act
      const isValid = await comparePasswords('', hash);
      
      // Assert
      expect(isValid).toBe(false);
    });

    it('deve funcionar com caracteres especiais', async () => {
      // Arrange
      const specialPassword = 'Senh@C0m!@#$%^&*()_+-=[]{}|;:,.<>?';
      const hash = await hashPassword(specialPassword);
      
      // Act
      const isValid = await comparePasswords(specialPassword, hash);
      
      // Assert
      expect(isValid).toBe(true);
    });
  });

  describe('Security Properties', () => {
    it('deve usar salt adequado (hashes diferentes para mesma senha)', async () => {
      // Arrange
      const password = 'TesteSalt123';
      
      // Act
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      // Assert
      expect(hash1).not.toBe(hash2);
      
      // Mas ambos devem validar a mesma senha
      expect(await comparePasswords(password, hash1)).toBe(true);
      expect(await comparePasswords(password, hash2)).toBe(true);
    });

    it('deve ter tempo de execução razoável', async () => {
      // Arrange
      const password = 'TestePerformance123';
      const startTime = Date.now();
      
      // Act
      await hashPassword(password);
      const endTime = Date.now();
      
      // Assert
      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(1000); // Menos de 1 segundo
      expect(executionTime).toBeGreaterThan(10); // Mas não instantâneo (segurança)
    });

    it('deve manter consistência em múltiplas operações', async () => {
      // Arrange
      const passwords = [
        'Senha1@',
        'Senha2#',
        'Senha3$',
        'Senha4%',
        'Senha5&'
      ];
      
      // Act & Assert
      for (const password of passwords) {
        const hash = await hashPassword(password);
        
        // Deve validar a senha correta
        expect(await comparePasswords(password, hash)).toBe(true);
        
        // Não deve validar senhas diferentes
        const otherPasswords = passwords.filter(p => p !== password);
        for (const otherPassword of otherPasswords) {
          expect(await comparePasswords(otherPassword, hash)).toBe(false);
        }
      }
    });
  });
});