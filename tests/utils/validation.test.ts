// Testes para Validation Utils - Porque validação é a primeira linha de defesa
// Testando validações como se fossem filtros de realidade

import { z } from 'zod';
import { 
  registerSchema, 
  loginSchema, 
  advogadoSchema,
  validate 
} from '../../src/utils/validation';
import { Request, Response, NextFunction } from 'express';
import { createMockRequest, createMockResponse } from '../utils/testHelpers';

describe('Validation Utils', () => {
  describe('registerSchema', () => {
    describe('Validações de Email', () => {
      it('deve aceitar emails válidos', () => {
        // Arrange
        const validEmails = [
          'user@example.com',
          'user.name@domain.co.uk',
          'user+tag@example.org',
          'user123@test-domain.com',
          'a@b.co'
        ];

        validEmails.forEach(email => {
          const data = {
            email,
            password: 'MinhaSenh@123',
            role: 'advogado' as const
          };

          // Act & Assert
          expect(() => registerSchema.parse(data)).not.toThrow();
        });
      });

      it('deve rejeitar emails inválidos', () => {
        // Arrange
        const invalidEmails = [
          'email-sem-arroba',
          '@domain.com',
          'user@',
          'user@domain',
          'user space@domain.com',
          'user..double@domain.com',
          ''
        ];

        invalidEmails.forEach(email => {
          const data = {
            email,
            password: 'MinhaSenh@123',
            role: 'advogado' as const
          };

          // Act & Assert
          expect(() => registerSchema.parse(data)).toThrow();
        });
      });

      it('deve rejeitar email com espaços', () => {
        // Arrange
        const data = {
          email: 'user @domain.com',
          password: 'MinhaSenh@123',
          role: 'advogado' as const
        };

        // Act & Assert
        expect(() => registerSchema.parse(data)).toThrow('Email não pode conter espaços');
      });
    });

    describe('Validações de Senha', () => {
      it('deve aceitar senhas fortes', () => {
        // Arrange
        const strongPasswords = [
          'MinhaSenh@123',
          'P@ssw0rd!',
          'Str0ng#Pass',
          'C0mpl3x@Password'
        ];

        strongPasswords.forEach(password => {
          const data = {
            email: 'user@test.com',
            password,
            role: 'advogado' as const
          };

          // Act & Assert
          expect(() => registerSchema.parse(data)).not.toThrow();
        });
      });

      it('deve rejeitar senhas fracas', () => {
        // Arrange
        const weakPasswords = [
          '123456', // muito curta
          'password', // sem maiúscula, número e símbolo
          'PASSWORD', // sem minúscula, número e símbolo
          '12345678', // sem letras e símbolo
          'Password', // sem número e símbolo
          'Password1', // sem símbolo
          'password@', // sem maiúscula e número
          'PASSWORD@1' // sem minúscula
        ];

        weakPasswords.forEach(password => {
          const data = {
            email: 'user@test.com',
            password,
            role: 'advogado' as const
          };

          // Act & Assert
          expect(() => registerSchema.parse(data)).toThrow();
        });
      });

      it('deve validar requisitos específicos de senha', () => {
        // Arrange & Act & Assert
        const testCases = [
          {
            password: '1234567', // muito curta
            expectedError: 'A senha deve ter pelo menos 8 caracteres'
          },
          {
            password: 'PASSWORD123!', // sem minúscula
            expectedError: 'A senha deve conter pelo menos uma letra minúscula'
          },
          {
            password: 'password123!', // sem maiúscula
            expectedError: 'A senha deve conter pelo menos uma letra maiúscula'
          },
          {
            password: 'Password!', // sem número
            expectedError: 'A senha deve conter pelo menos um número'
          },
          {
            password: 'Password123', // sem caractere especial
            expectedError: 'A senha deve conter pelo menos um caractere especial'
          }
        ];

        testCases.forEach(testCase => {
          const data = {
            email: 'user@test.com',
            password: testCase.password,
            role: 'advogado' as const
          };

          try {
            registerSchema.parse(data);
            fail(`Expected validation to fail for password: ${testCase.password}`);
          } catch (error) {
            if (error instanceof z.ZodError) {
              const passwordErrors = error.errors.filter(e => e.path.includes('password'));
              expect(passwordErrors.some(e => e.message.includes(testCase.expectedError))).toBe(true);
            }
          }
        });
      });
    });

    describe('Validações de Role', () => {
      it('deve aceitar roles válidos', () => {
        // Arrange
        const validRoles = ['advogado', 'procuradoria', 'magistrado'] as const;

        validRoles.forEach(role => {
          const data = {
            email: 'user@test.com',
            password: 'MinhaSenh@123',
            role
          };

          // Act & Assert
          expect(() => registerSchema.parse(data)).not.toThrow();
        });
      });

      it('deve rejeitar roles inválidos', () => {
        // Arrange
        const invalidRoles = ['admin', 'user', 'cliente', 'secretario', ''];

        invalidRoles.forEach(role => {
          const data = {
            email: 'user@test.com',
            password: 'MinhaSenh@123',
            role
          };

          // Act & Assert
          expect(() => registerSchema.parse(data)).toThrow('Tipo de usuário inválido');
        });
      });
    });
  });

  describe('loginSchema', () => {
    it('deve aceitar dados de login válidos', () => {
      // Arrange
      const validData = {
        email: 'user@test.com',
        password: 'MinhaSenh@123'
      };

      // Act & Assert
      expect(() => loginSchema.parse(validData)).not.toThrow();
    });

    it('deve rejeitar campos extras (strict mode)', () => {
      // Arrange
      const dataWithExtra = {
        email: 'user@test.com',
        password: 'MinhaSenh@123',
        extraField: 'not allowed'
      };

      // Act & Assert
      expect(() => loginSchema.parse(dataWithExtra)).toThrow();
    });

    it('deve validar senha mínima para login', () => {
      // Arrange
      const data = {
        email: 'user@test.com',
        password: '1234567' // menos de 8 caracteres
      };

      // Act & Assert
      expect(() => loginSchema.parse(data)).toThrow('Senha inválida');
    });
  });

  describe('advogadoSchema', () => {
    describe('Validação de Nome', () => {
      it('deve aceitar nomes válidos', () => {
        // Arrange
        const validNames = [
          'João Silva',
          'Maria José da Silva',
          "O'Connor",
          'José-Carlos',
          'Ana Lúcia',
          'François'
        ];

        validNames.forEach(nome => {
          const data = {
            nome,
            cpf: '123.456.789-01',
            email: 'advogado@test.com',
            telefone: '(84) 99999-9999',
            oab: '12345',
            estado: 'RN',
            especialidade: 'Direito Civil'
          };

          // Act & Assert
          expect(() => advogadoSchema.parse(data)).not.toThrow();
        });
      });

      it('deve rejeitar nomes inválidos', () => {
        // Arrange
        const invalidNames = [
          'Jo', // muito curto
          'João123', // com números
          'João@Silva', // com símbolos inválidos
          '', // vazio
          'a'.repeat(101) // muito longo
        ];

        invalidNames.forEach(nome => {
          const data = {
            nome,
            cpf: '123.456.789-01',
            email: 'advogado@test.com',
            telefone: '(84) 99999-9999',
            oab: '12345',
            estado: 'RN',
            especialidade: 'Direito Civil'
          };

          // Act & Assert
          expect(() => advogadoSchema.parse(data)).toThrow();
        });
      });
    });

    describe('Validação de CPF', () => {
      it('deve aceitar CPFs válidos', () => {
        // Arrange
        const validCPFs = [
          '123.456.789-01',
          '12345678901',
          '000.000.000-00'
        ];

        validCPFs.forEach(cpf => {
          const data = {
            nome: 'João Silva',
            cpf,
            email: 'advogado@test.com',
            telefone: '(84) 99999-9999',
            oab: '12345',
            estado: 'RN',
            especialidade: 'Direito Civil'
          };

          // Act & Assert
          expect(() => advogadoSchema.parse(data)).not.toThrow();
        });
      });

      it('deve rejeitar CPFs inválidos', () => {
        // Arrange
        const invalidCPFs = [
          '123.456.789', // incompleto
          '123.456.789-0', // incompleto
          '123.456.789-012', // muito longo
           'abc.def.ghi-jk', // com letras
          ''
        ];

        invalidCPFs.forEach(cpf => {
          const data = {
            nome: 'João Silva',
            cpf,
            email: 'advogado@test.com',
            telefone: '(84) 99999-9999',
            oab: '12345',
            estado: 'RN',
            especialidade: 'Direito Civil'
          };

          // Act & Assert
          expect(() => advogadoSchema.parse(data)).toThrow('CPF inválido');
        });
      });
    });

    describe('Validação de Telefone', () => {
      it('deve aceitar telefones válidos', () => {
        // Arrange
        const validPhones = [
          '(84) 99999-9999',
          '(11) 9999-9999',
          '84 99999-9999',
          '8499999999',
          '11 9999-9999'
        ];

        validPhones.forEach(telefone => {
          const data = {
            nome: 'João Silva',
            cpf: '123.456.789-01',
            email: 'advogado@test.com',
            telefone,
            oab: '12345',
            estado: 'RN',
            especialidade: 'Direito Civil'
          };

          // Act & Assert
          expect(() => advogadoSchema.parse(data)).not.toThrow();
        });
      });

      it('deve rejeitar telefones inválidos', () => {
        // Arrange
        const invalidPhones = [
          '123', // muito curto
          'abc-defg', // com letras
          '(84) 999', // incompleto
          ''
        ];

        invalidPhones.forEach(telefone => {
          const data = {
            nome: 'João Silva',
            cpf: '123.456.789-01',
            email: 'advogado@test.com',
            telefone,
            oab: '12345',
            estado: 'RN',
            especialidade: 'Direito Civil'
          };

          // Act & Assert
          expect(() => advogadoSchema.parse(data)).toThrow('Telefone inválido');
        });
      });
    });

    describe('Validação de Estado', () => {
      it('deve aceitar siglas de estado válidas', () => {
        // Arrange
        const validStates = ['RN', 'SP', 'RJ', 'MG', 'RS', 'PR'];

        validStates.forEach(estado => {
          const data = {
            nome: 'João Silva',
            cpf: '123.456.789-01',
            email: 'advogado@test.com',
            telefone: '(84) 99999-9999',
            oab: '12345',
            estado,
            especialidade: 'Direito Civil'
          };

          // Act & Assert
          expect(() => advogadoSchema.parse(data)).not.toThrow();
        });
      });

      it('deve converter estado para maiúsculo', () => {
        // Arrange
        const data = {
          nome: 'João Silva',
          cpf: '123.456.789-01',
          email: 'advogado@test.com',
          telefone: '(84) 99999-9999',
          oab: '12345',
          estado: 'rn', // minúsculo
          especialidade: 'Direito Civil'
        };

        // Act
        const result = advogadoSchema.parse(data);

        // Assert
        expect(result.estado).toBe('RN');
      });

      it('deve rejeitar estados inválidos', () => {
        // Arrange
        const invalidStates = ['RNN', 'X', 'ABC', '12', ''];

        invalidStates.forEach(estado => {
          const data = {
            nome: 'João Silva',
            cpf: '123.456.789-01',
            email: 'advogado@test.com',
            telefone: '(84) 99999-9999',
            oab: '12345',
            estado,
            especialidade: 'Direito Civil'
          };

          // Act & Assert
          expect(() => advogadoSchema.parse(data)).toThrow('Estado deve ser a sigla com 2 letras');
        });
      });
    });
  });

  describe('validate middleware', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
      mockReq = createMockRequest();
      mockRes = createMockResponse();
      mockNext = jest.fn();
    });

    it('deve passar validação com dados corretos', () => {
      // Arrange
      const schema = z.object({
        name: z.string(),
        age: z.number()
      });
      
      mockReq.body = {
        name: 'João',
        age: 30
      };

      const middleware = validate(schema);

      // Act
      middleware(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('deve rejeitar dados inválidos', () => {
      // Arrange
      const schema = z.object({
        name: z.string(),
        age: z.number()
      });
      
      mockReq.body = {
        name: 123, // deveria ser string
        age: 'thirty' // deveria ser number
      };

      const middleware = validate(schema);

      // Act
      middleware(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Dados inválidos',
        details: expect.arrayContaining([
          expect.objectContaining({ field: 'name' }),
          expect.objectContaining({ field: 'age' })
        ])
      });
    });
  });
});