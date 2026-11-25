# Agendei — Sistema de agendamentos para salão de beleza

Sistema web com **área do cliente** e **painel administrativo** para gerenciar serviços, usuários e agendamentos de um salão.
Projeto da disciplina de Programação Web II (SE2 — Etapas 06 e 07).

---

## 1. Tecnologias

| Camada | Tecnologia |
|---|---|
| Back-end | PHP 8.1, PDO (prepared statements), **CoffeeCode Router 2.0.2**, JWT próprio (`Core/JWTToken.php`) |
| Banco | MySQL (WAMP) — `MyISAM`/`InnoDB` |
| Front-end | HTML + CSS separados, JavaScript ES Modules com orientação a objetos |
| Comunicação | API REST própria; todas as telas usam classes que estendem `HttpClientBase` |
| Servidor | Apache (WAMP Server) com `mod_rewrite` |

## 2. Estrutura do projeto

```
agendei/
├── *.html                      ← páginas (cliente: dashboard, agendamentos, novo-agendamento, perfil;
│                                  admin: painel, usuarios, novoservico-admin, agendamentos-admin)
├── api/
│   ├── index.php               ← front controller + TODAS as rotas
│   ├── source/Config/          ← constantes (banco, limites de upload, regras de agendamento)
│   ├── source/Controller/      ← Users, Services, ServiceImages, Appointments, Dashboard, ...
│   ├── source/Models/          ← User, Service, ServiceImage, Appointment, ...
│   ├── source/Support/         ← Helpers.php (url(), storage_url()) e Upload.php
│   └── tests/smoke-test.sh     ← teste de integração da API (curl)
├── data-base/
│   ├── AGENDEI DB.sql          ← criação do banco (original)
│   └── migrations/2026-11-etapas-06-07.sql   ← ALTERAÇÕES das etapas 06/07 (importar!)
├── storage/                    ← arquivos enviados (fora de api/ e views/)
│   ├── .htaccess               ← bloqueia execução de scripts e listagem de pastas
│   └── uploads/{users,services}/
├── tests/                      ← testes das classes JS e das páginas (Node)
└── views/assets/
    ├── _common/classes/        ← HttpClientBase, Users, Services, Appointments, Images (novo), ...
    ├── _common/scripts/        ← auth-guard, avatar (novo), storage, catalogo
    ├── app/                    ← área do cliente (scripts/styles)
    └── admin/                  ← área administrativa (scripts/styles)
```

## 3. Configuração do ambiente (WAMP)

1. Coloque a pasta em `C:\wamp64\www\agendei`.
2. `api/`: rode `composer install` (se a pasta `vendor/` não existir).
3. Confirme `api/source/Config/Config.php` (`CONF_URL_BASE`, `CONF_DB_*`).
4. Ative `mod_rewrite` e `AllowOverride All` no Apache (já é o padrão do projeto).
5. **Banco de dados** — veja a seção 4.
6. **PHP** — ajuste os limites de upload (seção 5) e reinicie o WAMP.
7. Acesse `http://localhost/agendei/views/assets/public/login.html` (cliente) ou `login-admin.html` (admin).

> Em Linux o servidor Apache precisa de permissão de escrita em `storage/uploads/`
> (`chown -R www-data storage` ou `chmod -R 775 storage/uploads`). O `api/.htaccess` original usa fim de linha CRLF;
> em Linux converta para LF (`sed -i 's/\r$//' api/.htaccess`).

## 4. Banco de dados

1. Banco novo: importe `data-base/AGENDEI DB.sql` e depois a migração.
2. Banco já existente (**seus dados são preservados**): importe somente a migração, com o banco `agendei` selecionado:

```
mysql -u root agendei < "data-base/migrations/2026-11-etapas-06-07.sql"
```
(ou phpMyAdmin → banco `agendei` → Importar). O script é **idempotente** (pode rodar mais de uma vez) e não apaga nada. Ele faz:

| Alteração | Motivo |
|---|---|
| `appointments.employee_id` (+ índices) se não existir | O dump original não tem a coluna, mas a API a utiliza. Sem ela, `GET /appointments/list` falhava com erro fatal e o **dashboard ficava em "Carregando"**. |
| `services` → `InnoDB` | Estava `MyISAM`, que não aceita chave estrangeira. As linhas são mantidas. |
| Cria `service_images` (1:N) | Galeria de imagens: `id`, `service_id` (FK → `services.id`, `ON DELETE CASCADE`), `image_path`, `alt_text`, `position`, `created_at`. |
| `users.photo` | **Já existia** (`VARCHAR(255)`); passa a guardar o caminho relativo `uploads/users/<arquivo>`. Nada a criar. |

