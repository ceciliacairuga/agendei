<?php

namespace Source\Controller;

use Source\Models\UserType;

class UserTypes extends Api
{
    // GET /user-types/list — Listar todos os tipos de usuário (público)
    public function listAll(): void
    {
        $type = new UserType();
        $list = $type->selectAll();
        $this->call(200, "success", "Lista de tipos de usuário.", "success")->back($list);
    }

    // GET /user-types/list/{user_type_id} — Buscar por ID (público)
    public function listById(array $data): void
    {
        if (!filter_var($data['user_type_id'], FILTER_VALIDATE_INT)) {
            $this->call(400, "bad_request", "ID inválido.", "error")->back();
            return;
        }

        $type = new UserType();
        if (!$type->selectById((int)$data['user_type_id'])) {
            $this->call(404, "not_found", $type->getErrorMessage(), "error")->back();
            return;
        }

        $this->call(200, "success", "Tipo de usuário encontrado.", "success")->back([
            "id"     => $type->getId(),
            "name"   => $type->getName(),
            "active" => $type->getActive(),
        ]);
    }

    // GET /user-types/list/paginator/{page}/{per_page} — Paginação (público)
    public function listPaginator(array $data): void
    {
        $page    = max(1, (int)($data['page'] ?? 1));
        $perPage = max(1, (int)($data['per_page'] ?? 10));

        $type   = new UserType();
        $result = $type->selectPaginator($page, $perPage);
        $this->call(200, "success", "Lista paginada de tipos de usuário.", "success")->back($result);
    }

    // POST /user-types — Inserir tipo de usuário (requer auth admin)
    public function insert(array $data): void
    {
        if (!$this->authToken(1)) {
            $this->call(401, "unauthorized", "Acesso negado.", "error")->back();
            return;
        }

        if (empty($data['name'])) {
            $this->call(400, "bad_request", "O campo name é obrigatório.", "error")->back();
            return;
        }

        $type = new UserType(null, $data['name']);

        if (!$type->insert()) {
            $this->call(500, "internal_server_error", $type->getErrorMessage(), "error")->back();
            return;
        }

        $this->call(201, "created", "Tipo de usuário inserido com sucesso.", "success")->back([
            "id"   => $type->getId(),
            "name" => $type->getName(),
        ]);
    }

    // PUT /user-types/{user_type_id} — Atualizar tipo de usuário (requer auth admin)
    public function update(array $data): void
    {
        if (!$this->authToken(1)) {
            $this->call(401, "unauthorized", "Acesso negado.", "error")->back();
            return;
        }

        if (!filter_var($data['user_type_id'], FILTER_VALIDATE_INT)) {
            $this->call(400, "bad_request", "ID inválido.", "error")->back();
            return;
        }

        $type = new UserType();
        if (!$type->selectById((int)$data['user_type_id'])) {
            $this->call(404, "not_found", "Tipo de usuário não encontrado.", "error")->back();
            return;
        }

        if (!empty($data['name']))   $type->setName($data['name']);
        if (isset($data['active']))  $type->setActive((int)$data['active']);

        if (!$type->updateById((int)$data['user_type_id'])) {
            $this->call(500, "internal_server_error", $type->getErrorMessage(), "error")->back();
            return;
        }

        $this->call(200, "success", "Tipo de usuário atualizado com sucesso.", "success")->back([
            "id"   => $type->getId(),
            "name" => $type->getName(),
        ]);
    }

    // DELETE /user-types/{user_type_id} — Remover tipo de usuário (requer auth admin)
    public function delete(array $data): void
    {
        if (!$this->authToken(1)) {
            $this->call(401, "unauthorized", "Acesso negado.", "error")->back();
            return;
        }

        if (!filter_var($data['user_type_id'], FILTER_VALIDATE_INT)) {
            $this->call(400, "bad_request", "ID inválido.", "error")->back();
            return;
        }

        $type = new UserType();
        if (!$type->softDeleteById((int)$data['user_type_id'])) {
            $this->call(404, "not_found", $type->getErrorMessage(), "error")->back();
            return;
        }

        $this->call(200, "success", "Tipo de usuário desativado com sucesso.", "success")->back();
    }
}
