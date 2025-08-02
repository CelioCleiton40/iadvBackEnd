# **iAdv BackEnd - Sistema de Gestão para Advogados**

O **iAdv BackEnd** é a camada de API responsável por fornecer endpoints RESTful para o sistema de gestão voltado a advogados e escritórios de advocacia. Ele gerencia operações relacionadas a clientes, processos, prazos, finanças e outros recursos essenciais.

---

## **Funcionalidades Principais**

- 📊 **Dashboard**: Fornece métricas importantes via endpoints.
- 👥 **Gestão de Clientes**: CRUD completo para cadastro e gerenciamento de clientes.
- 📁 **Controle de Processos**: Gerenciamento de processos jurídicos.
- 📅 **Agenda e Prazos**: Manipulação de datas e prazos.
- 💰 **Gestão Financeira**: Registro e controle de transações financeiras.
- 📄 **Gerenciamento de Documentos**: Upload e recuperação de documentos.
- ⚖️ **Análise de Magistrados**: Integração com dados de magistrados e tribunais.

---

## 📊 Dados Extraídos

### 📈 TRF5 (Tribunal Regional Federal da 5ª Região)
- **24 desembargadores** federais
- **Localização**: Recife/PE (jurisdição sobre RN)
- **Competência**: Federal (2º grau - recursos)
- **Estrutura**: Plenário + 3 Seções + 7 Turmas
- **Jurisdição**: AL, CE, PB, PE, RN, SE

### 🏛️ JFRN (Justiça Federal do RN)
- **34 magistrados** federais (Varas + JEFs + Turma Recursal)
- **6 localidades**: Natal, Mossoró, Caicó, Assú, Pau dos Ferros, Ceará-Mirim
- **Competência**: Federal (1º grau + Recursal)

### ⚖️ TJRN (Tribunal de Justiça do RN)
- **23 magistrados** estaduais
- **Localização**: Natal/RN
- **Competência**: Estadual (crimes comuns, família, cível)

### 🗳️ TRE-RN (Tribunal Regional Eleitoral do RN)
- **16 magistrados** eleitorais
- **Localização**: Natal/RN
- **Competência**: Eleitoral (eleições, partidos, propaganda)

### 👷 TRT21 (Tribunal Regional do Trabalho da 21ª Região)
- **20 magistrados** trabalhistas
- **4 localidades**: Natal, Mossoró, Currais Novos, Goianinha, Macau
- **Competência**: Trabalhista (CLT, sindicatos)
- **Descoberta especial**: 🎯 **Juíza Simone Medeiros Jalil** encontrada!

### 🏆 **TOTAL: 117 magistrados** cobrindo **TODOS** os tribunais do sistema judiciário do RN

```bash
# Extrair magistrados de todos os tribunais
node scripts/scrapers/scraper-stm-magistrados.js    # Militar (Superior)
node scripts/scrapers/scraper-trf5-magistrados.js   # Federal 2º grau
node scripts/scrapers/scraper-jfrn-magistrados.js   # Federal 1º grau
node scripts/scrapers/scraper-tjrn-magistrados.js   # Estadual
node scripts/scrapers/scraper-tre-rn-magistrados.js # Eleitoral
node scripts/scrapers/scraper-trt21-magistrados.js  # Trabalhista

# Listar magistrados por tribunal
node scripts/scrapers/scraper-stm-magistrados.js list
node scripts/scrapers/scraper-trf5-magistrados.js list
node scripts/scrapers/scraper-jfrn-magistrados.js list
node scripts/scrapers/scraper-tjrn-magistrados.js list
node scripts/scrapers/scraper-tre-rn-magistrados.js list
node scripts/scrapers/scraper-trt21-magistrados.js list

# Comparar TODOS os tribunais
node scripts/scrapers/scraper-stm-magistrados.js compare

# Listar TODOS os magistrados do RN
node scripts/listar-todos-juizes-rn.js stats
```

---

## **Tecnologias Utilizadas**

- **Node.js 18.17 ou superior**
- **Express** - Framework web para construção de APIs
- **MongoDB** - Banco de dados NoSQL para armazenamento de dados
- **JWT** - Autenticação segura baseada em tokens
- **Bcrypt** - Criptografia de senhas
- **Zod** - Validação e sanitização de dados
- **Winston** - Sistema de logs para monitoramento e depuração

---

## **Requisitos**

