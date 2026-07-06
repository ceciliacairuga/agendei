<?php

namespace Source\Controller;

use Source\Models\Appointment;

class Appointments extends Api
{
    // GET /appointments/list — Listar todos os agendamentos (requer auth)
    public function listAll(): void
    {
        if (!$this->authToken(2) && !$this->authToken(1)) {
            
        }
        // Rota pública de listagem 
        $appointment = new Appointment();
        $list        = $appointment->selectAll();
        $this->call(200, "success", "Lista de agendamentos.", "success")->back($list);
    }

    // GET /appointments/list/{appointment_id} — Buscar por ID (requer auth)
    public function listById(array $data): void
    {
        if (!filter_var($data['appointment_id'], FILTER_VALIDATE_INT)) {
            $this->call(400, "bad_request", "ID do agendamento inválido.", "error")->back();
            return;
        }

        $appointment = new Appointment();
        if (!$appointment->selectById((int)$data['appointment_id'])) {
            $this->call(404, "not_found", $appointment->getErrorMessage(), "error")->back();
            return;
        }

        $this->call(200, "success", "Agendamento encontrado.", "success")->back([
            "id"              => $appointment->getId(),
            "userId"          => $appointment->getUserId(),
            "serviceId"       => $appointment->getServiceId(),
            "appointmentTime" => $appointment->getAppointmentTime(),
            "appointmentDate" => $appointment->getAppointmentDate(),
            "status"          => $appointment->getStatus(),
        ]);
    }

    // GET /appointments/list/paginator/{page}/{per_page} — Paginação
    public function listPaginator(array $data): void
    {
        $page    = max(1, (int)($data['page'] ?? 1));
        $perPage = max(1, (int)($data['per_page'] ?? 10));

        $appointment = new Appointment();
        $result      = $appointment->selectPaginator($page, $perPage);
        $this->call(200, "success", "Lista paginada de agendamentos.", "success")->back($result);
    }

    // POST /appointments — Inserir agendamento (requer auth usuário comum)
    public function insert(array $data): void
    {
        if (!$this->authToken(2)) {
            $this->call(401, "unauthorized", "Acesso negado.", "error")->back();
            return;
        }

        if (empty($data['service_id']) || empty($data['appointment_time']) || empty($data['appointment_date'])) {
            $this->call(400, "bad_request", "Campos obrigatórios: service_id, appointment_time, appointment_date.", "error")->back();
            return;
        }

        $validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
        $status = $data['status'] ?? 'pending';
        if (!in_array($status, $validStatuses)) {
            $this->call(400, "bad_request", "Status inválido. Use: pending, confirmed, completed, cancelled.", "error")->back();
            return;
        }

        $appointment = new Appointment(
            null,
            $this->userAuthId,
            (int)$data['service_id'],
            $data['appointment_time'],
            $data['appointment_date'],
            $status
        );

        if (!$appointment->insert()) {
            $this->call(500, "internal_server_error", $appointment->getErrorMessage(), "error")->back();
            return;
        }

        $this->call(201, "created", "Agendamento inserido com sucesso.", "success")->back([
            "id" => $appointment->getId(),
        ]);
    }

    // PUT /appointments/{appointment_id} — Atualizar agendamento (requer auth admin)
    public function update(array $data): void
    {
        if (!$this->authToken(1)) {
            $this->call(401, "unauthorized", "Acesso negado.", "error")->back();
            return;
        }

        if (!filter_var($data['appointment_id'], FILTER_VALIDATE_INT)) {
            $this->call(400, "bad_request", "ID do agendamento inválido.", "error")->back();
            return;
        }

        $appointment = new Appointment();
        if (!$appointment->selectById((int)$data['appointment_id'])) {
            $this->call(404, "not_found", "Agendamento não encontrado.", "error")->back();
            return;
        }

        $validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
        if (!empty($data['status'])) {
            if (!in_array($data['status'], $validStatuses)) {
                $this->call(400, "bad_request", "Status inválido.", "error")->back();
                return;
            }
            $appointment->setStatus($data['status']);
        }
        if (!empty($data['appointment_time'])) $appointment->setAppointmentTime($data['appointment_time']);
        if (!empty($data['appointment_date'])) $appointment->setAppointmentDate($data['appointment_date']);
        if (!empty($data['service_id']))       $appointment->setServiceId((int)$data['service_id']);

        if (!$appointment->updateById((int)$data['appointment_id'])) {
            $this->call(500, "internal_server_error", $appointment->getErrorMessage(), "error")->back();
            return;
        }

        $this->call(200, "success", "Agendamento atualizado com sucesso.", "success")->back();
    }

    // DELETE /appointments/{appointment_id} — Remover agendamento (requer auth admin)
    public function delete(array $data): void
    {
        if (!$this->authToken(1)) {
            $this->call(401, "unauthorized", "Acesso negado.", "error")->back();
            return;
        }

        if (!filter_var($data['appointment_id'], FILTER_VALIDATE_INT)) {
            $this->call(400, "bad_request", "ID do agendamento inválido.", "error")->back();
            return;
        }

        $appointment = new Appointment();
        if (!$appointment->deleteById((int)$data['appointment_id'])) {
            $this->call(404, "not_found", $appointment->getErrorMessage(), "error")->back();
            return;
        }

        $this->call(200, "success", "Agendamento removido com sucesso.", "success")->back();
    }

    

    public function appointmentsListAll(): void            {
         $this->listAll(); 
         }
    public function appointmentsListById(array $d): void   {
         $d['appointment_id'] = $d['appointmentId'] ?? null; $this->listById($d); 
         }
    public function appointmentsInsert(array $d): void     {
         $this->insert($d); 
         }
    public function appointmentsDelete(array $d): void     {
         $d['appointment_id'] = $d['appointmentId'] ?? null; $this->delete($d); 
         }
}
