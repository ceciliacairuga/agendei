# Agendei — Web Service API

API RESTful para o sistema de agendamentos **Agendei**, construída em PHP com autenticação via JWT.

---

## Sumário

- [Configuração](#configuração)
- [Autenticação JWT](#autenticação-jwt)
- [Tipos de Usuário](#tipos-de-usuário)
- [Códigos HTTP Utilizados](#códigos-http-utilizados)
- [Rotas](#rotas)
  - [Hello / Health Check](#hello--health-check)
  - [Users — Entidade Principal](#users--entidade-principal)
  - [User Types](#user-types)
  - [Services — Entidade Secundária](#services--entidade-secundária)
  - [Services Type](#services-type)
  - [Appointments](#appointments)
  - [FAQs Categories](#faqs-categories)
  - [FAQs](#faqs)
- [Testando no Postman](#testando-no-postman)

---

## Configuração

1. Copie `.env-sample` para `.env` e ajuste as variáveis (banco, URL base).
2. Ajuste `source/Config/Config.php` com os dados do banco e URL:

```php
const CONF_URL_BASE = "http://localhost/agendei";
const CONF_DB_HOST  = "localhost";
const CONF_DB_NAME  = "agendei";
const CONF_DB_USER  = "root";
const CONF_DB_PASS  = "";
const CONF_DB_PORT  = "3306";
const JWT_SECRET_KEY = "sua_chave_secreta_aqui";
```

3. Importe o banco de dados: `data-base/AGENDEI DB.sql`
4. Instale as dependências: `composer install`

Base URL de todas as rotas: `http://localhost/agendei/api`

---

## Autenticação JWT

Rotas protegidas exigem um token JWT no header da requisição:

```
Authorization: Bearer <token>
```

O token é retornado nas rotas de login. Ele expira em **90 minutos**.

**Níveis de acesso:**
- `type_id = 1` → **Admin**
- `type_id = 2` → **Usuário comum**

---

## Tipos de Usuário

| type_id | Descrição     |
|---------|---------------|
| 1       | Administrador |
| 2       | Usuário comum |

---

## Códigos HTTP Utilizados

| Código | Significado                        |
|--------|------------------------------------|
| 200    | Sucesso                            |
| 201    | Criado com sucesso                 |
| 400    | Requisição inválida (bad request)  |
| 401    | Não autorizado (token ausente/inválido) |
| 404    | Recurso não encontrado             |
| 500    | Erro interno do servidor           |

---

## Rotas

### Hello / Health Check

#### `GET /hello`
Verifica se a API está ativa.

**Resposta 200:**
```json
{
  "code": 200,
  "type": "success",
  "status": "success",
  "message": "API ativa",
  "data": { "message": "hello", "environment": "agendei/api" }
}
```

---

### Users — Entidade Principal

#### `POST /users/register`
Registrar novo usuário comum. **Público.**

**Body (JSON):**
```json
{ "name": "João Silva", "email": "joao@email.com", "password": "senha123" }
```
**Resposta 201:**
```json
{
  "code": 201,
  "status": "created",
  "data": { "id": 5, "name": "João Silva", "email": "joao@email.com" }
}
```

---

#### `POST /users/login`
Login de usuário comum. **Público.** Retorna o token JWT.

**Body (JSON):**
```json
{ "email": "joao@email.com", "password": "senha123" }
```
**Resposta 200:**
```json
{
  "code": 200,
  "status": "success",
  "data": {
    "id": 5,
    "name": "João Silva",
    "photo": null,
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9..."
  }
}
```

---

#### `POST /users/register-admin`
Registrar novo admin. **Requer token de admin.**

**Headers:** `Authorization: Bearer <token_admin>`

**Body (JSON):**
```json
{ "name": "Admin Master", "email": "admin@email.com", "password": "senha123" }
```

---

#### `POST /users/login-admin`
Login de usuário admin. **Público.**

**Body (JSON):**
```json
{ "email": "admin@email.com", "password": "senha123" }
```

---

#### `GET /users/list`
Listar todos os usuários. **Requer token de admin.**

**Headers:** `Authorization: Bearer <token_admin>`

**Resposta 200:**
```json
{
  "code": 200,
  "status": "success",
  "data": [ { "id": 1, "type_id": 1, "name": "Admin", "email": "admin@email.com" } ]
}
```

---

#### `GET /users/list/{userId}`
Buscar usuário por ID. **Requer token de admin.**

**Parâmetro:** `userId` (inteiro)

**Resposta 200:**
```json
{
  "code": 200,
  "data": { "id": 1, "typeId": 1, "name": "Admin", "email": "admin@email.com", "photo": null }
}
```

---

#### `GET /users/list/paginator/{page}/{per_page}`
Lista paginada de usuários. **Requer token de admin.**

**Parâmetros:** `page` (int), `per_page` (int)

**Exemplo:** `GET /users/list/paginator/1/10`

**Resposta 200:**
```json
{
  "code": 200,
  "data": {
    "page": 1,
    "perPage": 10,
    "total": 25,
    "data": [ { "id": 1, "name": "..." } ]
  }
}
```

---

#### `PUT /users/update`
Atualiza dados do próprio usuário logado. **Requer token de usuário comum.**

**Headers:** `Authorization: Bearer <token_usuario>`

**Body (JSON):** *(campos opcionais)*
```json
{ "name": "Novo Nome", "photo": "foto.jpg" }
```

---

#### `PUT /users/update-admin`
Atualiza dados do próprio admin logado. **Requer token de admin.**

**Headers:** `Authorization: Bearer <token_admin>`

**Body (JSON):** *(campos opcionais)*
```json
{ "name": "Admin Atualizado" }
```

---

#### `DELETE /users/{userId}`
Desativa (soft delete) um usuário. **Requer token de admin.**

**Parâmetro:** `userId` (inteiro)

**Resposta 200:**
```json
{ "code": 200, "status": "success", "message": "Usuário desativado com sucesso." }
```

---

### User Types

Gerencia os tipos de usuário (`users_types`). **CRUD completo.**

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/user-types/list` | Público | Listar todos |
| GET | `/user-types/list/{user_type_id}` | Público | Buscar por ID |
| GET | `/user-types/list/paginator/{page}/{per_page}` | Público | Paginação |
| POST | `/user-types/` | Admin | Inserir |
| PUT | `/user-types/{user_type_id}` | Admin | Atualizar |
| DELETE | `/user-types/{user_type_id}` | Admin | Remover (soft) |

**Body POST/PUT:**
```json
{ "name": "Parceiro" }
```

---

### Services — Entidade Secundária

CRUD completo de serviços. Listagem pública; inserção/edição/exclusão requer admin.

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/services/list` | Público | Listar todos |
| GET | `/services/list/{service_id}` | Público | Buscar por ID |
| GET | `/services/list/paginator/{page}/{per_page}` | Público | Paginação |
| POST | `/services/` | Admin | Inserir |
| PUT | `/services/{service_id}` | Admin | Atualizar |
| DELETE | `/services/{service_id}` | Admin | Soft delete |

**Body POST (todos os campos obrigatórios):**
```json
{
  "services_type_id": 1,
  "name": "Corte de Cabelo",
  "description": "Corte masculino",
  "duration": 30,
  "price": 45.00
}
```

**Body PUT (campos opcionais):**
```json
{ "name": "Corte Premium", "price": 55.00 }
```

**Resposta GET /services/list/1:**
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "servicesTypeId": 2,
    "name": "Corte de Cabelo",
    "description": "Corte masculino",
    "duration": 30,
    "price": 45
  }
}
```

---

### Services Type

Tipos de serviço. Mesma estrutura de rotas que Services.

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/services-type/list` | Público | Listar todos |
| GET | `/services-type/list/{services_type_id}` | Público | Buscar por ID |
| GET | `/services-type/list/paginator/{page}/{per_page}` | Público | Paginação |
| POST | `/services-type/` | Admin | Inserir |
| PUT | `/services-type/{services_type_id}` | Admin | Atualizar |
| DELETE | `/services-type/{services_type_id}` | Admin | Remover |

**Body POST/PUT:**
```json
{ "name": "Estética" }
```

---

### Appointments

Agendamentos. Inserção requer usuário autenticado; edição/exclusão requer admin.

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/appointments/list` | Público | Listar todos |
| GET | `/appointments/list/{appointment_id}` | Público | Buscar por ID |
| GET | `/appointments/list/paginator/{page}/{per_page}` | Público | Paginação |
| POST | `/appointments/` | Usuário (type 2) | Inserir |
| PUT | `/appointments/{appointment_id}` | Admin | Atualizar |
| DELETE | `/appointments/{appointment_id}` | Admin | Remover |

**Body POST:**
```json
{
  "service_id": 1,
  "appointment_date": "2026-07-15",
  "appointment_time": "14:30:00",
  "status": "pending"
}
```
> O `user_id` é extraído automaticamente do token JWT.

**Status válidos:** `pending` | `confirmed` | `completed` | `cancelled`

**Body PUT (campos opcionais):**
```json
{ "status": "confirmed", "appointment_time": "15:00:00" }
```

---

### FAQs Categories

Categorias de perguntas frequentes.

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/faqs-categories/list` | Público | Listar todas |
| GET | `/faqs-categories/list/{category_id}` | Público | Buscar por ID |
| GET | `/faqs-categories/list/paginator/{page}/{per_page}` | Público | Paginação |
| POST | `/faqs-categories/` | Admin | Inserir |
| PUT | `/faqs-categories/{category_id}` | Admin | Atualizar |
| DELETE | `/faqs-categories/{category_id}` | Admin | Remover* |

> \* A remoção falha com `400` se a categoria possuir FAQs ativos vinculados.

**Body POST/PUT:**
```json
{ "name": "Pagamentos" }
```

---

### FAQs

Perguntas frequentes.

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/faqs/list` | Público | Listar todos |
| GET | `/faqs/list/{faq_id}` | Público | Buscar por ID |
| GET | `/faqs/list/paginator/{page}/{per_page}` | Público | Paginação |
| POST | `/faqs/` | Admin | Inserir |
| PUT | `/faqs/{faq_id}` | Admin | Atualizar |
| DELETE | `/faqs/{faq_id}` | Admin | Soft delete |

**Body POST:**
```json
{
  "faqs_category_id": 1,
  "question": "Como cancelo meu agendamento?",
  "answer": "Acesse sua conta e clique em Cancelar na tela de agendamentos."
}
```

**Body PUT (campos opcionais):**
```json
{ "answer": "Nova resposta atualizada." }
```

---

## Testando no Postman

### 1. Configuração inicial

1. Abra o Postman e crie uma **Collection** chamada `Agendei API`.
2. Nas **Collection Variables**, adicione:
   - `base_url` → `http://localhost/agendei/api`
   - `token_user` → *(preenchido após login)*
   - `token_admin` → *(preenchido após login admin)*

Use `{{base_url}}` em todas as URLs.

---

### 2. Fluxo de teste recomendado

#### Passo 1 — Verificar se a API está ativa
```
GET {{base_url}}/hello
```
Esperado: `200 OK`

---

#### Passo 2 — Registrar um usuário comum
```
POST {{base_url}}/users/register
Content-Type: application/json

{
  "name": "João Teste",
  "email": "joao@teste.com",
  "password": "123456"
}
```
Esperado: `201 Created`

---

#### Passo 3 — Fazer login e capturar o token
```
POST {{base_url}}/users/login
Content-Type: application/json

{
  "email": "joao@teste.com",
  "password": "123456"
}
```
Copie o campo `token` da resposta e salve em `token_user`.

**Dica Postman:** na aba **Tests** da requisição, cole o script abaixo para salvar o token automaticamente:
```javascript
const json = pm.response.json();
if (json.data && json.data.token) {
    pm.collectionVariables.set("token_user", json.data.token);
}
```

---

#### Passo 4 — Fazer login como admin
```
POST {{base_url}}/users/login-admin
Content-Type: application/json

{
  "email": "admin@agendei.com",
  "password": "admin123"
}
```
Salve o token em `token_admin` da mesma forma.

---

#### Passo 5 — Usar token em rotas protegidas

Em cada requisição que exige autenticação, vá na aba **Authorization** e escolha:
- Type: `Bearer Token`
- Token: `{{token_admin}}` ou `{{token_user}}`

Ou manualmente no header:
```
Authorization: Bearer {{token_admin}}
```

---

#### Passo 6 — Criar um tipo de serviço (admin)
```
POST {{base_url}}/services-type/
Authorization: Bearer {{token_admin}}
Content-Type: application/json

{ "name": "Beleza" }
```

---

#### Passo 7 — Criar um serviço (admin)
```
POST {{base_url}}/services/
Authorization: Bearer {{token_admin}}
Content-Type: application/json

{
  "services_type_id": 1,
  "name": "Corte de Cabelo",
  "description": "Corte masculino completo",
  "duration": 30,
  "price": 45.00
}
```

---

#### Passo 8 — Fazer um agendamento (usuário comum)
```
POST {{base_url}}/appointments/
Authorization: Bearer {{token_user}}
Content-Type: application/json

{
  "service_id": 1,
  "appointment_date": "2026-07-20",
  "appointment_time": "10:00:00",
  "status": "pending"
}
```

---

#### Passo 9 — Listar agendamentos
```
GET {{base_url}}/appointments/list
```

---

#### Passo 10 — Testar paginação
```
GET {{base_url}}/services/list/paginator/1/5
```

---

### 3. Erros comuns e como resolver

| Erro | Causa | Solução |
|------|-------|---------|
| `401 unauthorized` | Token ausente ou expirado | Faça login novamente e atualize o token |
| `400 bad_request` | Campos obrigatórios faltando | Verifique o body da requisição |
| `404 not_found` | ID inexistente | Verifique o ID enviado |
| `500 internal_server_error` | Erro no banco de dados | Verifique a conexão com o MySQL |

