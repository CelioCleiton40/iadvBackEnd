# 📋 API de Processos - Integração DataJud CNJ

*"Documentação é como um mapa do multiverso - sem ela, você está perdido em dimensões infinitas de código."* - Rick Sanchez

## 🎯 Visão Geral

A API de Processos do iAdv Backend oferece integração completa com a **API Pública do DataJud CNJ**, permitindo:

- 🔍 **Busca de processos** diretamente na base nacional do CNJ
- 💾 **Cache inteligente** no banco local para performance
- 📊 **Listagem paginada** dos processos salvos
- 🔒 **Autenticação JWT** obrigatória
- ✅ **Validação rigorosa** de números de processo CNJ

---

## 🔐 Autenticação

Todas as rotas requerem autenticação JWT:

```http
Authorization: Bearer <seu_jwt_token>
```

---

## 📍 Endpoints Disponíveis

### 1. 🔍 Buscar Processo no DataJud CNJ

**Busca um processo na API pública do CNJ e salva no banco local**

```http
GET /api/processos/_search/{numeroProcesso}
```

#### Parâmetros:
- `numeroProcesso` (string, obrigatório): Número do processo no formato CNJ
  - **Formato:** `0000000-00.0000.0.00.0000`
  - **Exemplo:** `1234567-89.2024.8.26.0001`

#### Resposta de Sucesso (200):
```json
{
  "success": true,
  "message": "Processo encontrado com sucesso",
  "data": {
    "numeroProcesso": "1234567-89.2024.8.26.0001",
    "tribunal": "TJSP",
    "classe": "Procedimento Comum Cível",
    "grau": "1º Grau",
    "dataAjuizamento": "2024-01-15",
    "ultimaAtualizacao": "2024-01-20",
    "assuntos": ["Direito Civil", "Responsabilidade Civil"],
    "ultimoAndamento": {
      "dataHora": "2024-01-20T10:30:00Z",
      "descricao": "Processo distribuído"
    },
    "resultado": "Em andamento",
    "transitoEmJulgado": null,
    "ultimaConsulta": "2025-01-31T12:00:00Z"
  }
}
```

#### Possíveis Erros:
- **400 Bad Request**: Número de processo inválido
- **404 Not Found**: Processo não encontrado no DataJud CNJ
- **408 Request Timeout**: Timeout na consulta ao CNJ
- **429 Too Many Requests**: Limite de requisições excedido
- **500 Internal Server Error**: Erro interno

---

### 2. 📋 Listar Processos Salvos

**Lista processos salvos no banco local com paginação**

```http
GET /api/processos
```

#### Query Parameters (opcionais):
- `page` (number): Página (padrão: 1)
- `limit` (number): Itens por página (padrão: 10, máximo: 100)
- `numeroProcesso` (string): Filtrar por número específico

#### Exemplo de Requisição:
```http
GET /api/processos?page=1&limit=5&numeroProcesso=1234567
```

#### Resposta de Sucesso (200):
```json
{
  "success": true,
  "message": "2 processos encontrados",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "numeroProcesso": "1234567-89.2024.8.26.0001",
      "tribunal": "TJSP",
      "classe": "Procedimento Comum Cível",
      "grau": "1º Grau",
      "dataAjuizamento": "2024-01-15",
      "ultimaAtualizacao": "2024-01-20",
      "assuntos": ["Direito Civil"],
      "ultimoAndamento": {
        "dataHora": "2024-01-20T10:30:00Z",
        "descricao": "Processo distribuído"
      }
    }
  ],
  "total": 2,
  "page": 1,
  "limit": 5,
  "totalPages": 1
}
```

---

### 3. 📄 Obter Processo Específico

**Obtém um processo específico do banco local**

```http
GET /api/processos/{numeroProcesso}
```

#### Resposta de Sucesso (200):
```json
{
  "numeroProcesso": "1234567-89.2024.8.26.0001",
  "tribunal": "TJSP",
  "classe": "Procedimento Comum Cível",
  // ... outros campos
}
```

#### Possíveis Erros:
- **404 Not Found**: Processo não encontrado no banco local

---

### 4. 💾 Salvar Processo

**Salva ou atualiza um processo no banco local**

```http
POST /api/processos
```

#### Body (JSON):
```json
{
  "numeroProcesso": "1234567-89.2024.8.26.0001",
  "tribunal": "TJSP",
  "classe": "Procedimento Comum Cível",
  "grau": "1º Grau",
  "dataAjuizamento": "2024-01-15",
  "ultimaAtualizacao": "2024-01-20",
  "assuntos": ["Direito Civil"],
  "ultimoAndamento": {
    "dataHora": "2024-01-20T10:30:00Z",
    "descricao": "Processo distribuído"
  }
}
```

