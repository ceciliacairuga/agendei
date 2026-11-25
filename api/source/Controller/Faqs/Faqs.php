<?php

namespace Source\Controller\Faqs;

use Source\Controller\Api;
use Source\Models\Faqs\Faq;

class Faqs extends Api
{
    public function listAll(): void
    {
        $faq  = new Faq();
        $list = $faq->selectAll();
        $this->call(200, "success", "Lista de FAQs.", "success")->back($list);
    }

    public function listById(array $data): void
    {
        if (!filter_var($data['faq_id'], FILTER_VALIDATE_INT)) {
            $this->call(400, "bad_request", "ID do FAQ inválido.", "error")->back();
            return;
        }

        $faq = new Faq();
        if (!$faq->selectById((int)$data['faq_id'])) {
            $this->call(404, "not_found", $faq->getErrorMessage(), "error")->back();
            return;
        }

        $this->call(200, "success", "FAQ encontrado.", "success")->back([
            "id"               => $faq->getId(),
            "faqsCategoryId"   => $faq->getFaqsCategoryId(),
            "question"         => $faq->getQuestion(),
            "answer"           => $faq->getAnswer(),
        ]);
    }

    public function listPaginator(array $data): void
    {
        $page    = max(1, (int)($data['page'] ?? 1));
        $perPage = max(1, (int)($data['per_page'] ?? 10));

        $faq    = new Faq();
        $result = $faq->selectPaginator($page, $perPage);
        $this->call(200, "success", "Lista paginada de FAQs.", "success")->back($result);
    }

    public function insert(array $data): void
    {
        if (empty($data['faqs_category_id']) || empty($data['question']) || empty($data['answer'])) {
            $this->call(400, "bad_request", "Campos obrigatórios: faqs_category_id, question, answer.", "error")->back();
            return;
        }
 
        $faq = new Faq(null, (int)$data['faqs_category_id'], $data['question'], $data['answer']);
 
        if (!$faq->insert()) {
            $this->call(500, "internal_server_error", $faq->getErrorMessage(), "error")->back();
            return;
        }
 
        $this->call(201, "created", "FAQ criado com sucesso.", "success")->back([
            "id"             => $faq->getId(),
            "faqsCategoryId" => $faq->getFaqsCategoryId(),
            "question"       => $faq->getQuestion(),
            "answer"         => $faq->getAnswer(),
        ]);
    }

    public function update(array $data): void
    {
        if (!$this->authToken(1)) {
            $this->call(401, "unauthorized", "Acesso negado.", "error")->back();
            return;
        }

        if (!filter_var($data['faq_id'], FILTER_VALIDATE_INT)) {
            $this->call(400, "bad_request", "ID inválido.", "error")->back();
            return;
        }

        $faq = new Faq();
        if (!$faq->selectById((int)$data['faq_id'])) {
            $this->call(404, "not_found", "FAQ não encontrado.", "error")->back();
            return;
        }

        if (!empty($data['faqs_category_id'])) $faq->setFaqsCategoryId((int)$data['faqs_category_id']);
        if (!empty($data['question']))          $faq->setQuestion($data['question']);
        if (!empty($data['answer']))            $faq->setAnswer($data['answer']);

        if (!$faq->updateById((int)$data['faq_id'])) {
            $this->call(500, "internal_server_error", $faq->getErrorMessage(), "error")->back();
            return;
        }

        $this->call(200, "success", "FAQ atualizado com sucesso.", "success")->back([
            "id"             => $faq->getId(),
            "faqsCategoryId" => $faq->getFaqsCategoryId(),
            "question"       => $faq->getQuestion(),
            "answer"         => $faq->getAnswer(),
        ]);
    }

    public function delete(array $data): void
    {
        if (!$this->authToken(1)) {
            $this->call(401, "unauthorized", "Acesso negado.", "error")->back();
            return;
        }

        if (!filter_var($data['faq_id'], FILTER_VALIDATE_INT)) {
            $this->call(400, "bad_request", "ID inválido.", "error")->back();
            return;
        }

        $faq = new Faq();
        if (!$faq->softDeleteById((int)$data['faq_id'])) {
            $this->call(404, "not_found", $faq->getErrorMessage(), "error")->back();
            return;
        }

        $this->call(200, "success", "FAQ removido com sucesso.", "success")->back();
    }

    //  Aliases para rotas legadas 

    public function faqsListAll(): void           { $this->listAll(); }
    public function faqsListById(array $d): void  { $d['faq_id'] = $d['faqId'] ?? null; $this->listById($d); }
    public function faqInsert(array $d): void     { $this->insert($d); }
    public function faqUpdate(array $d): void     { $d['faq_id'] = $d['faqId'] ?? null; $this->update($d); }
    public function faqDelete(array $d): void     { $d['faq_id'] = $d['faqId'] ?? null; $this->delete($d); }
}
