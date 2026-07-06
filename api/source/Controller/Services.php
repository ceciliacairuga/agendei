<?php

namespace Source\Controller;

use Source\Models\Service;

class Services extends Api
{
    // GET /services/list — Listar todos os serviços (público)
    public function listAll(): void
    {
        $service = new Service();
        $list    = $service->selectAll();
        $this->call(200, "success", "Lista de serviços.", "success")->back($list);
    }

    // GET /services/list/{service_id} — Buscar serviço por ID (público)
    public function listById(array $data): void
    {
        if (!filter_var($data['service_id'], FILTER_VALIDATE_INT)) {
            $this->call(400, "bad_request", "ID do serviço inválido.", "error")->back();
            return;
        }

        $service = new Service();
        if (!$service->selectById((int)$data['service_id'])) {
            $this->call(404, "not_found", $service->getErrorMessage(), "error")->back();
            return;
        }

        $this->call(200, "success", "Serviço encontrado.", "success")->back([
            "id"             => $service->getId(),
            "servicesTypeId" => $service->getServicesTypeId(),
            "name"           => $service->getName(),
            "description"    => $service->getDescription(),
            "duration"       => $service->getDuration(),
            "price"          => $service->getPrice(),
        ]);
    }

    // GET /services/list/paginator/{page}/{per_page} — Paginação (público)
    public function listPaginator(array $data): void
    {
        $page    = max(1, (int)($data['page'] ?? 1));
        $perPage = max(1, (int)($data['per_page'] ?? 10));

        $service = new Service();
        $result  = $service->selectPaginator($page, $perPage);
        $this->call(200, "success", "Lista paginada de serviços.", "success")->back($result);
    }

    // POST /services — Inserir serviço (requer auth admin)
    public function insert(array $data): void
    {
        if (!$this->authToken(1)) {
            $this->call(401, "unauthorized", "Acesso negado.", "error")->back();
            return;
        }

        if (empty($data['services_type_id']) || empty($data['name']) ||
            empty($data['description']) || empty($data['duration']) || !isset($data['price'])) {
            $this->call(400, "bad_request", "Campos obrigatórios: services_type_id, name, description, duration, price.", "error")->back();
            return;
        }

        $service = new Service(
            null,
            (int)$data['services_type_id'],
            $data['name'],
            $data['description'],
            (int)$data['duration'],
            (float)$data['price']
        );

        if (!$service->insert()) {
            $this->call(500, "internal_server_error", $service->getErrorMessage(), "error")->back();
            return;
        }

        $this->call(201, "created", "Serviço inserido com sucesso.", "success")->back([
            "id" => $service->getId(),
        ]);
    }

    // PUT /services/{service_id} — Atualizar serviço (requer auth admin)
    public function update(array $data): void
    {
        if (!$this->authToken(1)) {
            $this->call(401, "unauthorized", "Acesso negado.", "error")->back();
            return;
        }

        if (!filter_var($data['service_id'], FILTER_VALIDATE_INT)) {
            $this->call(400, "bad_request", "ID do serviço inválido.", "error")->back();
            return;
        }

        $service = new Service();
        if (!$service->selectById((int)$data['service_id'])) {
            $this->call(404, "not_found", "Serviço não encontrado.", "error")->back();
            return;
        }

        if (!empty($data['services_type_id'])) $service->setServicesTypeId((int)$data['services_type_id']);
        if (!empty($data['name']))              $service->setName($data['name']);
        if (!empty($data['description']))       $service->setDescription($data['description']);
        if (!empty($data['duration']))          $service->setDuration((int)$data['duration']);
        if (isset($data['price']))              $service->setPrice((float)$data['price']);

        if (!$service->updateById((int)$data['service_id'])) {
            $this->call(500, "internal_server_error", $service->getErrorMessage(), "error")->back();
            return;
        }

        $this->call(200, "success", "Serviço atualizado com sucesso.", "success")->back();
    }

    // DELETE /services/{service_id} — Remover serviço (requer auth admin)
    public function delete(array $data): void
    {
        if (!$this->authToken(1)) {
            $this->call(401, "unauthorized", "Acesso negado.", "error")->back();
            return;
        }

        if (!filter_var($data['service_id'], FILTER_VALIDATE_INT)) {
            $this->call(400, "bad_request", "ID do serviço inválido.", "error")->back();
            return;
        }

        $service = new Service();
        if (!$service->softDeleteById((int)$data['service_id'])) {
            $this->call(404, "not_found", $service->getErrorMessage(), "error")->back();
            return;
        }

        $this->call(200, "success", "Serviço removido com sucesso.", "success")->back();
    }



    public function servicesListAll(): void         {
         $this->listAll(); 
         }
    public function servicesListById(array $d): void {
         $d['service_id'] = $d['serviceId'] ?? null; $this->listById($d); 
         }
    public function servicesInsert(array $d): void  {
         $this->insert($d); 
         }
    public function servicesDelete(array $d): void  {
         $d['service_id'] = $d['serviceId'] ?? null; $this->delete($d); 
         }
}