---

### 5. 🗑️ Remover Processo

**Remove um processo do banco local**

```http
DELETE /api/processos/{numeroProcesso}
```

#### Resposta de Sucesso (200):
```json
{
  "message": "Processo removido com sucesso"
}
```

---

## 🔧 Validações

### Formato do Número de Processo CNJ

O número deve seguir o padrão oficial do CNJ:

```
NNNNNNN-DD.AAAA.J.TR.OOOO
```

Onde:
- **NNNNNNN**: Número sequencial (7 dígitos)
- **DD**: Dígito verificador (2 dígitos)
- **AAAA**: Ano do ajuizamento (4 dígitos)
- **J**: Segmento do Poder Judiciário (1 dígito)
- **TR**: Tribunal (2 dígitos)
- **OOOO**: Origem (4 dígitos)

**Exemplos válidos:**
- `1234567-89.2024.8.26.0001`
- `0000001-23.2023.1.02.0001`
- `9876543-21.2025.4.05.0123`

---

## 🚀 Exemplos de Uso

### JavaScript/TypeScript (Frontend)

```typescript
// Buscar processo no CNJ
const buscarProcesso = async (numeroProcesso: string) => {
  try {
    const response = await fetch(
      `http://localhost:3001/api/processos/_search/${numeroProcesso}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Processo não encontrado');
    }
    
    const data = await response.json();
    return data.data; // ProcessoSlim
  } catch (error) {
    console.error('Erro ao buscar processo:', error);
    throw error;
  }
};

// Listar processos com paginação
const listarProcessos = async (page = 1, limit = 10) => {
  const response = await fetch(
    `http://localhost:3001/api/processos?page=${page}&limit=${limit}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  return response.json();
};
```

### cURL

```bash
# Buscar processo
curl -X GET "http://localhost:3001/api/processos/_search/1234567-89.2024.8.26.0001" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"

# Listar processos
curl -X GET "http://localhost:3001/api/processos?page=1&limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

---

## 🎯 Fluxo Recomendado

1. **Busca Inicial**: Use `GET /api/processos/_search/{numero}` para buscar na API do CNJ
2. **Cache Local**: O processo é automaticamente salvo no banco local
3. **Consultas Subsequentes**: Use `GET /api/processos/{numero}` para acessar dados do cache
4. **Listagem**: Use `GET /api/processos` para listar todos os processos salvos
5. **Atualização**: Repita a busca no CNJ quando necessário atualizar dados

---

## ⚡ Performance e Cache

- **Cache Inteligente**: Processos são salvos localmente após primeira consulta
- **Timestamp de Consulta**: Campo `ultimaConsulta` registra quando foi buscado no CNJ
- **Consulta Rápida**: Dados locais são retornados instantaneamente
- **Atualização Manual**: Nova busca no CNJ sobrescreve dados locais

---

## 🔒 Segurança

- ✅ **Autenticação JWT obrigatória**
- ✅ **Validação rigorosa de entrada**
- ✅ **Rate limiting** aplicado
- ✅ **Headers de segurança** configurados
- ✅ **Logs detalhados** para auditoria
- ✅ **Sanitização de dados**

---

## 🐛 Troubleshooting

### Erro 400 - Número de processo inválido
```json
{
  "error": "Número de processo inválido. Use o formato: 0000000-00.0000.0.00.0000"
}
```
**Solução**: Verifique se o número segue o formato CNJ correto.

### Erro 404 - Processo não encontrado
```json
{
  "error": "Processo não encontrado no DataJud CNJ."
}
```
**Solução**: O processo pode não existir na base do CNJ ou estar com número incorreto.

### Erro 408 - Timeout
```json
{
  "error": "Timeout na consulta. Tente novamente."
}
```
**Solução**: A API do CNJ pode estar lenta. Tente novamente em alguns segundos.

### Erro 429 - Rate Limit
```json
{
  "error": "Limite de requisições excedido. Tente novamente mais tarde."
}
```
**Solução**: Aguarde alguns minutos antes de fazer novas requisições.

---

## 📊 Monitoramento

Todos os acessos são logados com:
- Timestamp da requisição
- Usuário autenticado
- Número do processo consultado
- Resultado da operação
- Tempo de resposta

Logs podem ser encontrados em: `logs/application-YYYY-MM-DD.log`

---

*Wubba lubba dub dub! 🚀 A integração com o DataJud CNJ está pronta para dominar o multiverso jurídico!*