## 5. Configuração de uploads

Limites definidos em `api/source/Config/Config.php`:

| Constante | Valor | Uso |
|---|---|---|
| `CONF_UPLOAD_MAX_USER_PHOTO` | 2 MB | foto de perfil |
| `CONF_UPLOAD_MAX_SERVICE_IMAGE` | 5 MB | cada imagem de serviço |
| `CONF_UPLOAD_MAX_FILES_PER_REQUEST` | 10 | imagens por envio |
| `CONF_UPLOAD_MAX_IMAGES_PER_SERVICE` | 20 | imagens por serviço |

Formatos aceitos: **JPG, PNG e WEBP** (o tipo é detectado pelo conteúdo do arquivo, não pelo nome/extensão/MIME enviado).

**`php.ini` (WAMP → ícone → PHP → php.ini).** Os valores do PHP precisam ser maiores que os limites acima:

```ini
file_uploads = On
upload_max_filesize = 6M     ; > 5 MB (maior arquivo individual)
post_max_size = 60M          ; >= 10 arquivos x 5 MB + folga
max_file_uploads = 20        ; >= 10
```
Reinicie o Apache. Com `upload_max_filesize` abaixo de 5 MB a API responde "O arquivo excede o tamanho máximo permitido pelo servidor"; com `post_max_size` estourado, "O envio excede o tamanho total permitido pelo servidor (post_max_size)".

Como funciona: a classe `Source\Support\Upload` valida (códigos de erro do PHP, `is_uploaded_file`, tamanho real, MIME por `finfo`, `getimagesize`, dimensões máximas), gera nome aleatório, grava em `storage/uploads/...` e devolve o caminho **relativo**. O banco guarda só o relativo; a API devolve `*_url` montada por `storage_url()`. Nenhum caminho absoluto do servidor é exposto.

## 6. API — contrato (somente o que foi criado/alterado nas etapas 06/07)

Respostas seguem o padrão `{ "code", "type", "status", "message", "data" }`. Autenticação: `Authorization: Bearer <token>`.
Toda falha inesperada vira JSON `500` (o PHP **não** imprime avisos na resposta). Observação do Router: `PUT/DELETE` só leem corpo `application/x-www-form-urlencoded`
(por isso as classes JS usam `putForm`); `POST` aceita form-data/multipart.

### Usuário / perfil
| Método | Caminho | Permissão | Campos | Resposta |
|---|---|---|---|---|
| GET | `/users/me` | cliente/funcionário | — | `id, type_id, name, email, photo, photo_url` |
| PUT | `/users/update` | autenticado (o ID vem do **token**) | `name`, `email` (opcionais; e-mail único e válido). Qualquer `photo`/`id` enviado é ignorado | dados atualizados |
| PUT | `/users/update-password` | autenticado | `current_password`, `new_password` (≥ 8) | 200 / 400 |
| **POST** | **`/users/photo`** | autenticado | **multipart:** `photo` (1 arquivo JPG/PNG/WEBP ≤ 2 MB) | `{ photo, photo_url }`. Remove a foto anterior **só depois** de gravar no banco; se o banco falhar, apaga o arquivo novo |
| PUT | `/users/manage/{userId}` | admin | `name, email, type_id, password?, active?` (`active=1` reativa) | 200 |
| DELETE | `/users/{userId}` | admin | — | desativa (soft delete). Contas de admin: 403 |

### Galeria de imagens dos serviços (1:N)
| Método | Caminho | Permissão | Campos | Resposta |
|---|---|---|---|---|
| GET | `/services/{service_id}/images` | público | — | lista (vazia = `[]`) com `id, image_url, alt_text, position` |
| POST | `/services/{service_id}/images` | admin | **multipart:** `images[]` (1 a 10 arquivos, ≤ 5 MB cada; máx. 20 por serviço) | `201 { saved:[...], failed:[{file,error}] }` — aceita parcialmente |
| DELETE | `/services/{service_id}/images/{image_id}` | admin | — | 200; 404 se a imagem **não pertence** ao serviço. Apaga o registro e depois o arquivo |
| GET | `/services/list` | público | — | agora inclui `cover_url` e `image_count` |
| GET | `/services/list/{id}` | público | — | agora inclui `images[]` |
| DELETE | `/services/delete/{service_id}` | admin | — | **exclusão real**: 409 se houver agendamentos (use `active=0` para desativar); senão remove o serviço (FK apaga os registros) e **os arquivos do disco** |

