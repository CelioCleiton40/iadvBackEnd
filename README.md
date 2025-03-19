## 🚀 **Descrição**
Este é um projeto backend desenvolvido em **Node.js** usando o framework **Fastify**.  
O sistema é projetado para lidar com **dados sensíveis** de advogados, clientes e documentos jurídicos, garantindo **alta segurança** e **resiliência** contra ataques externos.  



## 🏗️ **Estrutura de Pastas**

📂 project-root/
├── 📂 src/  
│   ├── 📂 config/  
│   │   ├── logger.ts              # Configuração de logs  
│   │   ├── rateLimit.ts           # Configuração de limite de requisições  
│   │   ├── security.ts            # Configurações de segurança (Helmet, CSP, WAF)  
│   │   ├── swagger.ts             # Configuração do Swagger  
│   │   └── env.ts                 # Variáveis de ambiente  
│   │
│   ├── 📂 modules/  
│   │   ├── auth/                  # Módulo de autenticação  
│   │   ├── user/                  # Módulo de usuários  
│   │   ├── oab/                   # Módulo para integração com a API da OAB  
│   │   └── datajud/               # Módulo para integração com a API DataJud  
│   │
│   ├── 📂 middleware/  
│   │   ├── authMiddleware.ts      # Middleware de autenticação  
│   │   ├── errorHandler.ts        # Middleware de tratamento de erros  
│   │   ├── requestLimiter.ts      # Middleware de limite de requisições  
│   │   └── securityHeaders.ts     # Middleware de headers de segurança  
│   │
│   ├── 📂 utils/  
│   │   ├── hash.ts                # Função de hashing  
│   │   ├── jwt.ts                 # Funções para JWT  
│   │   └── validator.ts           # Validações  
│   │
│   ├── 📂 tests/  
│   │   ├── auth.test.ts           # Testes de autenticação  
│   │   ├── user.test.ts           # Testes de usuário  
│   │   ├── oab.test.ts            # Testes da API OAB  
│   │   └── datajud.test.ts        # Testes da API DataJud  
│   │
│   ├── server.ts                  # Arquivo principal (Fastify)  
│   ├── app.ts                     # Inicialização da aplicação  
│   └── routes.ts                  # Definição das rotas globais  
│
├── 📂 docs/  
│   ├── api.md                     # Documentação da API  
│   └── swagger.yaml               # Documentação gerada automaticamente pelo Swagger  
│
├── .env                           # Variáveis de ambiente  
├── .env.example                   # Exemplo de variáveis de ambiente  
├── .gitignore                     # Arquivos ignorados pelo Git  
├── README.md                      # Documentação principal  
├── package.json                   # Configuração de dependências  
└── tsconfig.json                  # Configuração do TypeScript  


---

## 🛠️ **Instalação**
1. Clone o repositório:  

git clone https://github.com/celiocleiton40/aidvBackEnd.git


2. Instale as dependências:  

cd nome-do-projeto
npm install


3. Configure o arquivo `.env`:  
env
PORT=3000
DATABASE_URL=mongodb://localhost:27017/advogados
JWT_SECRET=sua-chave-secreta
RATE_LIMIT_MAX=100
RATE_LIMIT_TIME_WINDOW=1m

# API da OAB
OAB_API_URL=https://api.oab.org.br/v1
OAB_API_KEY=sua-chave-api-oab

# API do DataJud
DATAJUD_API_URL=https://datajud-wiki.cnj.jus.br/api-publica/acesso
DATAJUD_API_KEY=sua-chave-api-datajud


4. Inicie o projeto em modo desenvolvimento:  

npm run dev


5. Para rodar os testes:  

npm run test


---

## 🔒 **Segurança Implementada**
✅ Rate Limiting (100 requisições por minuto)  
✅ Proteção contra DDoS  
✅ Firewall de aplicação  
✅ Integração com API da **OAB**  
✅ Integração com API **DataJud**  
✅ Autenticação JWT com Refresh Token  
✅ Hashing de senhas com `bcrypt`  
✅ Desafio de CAPTCHA em endpoints sensíveis  

---

## 🌐 **Endpoints Principais**
| Método | Rota | Descrição |
|--------|-------|-----------|
| POST   | `/auth/register` | Registro de novo usuário |
| POST   | `/auth/login`    | Login com JWT |
| GET    | `/user/me`       | Dados do usuário autenticado |
| GET    | `/oab/validate`  | Validação de registro na OAB |
| GET    | `/datajud/search`| Consulta de processo público |
| GET    | `/datajud/cases`  | Listagem de processos públicos |
| GET    | `/datajud/cases/:id` | Detalhes de um processo público |
| GET    | `/datajud/cases/:id/documents` | Listagem de documentos de um processo público |
| GET    | `/datajud/magistrate` | Detalhes do magistrado |
---

## 📄 **Documentação com Swagger**
A documentação da API é gerada automaticamente com o Swagger.  
Para acessar a documentação interativa:  

➡️ **[http://localhost:3000/docs](http://localhost:3000/docs)**  

**Exemplo de configuração do Swagger:**

import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';

async function setupSwagger(fastify) {
  await fastify.register(fastifySwagger, {
    swagger: {
      info: {
        title: 'API para Advogados',
        description: 'Documentação da API para Advogados',
        version: '1.0.0'
      },
      host: 'localhost:3000',
      schemes: ['http'],
      consumes: ['application/json'],
      produces: ['application/json']
    }
  });

  await fastify.register(fastifySwaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false
    }
  });
}


---

## ✅ **Testes**
✅ Testes de integração  
✅ Testes de autenticação  
✅ Testes de segurança  
✅ Testes de consulta de API externa  

---

## 🔥 **Melhorias Futuras**
✅ Configurar suporte para **OAuth**  
✅ Configurar permissões baseadas em **RBAC**  
✅ Implementar logs avançados com **Grafana**  

---

## 👨‍💻 **Contribuição**
Se você deseja contribuir, abra um **Pull Request** ou reporte um bug em **Issues**.

---

## 📜 **Licença**
Este projeto está licenciado sob a licença **MIT**.

---

## 🚀 **Autor**
- **Célio Cleiton** – [GitHub](https://github.com/celiocleiton40