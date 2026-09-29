<?php

namespace Source\Controller\Faqs;

use Source\Controller\Api;
use Source\Models\Faqs\FaqCategory;

class FaqsCategories extends Api
{
    // GET /faqs-categories/list — Listar todas as categorias (público)
    public function listAll(): void
    {
        $cat  = new FaqCategory();
        $list = $cat->selectAll();
        $this->call(200, "success", "Lista de categorias de FAQ.", "success")->back($list);
    }

    // GET /faqs-categories/list/{category_id} — Buscar categoria por ID (público)
    public function listById(array $data): void
    {
        if (!filter_var($data['category_id'], FILTER_VALIDATE_INT)) {
            $this->call(400, "bad_request", "ID inválido.", "error")->back();
            return;
        }

        $cat = new FaqCategory();
        if (!$cat->selectById((int)$data['category_id'])) {
            $this->call(404, "not_found", $cat->getErrorMessage(), "error")->back();
            return;
        }

        $this->call(200, "success", "Categoria encontrada.", "success")->back([
            "id"   => $cat->getId(),
            "name" => $cat->getName(),
        ]);
    }

    // GET /faqs-categories/list/paginator/{page}/{per_page} — Paginação (público)
    public function listPaginator(array $data): void
    {
        $page    = max(1, (int)($data['page'] ?? 1));
        $perPage = max(1, (int)($data['per_page'] ?? 10));

        $cat    = new FaqCategory();
        $result = $cat->selectPaginator($page, $perPage);
        $this->call(200, "success", "Lista paginada de categorias.", "success")->back($result);
    }

    // POST /faqs-categories — Inserir categoria (requer auth admin)
    public function insert(array $data): void
    {
        if (!$this->authToken(1)) {
            $this->call(401, "unauthorized", "Acesso negado.", "error")->back();
            return;
        }

        if (empty(trim($data['name'] ?? ''))) {
            $this->call(400, "bad_request", "O campo name é obrigatório.", "error")->back();
            return;
        }

        $cat = new FaqCategory(null, $data['name']);

        if (!$cat->insert()) {
            $this->call(500, "internal_server_error", $cat->getErrorMessage(), "error")->back();
            return;
        }

        $this->call(201, "created", "Categoria de FAQ criada com sucesso.", "success")->back([
            "id"   => $cat->getId(),
            "name" => $cat->getName(),
        ]);
    }

    // PUT /faqs-categories/{category_id} — Atualizar categoria (requer auth admin)
    public function update(array $data): void
    {
        if (!$this->authToken(1)) {
            $this->call(401, "unauthorized", "Acesso negado.", "error")->back();
            return;
        }

        if (!filter_var($data['category_id'], FILTER_VALIDATE_INT)) {
            $this->call(400, "bad_request", "ID inválido.", "error")->back();
            return;
        }

        if (empty(trim($data['name'] ?? ''))) {
            $this->call(400, "bad_request", "O campo name é obrigatório.", "error")->back();
            return;
        }

        $cat = new FaqCategory();
        if (!$cat->selectById((int)$data['category_id'])) {
            $this->call(404, "not_found", "Categoria não encontrada.", "error")->back();
            return;
        }

        $cat->setName($data['name']);

        if (!$cat->updateById((int)$data['category_id'])) {
            $this->call(500, "internal_server_error", $cat->getErrorMessage(), "error")->back();
            return;
        }

        $this->call(200, "success", "Categoria atualizada com sucesso.", "success")->back([
            "id"   => $cat->getId(),
            "name" => $cat->getName(),
        ]);
    }

    // DELETE /faqs-categories/{category_id} — Remover categoria (requer auth admin)
    public function delete(array $data): void
    {
        if (!$this->authToken(1)) {
            $this->call(401, "unauthorized", "Acesso negado.", "error")->back();
            return;
        }

        if (!filter_var($data['category_id'], FILTER_VALIDATE_INT)) {
            $this->call(400, "bad_request", "ID inválido.", "error")->back();
            return;
        }

        $cat    = new FaqCategory();
        $result = $cat->safeDelete((int)$data['category_id']);

        if ($result === 400) {
            $this->call(400, "bad_request", "Não é possível remover uma categoria com FAQs ativos.", "error")->back();
            return;
        }

        if ($result === false) {
            $this->call(404, "not_found", $cat->getErrorMessage(), "error")->back();
            return;
        }

        $this->call(200, "success", "Categoria removida com sucesso.", "success")->back();
    }

    // Aliases para rotas legadas

    public function faqsCategoryList(): void { 
        $this->listAll(); }
    public function faqsCategoryListById(array $d): void  { $d['category_id'] = $d['categoryId'] ?? null; $this->listById($d); }
    public function faqsCategoriesCreate(array $d): void  { $this->insert($d); }
    public function faqCategoryUpdate(array $d): void     { $d['category_id'] = $d['categoryId'] ?? null; $this->update($d); }
    public function faqCategoryDelete(array $d): void     { $d['category_id'] = $d['categoryId'] ?? null; $this->delete($d); }
}