- Node.js (versão 18.17 ou superior)
- MongoDB (instância local ou remota)
- npm ou yarn

---

## **Instalação**

```bash
# Clone o repositório
git clone https://github.com/CelioCleiton40/iadvBackEnd.git

# Entre no diretório
cd iadvBackEnd

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

O servidor estará disponível em: **http://localhost:5000**

---

## **API Endpoints**

### **Autenticação**
- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Autenticar usuário

### **Clientes**
- `GET /api/clients` - Listar todos os clientes
- `GET /api/clients/:id` - Buscar cliente por ID
- `POST /api/clients` - Cadastrar novo cliente
- `PUT /api/clients/:id` - Atualizar dados de um cliente
- `DELETE /api/clients/:id` - Remover um cliente

### **Processos (Integração DataJud CNJ)**
- `GET /api/processos` - Listar processos salvos (com paginação)
- `GET /api/processos/_search/:numeroProcesso` - Buscar processo na API CNJ e salvar
- `GET /api/processos/:numeroProcesso` - Obter processo específico do banco local
- `POST /api/processos` - Salvar processo no banco local
- `DELETE /api/processos/:numeroProcesso` - Remover processo do banco local

> 📋 **Documentação completa**: [API_PROCESSOS.md](./docs/API_PROCESSOS.md)

### **Finanças**
- `GET /api/finances` - Listar todas as transações financeiras
- `GET /api/finances/:id` - Buscar transação por ID
- `POST /api/finances` - Registrar nova transação
- `PUT /api/finances/:id` - Atualizar transação
- `DELETE /api/finances/:id` - Remover transação

### **Documentos**
- `POST /api/documents/upload` - Fazer upload de um documento
- `GET /api/documents/:id` - Recuperar um documento por ID
- `DELETE /api/documents/:id` - Remover um documento

---

## **Segurança 🔒**

- **Autenticação JWT**: Proteção de rotas sensíveis com tokens de autenticação.
- **Criptografia de Senhas**: Senhas são criptografadas usando `bcrypt`.
- **Validação de Dados**: Entradas são validadas e sanitizadas com `Zod` para evitar injeções e dados malformados.
- **Proteção contra Ataques Comuns**: Implementação de medidas contra ataques como XSS, CSRF e SQL Injection.
- **Logs Detalhados**: Todos os erros e atividades críticas são registrados para monitoramento.

---

## **Estrutura do Projeto**

```
iadvBackEnd/
├── src/
│   ├── config/         # Configurações globais (banco de dados, variáveis de ambiente, etc.)
│   ├── controllers/    # Controladores que lidam com as requisições HTTP
│   ├── middleware/     # Middlewares personalizados (autenticação, validação, etc.)
│   ├── models/         # Modelos de dados para interação com o MongoDB
│   ├── routes/         # Definição das rotas da API
│   ├── schemas/        # Schemas de validação de dados (usando Zod)
│   ├── security/         # Definição das rotas da API
│   ├── services/       # Lógica de negócio e interação com o banco de dados
│   ├── types/          # Tipagens TypeScript para garantir segurança de tipos
│   ├── utils/          # Funções utilitárias reutilizáveis
│   ├── app.ts          # Configuração inicial da aplicação
│   └── services.ts     # Ponto de entrada principal da API
├── .env                # Variáveis de ambiente (não incluir no git)
├── .gitignore          # Arquivos ignorados pelo Git
└── package.json        # Dependências e scripts do projeto

---

## **Testes**

Para executar os testes automatizados:

```bash
npm test
```

> **Dica:** Certifique-se de que todas as dependências estão instaladas antes de rodar os testes.

---

## **Licença 📄**

Este projeto está sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## **Autor 👤**

Desenvolvido por **Célio Cleiton**.

- LinkedIn: [Célio Cleiton](https://www.linkedin.com/in/celio-cleiton)
- GitHub: [@celio-cleiton40](https://github.com/CelioCleiton40)

---

## **Contribuição 🤝**

Contribuições são sempre bem-vindas! Por favor, siga as etapas abaixo:

1. Faça um fork do repositório.
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`).
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`).
4. Push para a branch (`git push origin feature/nova-feature`).
5. Abra um Pull Request detalhando suas alterações.

---

## **Suporte 📞**

Para suporte, envie um email para **cleitonfreelance@gmail.com** ou abra uma issue no GitHub.

---

### **Desenvolvido com ❤️ por Célio Cleiton**

---