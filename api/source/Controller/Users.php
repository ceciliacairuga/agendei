<?php

namespace Source\Controller;

use Source\Models\User;

class Users extends Api
{
    // POST /users/register — Registrar usuário comum (type_id = 2)
    public function register(array $data): void
    {
        if (!$this->validateRegisterFields($data)) {
            $this->call(400, "bad_request", "Nome, e-mail válido e senha são obrigatórios.", "error")->back();
            return;
        }

        $user = new User(null, 2, $data['name'], $data['email'], $data['password']);

        if (!$user->insert()) {
            $this->call(500, "internal_server_error", $user->getErrorMessage(), "error")->back();
            return;
        }

        $this->call(201, "created", "Usuário cadastrado com sucesso.", "success")->back([
            "id"    => $user->getId(),
            "name"  => $user->getName(),
            "email" => $user->getEmail(),
        ]);
    }

    // POST /users/register-admin — Registrar usuário admin (type_id = 1)
    public function registerAdmin(array $data): void
    {
        if (!$this->authToken(1)) {
            $this->call(401, "unauthorized", "Acesso de administrador necessário.", "error")->back();
            return;
        }

        if (!$this->validateRegisterFields($data)) {
            $this->call(400, "bad_request", "Nome, e-mail válido e senha são obrigatórios.", "error")->back();
            return;
        }

        $user = new User(null, 1, $data['name'], $data['email'], $data['password']);

        if (!$user->insert()) {
            $this->call(500, "internal_server_error", $user->getErrorMessage(), "error")->back();
            return;
        }

        $this->call(201, "created", "Usuário admin cadastrado com sucesso.", "success")->back([
            "id"    => $user->getId(),
            "name"  => $user->getName(),
            "email" => $user->getEmail(),
        ]);
    }


    // POST /users/create — Admin cadastra cliente ou funcionário.
    public function createByAdmin(array $data): void
    {
        if (!$this->authToken(1)) {
            $this->call(401, "unauthorized", "Acesso negado.", "error")->back();
            return;
        }

        $typeId = (int)($data['type_id'] ?? 0);
        if (!$this->validateRegisterFields($data) || strlen((string)$data['password']) < 8 || !in_array($typeId, [2, 3], true)) {
            $this->call(400, "bad_request", "Informe nome, e-mail válido, senha com pelo menos 8 caracteres e tipo de usuário.", "error")->back();
            return;
        }

        $user = new User(null, $typeId, trim($data['name']), trim($data['email']), $data['password']);
        if (!$user->insert()) {
            $this->call(400, "bad_request", $user->getErrorMessage(), "error")->back();
            return;
        }

        $this->call(201, "created", "Usuário cadastrado com sucesso.", "success")->back([
            "id" => $user->getId(), "name" => $user->getName(), "email" => $user->getEmail(), "type_id" => $typeId
        ]);
    }

    // PUT /users/manage/{userId} — Admin edita dados de cliente ou funcionário.
    public function manageByAdmin(array $data): void
    {
        if (!$this->authToken(1)) {
            $this->call(401, "unauthorized", "Acesso negado.", "error")->back();
            return;
        }

        $id = (int)($data['userId'] ?? 0);
        if ($id < 1) {
            $this->call(400, "bad_request", "ID inválido.", "error")->back();
            return;
        }

        $user = new User();
        if (!$user->selectById($id)) {
            $this->call(404, "not_found", "Usuário não encontrado.", "error")->back();
            return;
        }

        if ($user->getTypeId() === 1) {
            $this->call(403, "forbidden", "Não é possível alterar a conta de administrador por esta tela.", "error")->back();
            return;
        }

        $typeId = (int)($data['type_id'] ?? $user->getTypeId());
        if (!in_array($typeId, [2, 3], true)) {
            $this->call(400, "bad_request", "Tipo de usuário inválido.", "error")->back();
            return;
        }

        $name = trim((string)($data['name'] ?? ''));
        $email = trim((string)($data['email'] ?? ''));
        if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->call(400, "bad_request", "Informe nome e e-mail válido.", "error")->back();
            return;
        }

        $db = \Source\Core\Connect::getInstance();
        $check = $db->prepare("SELECT id FROM users WHERE email = :email AND id <> :id LIMIT 1");
        $check->execute([':email' => $email, ':id' => $id]);
        if ($check->fetch()) {
            $this->call(400, "bad_request", "Já existe outro usuário com este e-mail.", "error")->back();
            return;
        }

