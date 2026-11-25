<?php

namespace Source\Controller;

use Source\Models\User;
use Source\Core\JWTToken;

class Api
{

    protected int $userAuthId = 0;

    public function authToken (int $typeId): bool
    {

        $header = function_exists('getallheaders') ? getallheaders() : [];

        // Apache/WAMP pode disponibilizar Authorization apenas em HTTP_AUTHORIZATION.
        $token = $header["token"] ?? $header['Authorization'] ?? $header['authorization']
            ?? $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? null;

        if(!$token){
            return false;
        }

        if(str_starts_with($token, 'Bearer ')){
            $token = substr($token, 7);
        }

        $jwt = new JWTToken();

        $jwtToken = $jwt->decode($token);

        if(!$jwtToken){
            return false;
        }

        //var_dump($jwtToken->data->id, $jwtToken->data->email);
        $user = new User();
        if(!$user->permissionVerify($jwtToken->data->email, $typeId)){
            return false;
        }

        $this->userAuthId = $jwtToken->data->id;

        return true;

    }

    protected function call (int $code, ?string $status = null, ?string $message = null, ?string $type = null): Api
    {
        http_response_code($code);
        if(!empty($status)){
            $this->response = [
                "code" => $code,
                "type" => $type,
                "status" => $status,
                "message" => (!empty($message) ? $message : null)
            ];
        }
        return $this;
    }

    protected function back(object | array $data = null): Api
    {
        header('Content-Type: application/json');
        // Inclui também arrays vazios: [] é uma resposta válida para listas sem registros.
        if ($data !== null) {
            $this->response["data"] = $data;
        }
        echo json_encode($this->response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        return $this;
    }

    public function hello(): void
    {
        $this->call(200, "success", "API ativa", "success")->back([
            "message" => "hello",
            "environment" => "agendei/api"
        ]);
    }

}