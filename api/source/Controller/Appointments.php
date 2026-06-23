<?php

namespace Source\Controller;

use Source\Models\Appointment;
use Source\Controller\Api;

class Appointments extends Api{

public function appointmentsListAll(){
        $appointment = new Appointment();
        $this->call(
            200,
            "success",
            "Lista de agendamentos",
            "success",
        )->back($appointment->listAll());
    }

    public function appointmentsListById(array $data): void
    {
        if (!filter_var($data['appointmentId'], FILTER_VALIDATE_INT)) {
            $this->call(
                400,
                "bad_request",
                "ID do agendamento é obrigatório e deve ser um número inteiro",
                "error"
            )->back();
            return;
        }

        $appointment = new Appointment();
        $appointment = $appointment->listById($data['appointmentId']);

        if ($appointment == false) {
            $this->call(
                404,
                "not_found",
                "Agendamento não encontrado",
                "error"
            )->back();
            return;
        }

        $this->call(
            200,
            "success",
            "Agendamento encontrado",
            "success"
        )->back($appointment);
    }

     public function appointmentsInsert(array $data): void
    {
        if(!$this->authToken(2)){
            $this->call(401, "unauthorized", "Acesso negado", "error")->back();
            return;
        }

        $appointment = new Appointment(null, $data['user_id'], $data['service_id'], $data['appointment_time'], $data['appointment_date'], $data['status']);

        if (!$appointment->insert()) {
            $this->call(500, "internal_server_error", $appointment->getErrorMessage(), "error")->back();
            return;
        }

        $this->call(201, "success", "Agendamento inserido com sucesso", "created")->back();
    }

     public function appointmentsDelete(array $data): void
    {
        if(!filter_var($data['appointmentId'], FILTER_VALIDATE_INT)){
            $this->call(
                400,
                "bad_request",
                "ID do agendamento é obrigatório e deve ser um número inteiro",
                "error"
            )->back();
            return;
        }

        $appointment = new Appointment();

        if($appointment->delete($data['appointmentId']) === false){
            $this->call(
                404,
                "not_found",
                "Agendamento não encontrado",
                "error"
            )->back();
            return;
        }

        $this->call(
            200,
            "success",
            "Agendamento removido com sucesso",
            "success"
        )->back();
    }

}
