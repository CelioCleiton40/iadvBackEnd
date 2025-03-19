# API para Advogados - Documentação

## Autenticação

### Registro de Usuário
**POST** `/auth/register`

Registra um novo usuário no sistema.

**Corpo da Requisição:**
```json
{
  "name": "Nome Completo",
  "email": "email@exemplo.com",
  "password": "Senha123!",
  "cpf": "123.456.789-00",
  "oabNumber": "123456/SP",  // Opcional, apenas para advogados
  "role": "lawyer"           // Opcional, valores: "admin", "lawyer", "client"
}
```