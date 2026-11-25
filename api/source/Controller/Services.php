<?php

namespace Source\Controller;

use Source\Core\Connect;
use Source\Models\Service;
use Source\Models\ServiceImage;
use Source\Support\Upload;

class Services extends Api
{
    
    public function listAll(): void
    {
        $db   = Connect::getInstance();
        $list = $db->query("SELECT s.*,
                (SELECT i.image_path FROM service_images i WHERE i.service_id = s.id ORDER BY i.position ASC, i.id ASC LIMIT 1) AS cover_path,
                (SELECT COUNT(*) FROM service_images i WHERE i.service_id = s.id) AS image_count
            FROM services s ORDER BY s.id ASC")->fetchAll();
        foreach ($list as $item) {
            $item->cover_url = storage_url($item->cover_path);
            $item->image_count = (int)$item->image_count;
            unset($item->cover_path);
        }
        $this->call(200, "success", "Lista de serviços.", "success")->back($list);
    }


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
            "active"         => $service->getActive(),
            "images"         => (new ServiceImage())->listByService((int)$service->getId()),
        ]);
    }

    
    public function listPaginator(array $data): void
    {
        $page    = max(1, (int)($data['page'] ?? 1));
        $perPage = max(1, (int)($data['per_page'] ?? 10));

        $service = new Service();
        $result  = $service->selectPaginator($page, $perPage);
        $this->call(200, "success", "Lista paginada de serviços.", "success")->back($result);
    }


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
            (float)$data['price'],
            isset($data['active']) ? (int)$data['active'] : 1
        );

        if (!$service->insert()) {
            $this->call(500, "internal_server_error", $service->getErrorMessage(), "error")->back();
            return;
        }

        $this->call(201, "created", "Serviço inserido com sucesso.", "success")->back([
            "id" => $service->getId(),
        ]);
    }

    
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
        if (isset($data['active']))             $service->setActive((int)$data['active']);

        if (!$service->updateById((int)$data['service_id'])) {
            $this->call(500, "internal_server_error", $service->getErrorMessage(), "error")->back();
            return;
        }

        $this->call(200, "success", "Serviço atualizado com sucesso.", "success")->back();
    }

    
    public function delete(array $data): void
    {
        if (!$this->authToken(1)) {
            $this->call(401, "unauthorized", "Acesso negado.", "error")->back();
            return;
        }

        if (!filter_var($data['service_id'] ?? null, FILTER_VALIDATE_INT)) {
            $this->call(400, "bad_request", "ID do serviço inválido.", "error")->back();
            return;
        }
        $id = (int)$data['service_id'];

        $service = new Service();
        if (!$service->selectById($id)) {
            $this->call(404, "not_found", "Serviço não encontrado.", "error")->back();
            return;
        }

        $db = Connect::getInstance();
        $used = $db->prepare("SELECT COUNT(*) FROM appointments WHERE service_id = :id");
        $used->execute([':id' => $id]);
        if ((int)$used->fetchColumn() > 0) {
            $this->call(409, "conflict", "Este serviço possui agendamentos e não pode ser excluído. Desative-o para que deixe de aparecer.", "error")->back();
            return;
        }

        // Guarda os caminhos ANTES de apagar (o cascade remove os registros).
        $paths = (new ServiceImage())->pathsByService($id);

        if (!$service->deleteById($id)) {
            $this->call(500, "internal_server_error", $service->getErrorMessage(), "error")->back();
            return;
        }

        // Banco confirmado: agora apaga os arquivos físicos.
        $upload = new Upload();
        $removed = 0;
        foreach ($paths as $path) {
            if ($upload->remove($path)) $removed++;
        }

        $this->call(200, "success", "Serviço excluído com sucesso.", "success")->back(["files_removed" => $removed]);
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
