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
        // // Somente admins autenticados podem criar outros admins
        // if (!$this->authToken(1)) {
        //     $this->call(401, "unauthorized", "Acesso negado. Token de admin necessário.", "error")->back();
        //     return;
        // }

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
        $this->call(200, "success", "Lista de usuários.", "success")->back($list);
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
            "name"   => $user->getName(),
            "email"  => $user->getEmail(),
            "photo"  => $user->getPhoto(),
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

    // PUT /users/update — Atualizar dados do próprio usuário autenticado (comum)
    public function update(array $data): void
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

        if (!empty($data['name']))  $user->setName($data['name']);
        if (!empty($data['email'])) $user->setEmail($data['email']);
        if (!empty($data['photo'])) $user->setPhoto($data['photo']);

        if (!$user->updateById($this->userAuthId)) {
            $this->call(500, "internal_server_error", $user->getErrorMessage(), "error")->back();
            return;
        }

        $this->call(200, "success", "Usuário atualizado com sucesso.", "success")->back([
            "id"    => $user->getId(),
            "name"  => $user->getName(),
            "email" => $user->getEmail(),
        ]);
    }

    // PUT /users/update-admin — Atualizar dados do próprio admin autenticado
    public function updateAdmin(array $data): void
    {
        if (!$this->authToken(1)) {
            $this->call(401, "unauthorized", "Não autenticado.", "error")->back();
            return;
        }

        $user = new User();
        if (!$user->selectById($this->userAuthId)) {
            $this->call(404, "not_found", "Usuário não encontrado.", "error")->back();
            return;
        }

        if (!empty($data['name']))  $user->setName($data['name']);
        if (!empty($data['email'])) $user->setEmail($data['email']);
        if (!empty($data['photo'])) $user->setPhoto($data['photo']);

        if (!$user->updateById($this->userAuthId)) {
            $this->call(500, "internal_server_error", $user->getErrorMessage(), "error")->back();
            return;
        }

        $this->call(200, "success", "Admin atualizado com sucesso.", "success")->back([
            "id"    => $user->getId(),
            "name"  => $user->getName(),
            "email" => $user->getEmail(),
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

        $user = new User();
        if (!$user->softDeleteById((int)$data['userId'])) {
            $this->call(404, "not_found", $user->getErrorMessage(), "error")->back();
            return;
        }

        $this->call(200, "success", "Usuário desativado com sucesso.", "success")->back();
    }

    // ── Helpers privados ─────────────────────────────────────────────────────

    private function validateRegisterFields(array $data): bool
    {
        return isset($data['name'], $data['email'], $data['password'])
            && !empty($data['name'])
            && !empty($data['password'])
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
