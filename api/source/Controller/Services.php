<?php

namespace Source\Controller;

use Source\Models\Service;
use Source\Controller\Api;

class Services extends Api
{
    public function servicesListAll()
    {
        $service = new Service();
        $this->call(
            200,
            "success",
            "Lista de serviços",
            "success",
        )->back($service->listAll());
    }

    public function servicesListById(array $data): void
    {
        if (!filter_var($data['serviceId'], FILTER_VALIDATE_INT)) {
            $this->call(
                400,
                "bad_request",
                "ID do serviço é obrigatório e deve ser um número inteiro",
                "error"
            )->back();
            return;
        }

        $service = new Service();
        $service = $service->listById($data['serviceId']);

        if ($service == false) {
            $this->call(
                404,
                "not_found",
                "Serviço não encontrado",
                "error"
            )->back();
            return;
        }

        $this->call(
            200,
            "success",
            "Serviço encontrado",
            "success"
        )->back($service);
    }

    public function servicesInsert(array $data): void
    {
        if(!$this->authToken(2)){
            $this->call(401, "unauthorized", "Acesso negado", "error")->back();
            return;
        }

        $service = new Service(null, $data['services_type_id'], $data['name'],  $data['description'], $data['duration'], $data['price']);

        if (!$service->insert()) {
            $this->call(500, "internal_server_error", $service->getErrorMessage(), "error")->back();
            return;
        }

        $this->call(201, "success", "Serviço inserido com sucesso", "created")->back();
    }

    public function servicesDelete(array $data): void
    {
        if (!filter_var($data['serviceId'], FILTER_VALIDATE_INT)) {
            $this->call(
                400,
                "bad_request",
                "ID do serviço é obrigatório e deve ser um número inteiro",
                "error"
            )->back();
            return;
        }

        $service = new Service();
        
        if($service->delete($data['serviceId']) === false){
            $this->call(
                404,
                "not_found",
                "Serviço não encontrado",
                "error"
            )->back();
            return;
        }

        $this->call(
            200,
            "success",
            "Serviço removido com sucesso",
            "success"
        )->back();
    }
}