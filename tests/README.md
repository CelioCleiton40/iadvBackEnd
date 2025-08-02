# Testes do iAdv Backend

*"Testing is like debugging, but for people who actually know what they're doing."* - Rick Sanchez (provavelmente)

## Estrutura dos Testes

Os testes estão organizados por camadas e responsabilidades:

```
tests/
├── setup.ts                    # Configuração global dos testes
├── utils/
│   ├── testHelpers.ts          # Utilitários e mocks reutilizáveis
│   └── validation.test.ts      # Testes de validação
├── security/
│   ├── jwt.test.ts             # Testes de JWT
│   └── encryption.test.ts      # Testes de criptografia
├── middlewares/
│   ├── authMiddleware.test.ts  # Testes de autenticação
│   └── validateRequest.test.ts # Testes de validação de requisições
├── services/
│   ├── authService.test.ts     # Testes do serviço de autenticação
│   └── processoService.test.ts # Testes do serviço de processos
├── controllers/
│   └── authController.test.ts  # Testes do controller de autenticação
└── integration/
    └── auth.integration.test.ts # Testes de integração
```

## Scripts de Teste

### Executar Todos os Testes
```bash
npm test
```

### Executar Testes em Modo Watch
```bash
npm run test:watch
```

### Executar Testes com Coverage
```bash
npm run test:coverage
```

### Executar Testes para CI/CD
```bash
npm run test:ci
```

### Executar Testes por Categoria

#### Testes Unitários (excluindo integração)
```bash
npm run test:unit
```

#### Testes de Integração
```bash
npm run test:integration
```

#### Testes de Segurança
```bash
npm run test:security
```

#### Testes de Serviços
```bash
npm run test:services
```

#### Testes de Controllers
```bash
npm run test:controllers
```

#### Testes de Middlewares
```bash
npm run test:middlewares
```

## Configuração

### Jest
O Jest está configurado com:
- **TypeScript**: Suporte completo via `ts-jest`
- **Coverage**: Relatórios em HTML, LCOV e texto
- **Thresholds**: 80% de cobertura mínima
- **Timeout**: 10 segundos para testes assíncronos
- **Setup**: Configuração global em `tests/setup.ts`

### Mocks
Todos os módulos externos são mockados:
- **MongoDB**: Mock completo do driver
- **Logger**: Mock do Winston
- **Variáveis de Ambiente**: Configuração específica para testes

### Variáveis de Ambiente
Os testes usam o arquivo `.env.test` com configurações específicas:
- Banco de dados de teste
- JWT secret para testes
- APIs externas mockadas
- Logs silenciosos

## Padrões de Teste

### Estrutura AAA (Arrange, Act, Assert)
Todos os testes seguem o padrão:
```typescript
it('deve fazer algo específico', async () => {
  // Arrange - Preparar dados e mocks
  const mockData = createMockData();
  
  // Act - Executar a ação
  const result = await functionUnderTest(mockData);
  
  // Assert - Verificar resultados
  expect(result).toEqual(expectedResult);
});
```

### Nomenclatura
- **Describe**: Agrupa testes por funcionalidade
- **It**: Descreve comportamento específico
- **Mocks**: Prefixo `mock` para variáveis mockadas
- **Helpers**: Funções utilitárias em `testHelpers.ts`

### Cobertura de Casos
Cada módulo testa:
- ✅ **Casos de Sucesso**: Fluxo normal
- ✅ **Validação de Entrada**: Dados inválidos
- ✅ **Tratamento de Erros**: Cenários de falha
- ✅ **Casos Extremos**: Limites e edge cases
- ✅ **Segurança**: Validações de segurança
- ✅ **Performance**: Tempos de resposta

## Utilitários de Teste

### Test Helpers
O arquivo `testHelpers.ts` fornece:
- **Mocks**: Request, Response, User, Processo, etc.
- **Geradores**: Dados aleatórios para testes
- **Validadores**: Funções de validação
- **Helpers**: Funções utilitárias

### Exemplo de Uso
```typescript
import { createMockUser, createMockRequest, expectAsyncError } from '../utils/testHelpers';

it('deve testar algo', async () => {
  const mockUser = createMockUser({ role: 'advogado' });
  const mockReq = createMockRequest({ body: { data: 'test' } });
  
  await expectAsyncError(
    () => functionThatShouldFail(),
    'Expected error message'
  );
});
```

## Melhores Práticas

### 1. Isolamento
- Cada teste é independente
- Mocks são limpos entre testes
- Sem dependências externas reais

### 2. Clareza
- Nomes descritivos para testes
- Comentários explicando cenários complexos
- Estrutura consistente

### 3. Cobertura
- Testes para todos os caminhos de código
- Validação de entrada e saída
- Tratamento de erros

### 4. Performance
- Testes rápidos (< 10s cada)
- Mocks eficientes
- Paralelização quando possível

### 5. Manutenibilidade
- Helpers reutilizáveis
- Mocks centralizados
- Configuração consistente

## Debugging

### Executar Teste Específico
```bash
npx jest auth.test.ts
```

### Debug com Logs
```bash
npx jest --verbose auth.test.ts
```

### Debug no VS Code
Configuração no `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## Métricas de Qualidade

### Coverage Targets
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

### Relatórios
Após executar `npm run test:coverage`:
- **HTML**: `coverage/lcov-report/index.html`
- **LCOV**: `coverage/lcov.info`
- **Console**: Resumo no terminal

## Integração Contínua

Para CI/CD, use:
```bash
npm run test:ci
```

Este comando:
- Executa todos os testes
- Gera relatório de cobertura
- Não fica em modo watch
- Adequado para pipelines automatizados

---

*"Remember Morty, good tests are like good science - reproducible, reliable, and they don't lie to you."* 🧪