### Agendamentos
| Método | Caminho | Permissão | Descrição |
|---|---|---|---|
| GET | `/appointments/availability?service_id=&date=YYYY-MM-DD[&employee_id=]` | cliente | horários do dia calculados no servidor: `slots:[{time, available, reason}]` |
| POST | `/appointments/insert` | cliente | `service_id, appointment_date, appointment_time, employee_id?`. 201; **409** conflito/duplicado/horário ocupado; **400** data passada, serviço inexistente/inativo, campos ausentes |
| PUT | `/appointments/cancel/{appointment_id}` | cliente **dono** | só `pending/confirmed` e com ≥ 2 h de antecedência; senão 409. Agendamento de outra pessoa → 404 |
| GET | `/appointments/list` | cliente (os seus) / admin (todos) | filtros do admin: `date, client, service_id, status, employee_id` |
| PUT | `/appointments/{appointment_id}` | admin | `status` e/ou `appointment_date, appointment_time, service_id, employee_id` (revalida conflitos) |
| DELETE | `/appointments/{appointment_id}` | admin | exclui |

Regras (em `Config.php`): funcionamento `09:00–18:00`, intervalos de 30 min, até 120 dias à frente, cancelamento com 2 h de antecedência.
"Qualquer profissional" aceita agendamentos simultâneos até o número de funcionários ativos (mínimo 1).

### Dashboard administrativo
`GET /dashboard/admin` (admin): `counts` agora inclui `total_users`, `total_services`, `total_appointments`, `appointments_today`, `upcoming_appointments`, `completed_appointments`, `cancelled_appointments`; e `next_appointments[]`.

### Exemplos (curl)
```bash
# login
curl -X POST http://localhost/agendei/api/users/login -d "email=maria@teste.com&password=senha1234"
# foto de perfil
curl -X POST http://localhost/agendei/api/users/photo -H "Authorization: Bearer $TOKEN" -F "photo=@minha-foto.jpg"
# galeria: várias imagens
curl -X POST http://localhost/agendei/api/services/1/images -H "Authorization: Bearer $ADMIN" -F "images[]=@a.jpg" -F "images[]=@b.png"
# remover uma imagem
curl -X DELETE http://localhost/agendei/api/services/1/images/7 -H "Authorization: Bearer $ADMIN"
# horários livres
curl "http://localhost/agendei/api/appointments/availability?service_id=1&date=2026-12-10" -H "Authorization: Bearer $TOKEN"
```

## 7. Como testar manualmente

**Foto de perfil**
1. Entre como cliente → *Perfil*. 2. "Escolher imagem" → a pré-visualização aparece no círculo. 3. "Enviar foto" → mensagem de sucesso e o avatar (perfil e cabeçalho) muda.
4. Atualize a página (F5): a foto continua. 5. Tente um `.pdf`/`.txt` renomeado `.png` ou um arquivo > 2 MB → mensagem de erro. 6. Envie outra foto: a anterior some de `storage/uploads/users/`.

**Galeria de serviços**
1. Entre como admin → *Serviços* → "Adicionar serviço" (ou "Editar"). 2. Em *Galeria de imagens* selecione **várias** imagens (aparecem em "Novas imagens"; o × descarta).
3. Salve → o serviço aparece com miniatura. 4. Reabra em *Editar*: as imagens salvas estão em "Imagens cadastradas" (continuam após F5).
5. Adicione outra imagem (as antigas permanecem). 6. Clique no × de uma imagem salva → só ela é removida (e o arquivo some de `storage/uploads/services/`).
7. "Excluir" o serviço → remove o serviço e os arquivos. (Serviço com agendamentos: a API recusa e orienta a desativar.)

## 8. Testes automatizados incluídos
```
api/tests/smoke-test.sh                       # API real (curl): 100 verificações — use banco de DESENVOLVIMENTO
node tests/frontend-classes.test.mjs          # classes JS (Node 20+) contra a API
npm i jsdom && node tests/dom-pages.test.mjs  # scripts das páginas num DOM simulado contra a API
```
Eles criam contas/dados de teste: `admin@teste.com`, `maria@teste.com`, `outro@teste.com` (senha `senha1234`, tipos 1/2/2) e ao menos um funcionário (tipo 3).

## 9. Observações importantes
* `api/source/Support/Upload.php` **não veio no ZIP** enviado. Foi criada uma implementação compatível. Se o professor fornecer a classe oficial, substitua o arquivo e ajuste as 3 chamadas (`Users::photo`, `ServiceImages::insert`, `Services::delete`) à assinatura dela.
* Telefone e data de nascimento (que existiam só como texto fictício no perfil) foram removidos da tela: não há colunas para eles no banco.
* Mensagens de console do navegador/erros PHP: a API grava erros no log do PHP/Apache (`display_errors` desligado dentro de `api/index.php`).