        $user->setName($name);
        $user->setEmail($email);
        $user->setTypeId($typeId);
        if (isset($data['active']) && in_array((string)$data['active'], ['0', '1'], true)) {
            $user->setActive((int)$data['active']);   // permite reativar um usuário desativado
        }
        if (!empty($data['password'])) {
            if (strlen($data['password']) < 8) {
                $this->call(400, "bad_request", "A senha deve ter pelo menos 8 caracteres.", "error")->back();
                return;
            }
            $user->setPassword(password_hash($data['password'], PASSWORD_DEFAULT));
        }

        if (!$user->updateById($id)) {
            $this->call(500, "internal_server_error", $user->getErrorMessage(), "error")->back();
            return;
        }

        $this->call(200, "success", "Usuário atualizado com sucesso.", "success")->back();
    }

    // POST /users/login — Login usuário comum
    public function auth(array $data): void
    {
        if (!$this->validateLoginFields($data)) {
            $this->call(400, "bad_request", "E-mail válido e senha são obrigatórios.", "error")->back();
            return;
        }

        $user = new User();
        if (!$user->login($data['email'], $data['password'], 2)) {
            $this->call(401, "unauthorized", $user->getErrorMessage(), "error")->back();
            return;
        }

        $this->call(200, "success", "Login realizado com sucesso.", "success")->back([
            "id"    => $user->getId(),
            "name"  => $user->getName(),
            "photo" => $user->getPhoto(),
            "photo_url" => storage_url($user->getPhoto()),
            "token" => $user->getToken(),
        ]);
    }

    // POST /users/login-admin — Login usuário admin
    public function authAdmin(array $data): void
    {
        if (!$this->validateLoginFields($data)) {
            $this->call(400, "bad_request", "E-mail válido e senha são obrigatórios.", "error")->back();
            return;
        }

        $user = new User();
        if (!$user->login($data['email'], $data['password'], 1)) {
            $this->call(401, "unauthorized", $user->getErrorMessage(), "error")->back();
            return;
        }

        $this->call(200, "success", "Login de admin realizado com sucesso.", "success")->back([
            "id"    => $user->getId(),
            "name"  => $user->getName(),
            "photo" => $user->getPhoto(),
            "photo_url" => storage_url($user->getPhoto()),
            "token" => $user->getToken(),
        ]);
    }

    // GET /users/list — Listar todos os usuários (somente admin)
    public function listAll(): void
    {
        if (!$this->authToken(1)) {
            $this->call(401, "unauthorized", "Acesso negado.", "error")->back();
            return;
        }

        $user = new User();
        $list = $user->selectAll();
        $safeList = array_map(function ($item) {
            return [
                "id"      => $item->id,
                "type_id" => $item->type_id,
                "name"    => $item->name,
                "email"   => $item->email,
                "photo"   => $item->photo,
                "photo_url" => storage_url($item->photo),
                "active"  => $item->active,
            ];
        }, $list);
        $this->call(200, "success", "Lista de usuários.", "success")->back($safeList);
    }

    // GET /users/list/{userId} — Buscar usuário por ID (somente admin)
    public function listById(array $data): void
    {
        if (!$this->authToken(1)) {
            $this->call(401, "unauthorized", "Acesso negado.", "error")->back();
            return;
        }

        if (!filter_var($data['userId'], FILTER_VALIDATE_INT)) {
            $this->call(400, "bad_request", "ID inválido.", "error")->back();
            return;
        }

        $user = new User();
        if (!$user->selectById((int)$data['userId'])) {
            $this->call(404, "not_found", $user->getErrorMessage(), "error")->back();
            return;
        }

        $this->call(200, "success", "Usuário encontrado.", "success")->back([
            "id"     => $user->getId(),
            "typeId" => $user->getTypeId(),
            "type_id" => $user->getTypeId(),
            "name"   => $user->getName(),
            "email"  => $user->getEmail(),
            "photo"  => $user->getPhoto(),
            "photo_url" => storage_url($user->getPhoto()),
            "active" => $user->getActive(),
        ]);
    }

    // GET /users/list/paginator/{page}/{per_page} — Paginação (somente admin)
    public function listPaginator(array $data): void
    {
        if (!$this->authToken(1)) {
            $this->call(401, "unauthorized", "Acesso negado.", "error")->back();
            return;
        }

        $page    = max(1, (int)($data['page'] ?? 1));
        $perPage = max(1, (int)($data['per_page'] ?? 10));

        $user   = new User();
        $result = $user->selectPaginator($page, $perPage);
        $this->call(200, "success", "Lista paginada de usuários.", "success")->back($result);
    }

    // GET /users/me — Retornar dados do usuário autenticado
    public function me(): void
    {
        if (!$this->authToken(2)) {
            $this->call(401, "unauthorized", "Não autenticado.", "error")->back();
            return;
        }

        $user = new User();
        if (!$user->selectById($this->userAuthId)) {
            $this->call(404, "not_found", "Usuário não encontrado.", "error")->back();
            return;
        }

        $this->call(200, "success", "Dados do usuário.", "success")->back([
            "id" => $user->getId(),
            "type_id" => $user->getTypeId(),
            "name" => $user->getName(),
            "email" => $user->getEmail(),
            "photo" => $user->getPhoto(),
            "photo_url" => storage_url($user->getPhoto()),
        ]);
    }

    // PUT /users/update-password — Alterar senha do usuário autenticado
    public function updatePassword(array $data): void
    {
        if (!$this->authToken(2)) {
            $this->call(401, "unauthorized", "Não autenticado.", "error")->back();
            return;
        }

        $currentPassword = $data['current_password'] ?? '';
        $newPassword = $data['new_password'] ?? '';
        if ($currentPassword === '' || strlen($newPassword) < 8) {
            $this->call(400, "bad_request", "Informe a senha atual e uma nova senha com pelo menos 8 caracteres.", "error")->back();
            return;
        }

        $user = new User();
        if (!$user->selectById($this->userAuthId)) {
            $this->call(404, "not_found", "Usuário não encontrado.", "error")->back();
            return;
        }

        if (!password_verify($currentPassword, (string)$user->getPassword())) {
            $this->call(400, "bad_request", "A senha atual está incorreta.", "error")->back();
            return;
        }

        $user->setPassword(password_hash($newPassword, PASSWORD_DEFAULT));
        if (!$user->updateById($this->userAuthId)) {
            $this->call(500, "internal_server_error", $user->getErrorMessage(), "error")->back();
            return;
        }

        $this->call(200, "success", "Senha alterada com sucesso.", "success")->back();
    }

    // PUT /users/update — Atualizar dados do próprio usuário autenticado (comum).
    // Corpo application/x-www-form-urlencoded (o Router só interpreta PUT neste formato).
    // O ID vem SEMPRE do token. A foto NÃO é alterada aqui: use POST /users/photo.
    public function update(array $data): void
    {
        if (!$this->authToken(2)) {
            $this->call(401, "unauthorized", "Não autenticado.", "error")->back();
            return;
        }
        $this->updateSelf($data, "Usuário atualizado com sucesso.");
    }

    // PUT /users/update-admin — Atualizar dados do próprio admin autenticado
    public function updateAdmin(array $data): void
    {
        if (!$this->authToken(1)) {
            $this->call(401, "unauthorized", "Não autenticado.", "error")->back();
            return;
        }
        $this->updateSelf($data, "Admin atualizado com sucesso.");
    }

    private function updateSelf(array $data, string $okMessage): void
    {
        $user = new User();
        if (!$user->selectById($this->userAuthId)) {
            $this->call(404, "not_found", "Usuário não encontrado.", "error")->back();
            return;
        }

        if (array_key_exists('name', $data)) {
            $name = trim((string)$data['name']);
            if ($name === '' || mb_strlen($name) > 255) {
                $this->call(400, "bad_request", "Informe um nome válido.", "error")->back();
                return;
            }
            $user->setName($name);
        }
        if (array_key_exists('email', $data)) {
            $email = trim((string)$data['email']);
            if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 255) {
                $this->call(400, "bad_request", "Informe um e-mail válido.", "error")->back();
                return;
            }
            $check = \Source\Core\Connect::getInstance()->prepare("SELECT id FROM users WHERE email = :email AND id <> :id LIMIT 1");
            $check->execute([':email' => $email, ':id' => $this->userAuthId]);
            if ($check->fetch()) {
                $this->call(400, "bad_request", "Já existe outro usuário com este e-mail.", "error")->back();
                return;
            }
            $user->setEmail($email);
        }

        if (!$user->updateById($this->userAuthId)) {
            $this->call(500, "internal_server_error", $user->getErrorMessage(), "error")->back();
            return;
        }

        $this->call(200, "success", $okMessage, "success")->back([
            "id"    => $user->getId(),
            "name"  => $user->getName(),
            "email" => $user->getEmail(),
            "photo" => $user->getPhoto(),
            "photo_url" => storage_url($user->getPhoto()),
        ]);
    }

    // POST /users/photo — Envia/troca a foto de perfil do usuário autenticado.
    // multipart/form-data, campo de arquivo: "photo". O ID NUNCA vem do formulário: sai do token.
    public function photo(): void
    {
        if (!$this->authToken(2) && !$this->authToken(1)) {
            $this->call(401, "unauthorized", "Não autenticado.", "error")->back();
            return;
        }

        $file = $_FILES['photo'] ?? null;
        if (!$file || ($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
            // post_max_size estourado faz o PHP descartar $_FILES inteiro.
            $tooBig = empty($_FILES) && !empty($_SERVER['CONTENT_LENGTH']);
            $this->call(400, "bad_request", $tooBig
                ? "O arquivo excede o tamanho máximo permitido pelo servidor."
                : "Selecione uma imagem para enviar.", "error")->back();
            return;
        }

        $user = new User();
        if (!$user->selectById($this->userAuthId)) {
            $this->call(404, "not_found", "Usuário não encontrado.", "error")->back();
            return;
        }
        $oldPhoto = $user->getPhoto();

        $upload = new \Source\Support\Upload();
        $newPath = $upload->image($file, CONF_UPLOAD_DIR_USERS, CONF_UPLOAD_MAX_USER_PHOTO);
        if ($newPath === null) {
            $this->call(400, "bad_request", $upload->getError(), "error")->back();
            return;
        }

        // Persiste o novo caminho. Se falhar, apaga o arquivo recém-criado (sem órfãos).
        try {
            $stmt = \Source\Core\Connect::getInstance()->prepare("UPDATE users SET photo = :photo WHERE id = :id");
            $stmt->execute([':photo' => $newPath, ':id' => $this->userAuthId]);
        } catch (\PDOException $e) {
            $upload->remove($newPath);
            $this->call(500, "internal_server_error", "Não foi possível salvar a foto no banco de dados.", "error")->back();
            return;
        }

        // Só agora, com o banco confirmado, remove a foto anterior.
        if ($oldPhoto && $oldPhoto !== $newPath) {
            $upload->remove($oldPhoto);
        }

        $this->call(200, "success", "Foto de perfil atualizada com sucesso.", "success")->back([
            "photo" => $newPath,
            "photo_url" => storage_url($newPath),
        ]);
    }

    // DELETE /users/{userId} — Desativar usuário (somente admin)
    public function delete(array $data): void
    {
        if (!$this->authToken(1)) {
            $this->call(401, "unauthorized", "Acesso negado.", "error")->back();
            return;
        }

        if (!filter_var($data['userId'], FILTER_VALIDATE_INT)) {
            $this->call(400, "bad_request", "ID inválido.", "error")->back();
            return;
        }

        $target = new User();
        if ($target->selectById((int)$data['userId']) && $target->getTypeId() === 1) {
            $this->call(403, "forbidden", "Contas de administrador não podem ser desativadas por esta tela.", "error")->back();
            return;
        }

        $user = new User();
        if (!$user->softDeleteById((int)$data['userId'])) {
            $this->call(404, "not_found", $user->getErrorMessage(), "error")->back();
            return;
        }

        $this->call(200, "success", "Usuário desativado com sucesso.", "success")->back();
    }

    // GET /users/employees — lista apenas os profissionais ativos para o formulário de agendamento.
    public function listEmployees(): void
    {
        if (!$this->authToken(2)) {
            $this->call(401, "unauthorized", "Entre na sua conta para consultar os profissionais.", "error")->back();
            return;
        }
        $db = \Source\Core\Connect::getInstance();
        $stmt = $db->query("SELECT id, name FROM users WHERE type_id = 3 AND active = 1 ORDER BY name ASC");
        $this->call(200, "success", "Profissionais ativos.", "success")->back($stmt->fetchAll());
    }

    // ── Helpers privados ─────────────────────────────────────────────────────

    private function validateRegisterFields(array $data): bool
    {
        return isset($data['name'], $data['email'], $data['password'])
            && trim((string)$data['name']) !== ''
            && strlen((string)$data['password']) >= 8
            && filter_var($data['email'], FILTER_VALIDATE_EMAIL);
    }

    private function validateLoginFields(array $data): bool
    {
        return isset($data['email'], $data['password'])
            && !empty($data['password'])
            && filter_var($data['email'], FILTER_VALIDATE_EMAIL);
    }

    // Alias para manter compatibilidade com rota legada GET /users/list
    public function usersList(): void
    {
        $this->listAll();
    }
}
