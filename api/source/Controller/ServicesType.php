<?php

namespace Source\Controller;

use Source\Models\ServiceType;

class ServicesType extends Api
{
    
    public function listAll(): void
    {
        $type = new ServiceType();
        $list = $type->selectAll();
        $this->call(200, "success", "Lista de tipos de serviço.", "success")->back($list);
    }

    
    public function listById(array $data): void
    {
        if (!filter_var($data['services_type_id'], FILTER_VALIDATE_INT)) {
            $this->call(400, "bad_request", "ID inválido.", "error")->back();
            return;
        }

        $type = new ServiceType();
        if (!$type->selectById((int)$data['services_type_id'])) {
            $this->call(404, "not_found", $type->getErrorMessage(), "error")->back();
            return;
        }

        $this->call(200, "success", "Tipo de serviço encontrado.", "success")->back([
            "id"   => $type->getId(),
            "name" => $type->getName(),
        ]);
    }

    
    public function listPaginator(array $data): void
    {
        $page    = max(1, (int)($data['page'] ?? 1));
        $perPage = max(1, (int)($data['per_page'] ?? 10));

        $type   = new ServiceType();
        $result = $type->selectPaginator($page, $perPage);
        $this->call(200, "success", "Lista paginada de tipos de serviço.", "success")->back($result);
    }

    
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

        $type = new ServiceType(null, $data['name']);

        if (!$type->insert()) {
            $this->call(500, "internal_server_error", $type->getErrorMessage(), "error")->back();
            return;
        }

        $this->call(201, "created", "Tipo de serviço inserido com sucesso.", "success")->back([
            "id"   => $type->getId(),
            "name" => $type->getName(),
        ]);
    }

    
    public function update(array $data): void
    {
        if (!$this->authToken(1)) {
            $this->call(401, "unauthorized", "Acesso negado.", "error")->back();
            return;
        }

        if (!filter_var($data['services_type_id'], FILTER_VALIDATE_INT)) {
            $this->call(400, "bad_request", "ID inválido.", "error")->back();
            return;
        }

        if (empty($data['name'])) {
            $this->call(400, "bad_request", "O campo name é obrigatório.", "error")->back();
            return;
        }

        $type = new ServiceType();
        if (!$type->selectById((int)$data['services_type_id'])) {
            $this->call(404, "not_found", "Tipo de serviço não encontrado.", "error")->back();
            return;
        }

        $type->setName($data['name']);

        if (!$type->updateById((int)$data['services_type_id'])) {
            $this->call(500, "internal_server_error", $type->getErrorMessage(), "error")->back();
            return;
        }

        $this->call(200, "success", "Tipo de serviço atualizado com sucesso.", "success")->back([
            "id"   => $type->getId(),
            "name" => $type->getName(),
        ]);
    }

   
    public function delete(array $data): void
    {
        if (!$this->authToken(1)) {
            $this->call(401, "unauthorized", "Acesso negado.", "error")->back();
            return;
        }

        if (!filter_var($data['services_type_id'], FILTER_VALIDATE_INT)) {
            $this->call(400, "bad_request", "ID inválido.", "error")->back();
            return;
        }

        $type = new ServiceType();
        if (!$type->deleteById((int)$data['services_type_id'])) {
            $this->call(404, "not_found", $type->getErrorMessage(), "error")->back();
            return;
        }

        $this->call(200, "success", "Tipo de serviço removido com sucesso.", "success")->back();
    }

    

    public function servicesTypeListAll(): void           {
         $this->listAll(); 
         }
    public function servicesTypeListById(array $d): void  {
         $d['services_type_id'] = $d['servicesTypeId'] ?? null; $this->listById($d); 
         }
    public function servicesTypeInsert(array $d): void    {
         $this->insert($d); 
         }
    public function servicesTypeDelete(array $d): void    {
         $d['services_type_id'] = $d['servicesTypeId'] ?? null; $this->delete($d); 
         }
}
