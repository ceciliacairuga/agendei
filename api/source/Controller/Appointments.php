<?php

namespace Source\Controller;

use Source\Core\Connect;
use Source\Models\Appointment;

class Appointments extends Api
{
    private const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];

    private const SELECT_BASE = "SELECT a.id, a.user_id, a.employee_id, a.service_id, a.appointment_time,
                       a.appointment_date, a.status, c.name AS client_name, c.email AS client_email,
                       e.name AS employee_name, s.name AS service_name,
                       s.duration AS service_duration, s.price AS service_price
                FROM appointments a
                LEFT JOIN users c ON c.id = a.user_id
                LEFT JOIN users e ON e.id = a.employee_id
                LEFT JOIN services s ON s.id = a.service_id";

  
    public function listAll(): void
    {
        $isCustomer = $this->authToken(2);
        $isAdmin = false;
        if (!$isCustomer) $isAdmin = $this->authToken(1);
        if (!$isCustomer && !$isAdmin) {
            $this->call(401, "unauthorized", "Usuário não autenticado.", "error")->back();
            return;
        }

        $where = [];
        $params = [];

        if ($isAdmin) {
            if (($date = trim((string)($_GET['date'] ?? ''))) !== '') {
                if (!$this->validDate($date)) { $this->call(400, "bad_request", "Filtro de data inválido.", "error")->back(); return; }
                $where[] = "a.appointment_date = :f_date";
                $params[':f_date'] = $date;
            }
            if (($status = trim((string)($_GET['status'] ?? ''))) !== '') {
                if (!in_array($status, self::STATUSES, true)) { $this->call(400, "bad_request", "Filtro de status inválido.", "error")->back(); return; }
                $where[] = "a.status = :f_status";
                $params[':f_status'] = $status;
            }
            if (($serviceId = (int)($_GET['service_id'] ?? 0)) > 0) {
                $where[] = "a.service_id = :f_service";
                $params[':f_service'] = $serviceId;
            }
            if (($employeeId = (int)($_GET['employee_id'] ?? 0)) > 0) {
                $where[] = "a.employee_id = :f_employee";
                $params[':f_employee'] = $employeeId;
            }
            if (($client = trim((string)($_GET['client'] ?? ''))) !== '') {
                $where[] = "(c.name LIKE :f_client_name OR c.email LIKE :f_client_email)";
                $like = '%' . str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $client) . '%';
                $params[':f_client_name'] = $like;
                $params[':f_client_email'] = $like;
            }
        } else {
            // A autenticação comum também permite funcionários (type_id 3).
            $where[] = "(a.user_id = :user_id OR a.employee_id = :employee_id)";
            $params[':user_id'] = $this->userAuthId;
            $params[':employee_id'] = $this->userAuthId;
        }

        $sql = self::SELECT_BASE . ($where ? " WHERE " . implode(" AND ", $where) : "")
             . " ORDER BY a.appointment_date ASC, a.appointment_time ASC, a.id ASC";
        $stmt = Connect::getInstance()->prepare($sql);
        $stmt->execute($params);
        $this->call(200, "success", "Lista de agendamentos.", "success")->back($stmt->fetchAll());
    }

    public function listById(array $data): void
    {
        $isCustomer = $this->authToken(2);
        $isAdmin = false;
        if (!$isCustomer) $isAdmin = $this->authToken(1);
        if (!$isCustomer && !$isAdmin) {
            $this->call(401, "unauthorized", "Usuário não autenticado.", "error")->back(); return;
        }
        $id = (int)($data['appointment_id'] ?? 0);
        if ($id < 1) { $this->call(400, "bad_request", "ID inválido.", "error")->back(); return; }

        $stmt = Connect::getInstance()->prepare(self::SELECT_BASE . " WHERE a.id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $item = $stmt->fetch();
        if (!$item) { $this->call(404, "not_found", "Agendamento não encontrado.", "error")->back(); return; }
        // Usuário comum só pode consultar agendamentos próprios.
        if (!$isAdmin && $this->userAuthId !== (int)$item->user_id && $this->userAuthId !== (int)($item->employee_id ?? 0)) {
            $this->call(403, "forbidden", "Acesso negado.", "error")->back(); return;
        }
        $this->call(200, "success", "Agendamento encontrado.", "success")->back($item);
    }

    
    public function availability(): void
    {
        if (!$this->authToken(2)) {
            $this->call(401, "unauthorized", "Entre na sua conta para consultar os horários.", "error")->back(); return;
        }

        $serviceId = (int)($_GET['service_id'] ?? 0);
        $date = trim((string)($_GET['date'] ?? ''));
        $employeeId = (int)($_GET['employee_id'] ?? 0) ?: null;

        if ($serviceId < 1 || !$this->validDate($date)) {
            $this->call(400, "bad_request", "Informe um serviço e uma data válidos.", "error")->back(); return;
        }
        if (($msg = $this->dateRangeError($date)) !== null) {
            $this->call(400, "bad_request", $msg, "error")->back(); return;
        }

        $service = $this->activeService($serviceId);
        if (!$service) {
            $this->call(400, "bad_request", "O serviço selecionado não está disponível.", "error")->back(); return;
        }
        if ($employeeId !== null && !$this->activeEmployee($employeeId)) {
            $this->call(400, "bad_request", "Profissional não encontrado ou inativo.", "error")->back(); return;
        }

        $duration = (int)$service->duration;
        $slots = [];
        for ($m = $this->toMinutes(CONF_APPT_OPEN); $m + $duration <= $this->toMinutes(CONF_APPT_CLOSE); $m += CONF_APPT_STEP_MINUTES) {
            $reason = $this->slotProblem($date, $m, $duration, $employeeId, $this->userAuthId, null);
            $slots[] = ["time" => $this->fromMinutes($m), "available" => $reason === null, "reason" => $reason];
        }

        $this->call(200, "success", "Horários do dia.", "success")->back([
            "date" => $date,
            "service_id" => $serviceId,
            "duration" => $duration,
            "open" => CONF_APPT_OPEN,
            "close" => CONF_APPT_CLOSE,
            "slots" => $slots,
        ]);
    }

    
    public function insert(array $data): void
    {
        if (!$this->authToken(2)) {
            $this->call(401, "unauthorized", "Acesso negado.", "error")->back(); return;
        }
        $serviceId = (int)($data['service_id'] ?? 0);
        $date = trim((string)($data['appointment_date'] ?? ''));
        $time = trim((string)($data['appointment_time'] ?? ''));
        $employeeId = !empty($data['employee_id']) ? (int)$data['employee_id'] : null;

        if ($serviceId < 1 || !$this->validDate($date) || !$this->validTime($time)) {
            $this->call(400, "bad_request", "Selecione um serviço, uma data e um horário válidos.", "error")->back(); return;
        }
        if (($msg = $this->dateRangeError($date)) !== null) {
            $this->call(400, "bad_request", $msg, "error")->back(); return;
        }

        $service = $this->activeService($serviceId);
        if (!$service) { $this->call(400, "bad_request", "O serviço selecionado não está disponível.", "error")->back(); return; }
        if ($employeeId !== null && !$this->activeEmployee($employeeId)) {
            $this->call(400, "bad_request", "Funcionário selecionado não encontrado ou inativo.", "error")->back(); return;
        }

        $time = substr($time, 0, 5) . ':00';
        $start = $this->toMinutes($time);
        $db = Connect::getInstance();

        // Serializa checagem + gravação por data: evita dois clientes pegarem o mesmo horário ao mesmo tempo.
        $lockName = 'agendei_appt_' . $date;
        $locked = (int)$db->query("SELECT GET_LOCK(" . $db->quote($lockName) . ", 5)")->fetchColumn() === 1;
        try {
            if (!$locked) {
                $this->call(503, "service_unavailable", "Sistema ocupado. Tente novamente em instantes.", "error")->back(); return;
            }

            $problem = $this->slotProblem($date, $start, (int)$service->duration, $employeeId, $this->userAuthId, null);
            if ($problem !== null) {
                $this->call(409, "conflict", $problem, "error")->back(); return;
            }

            $appointment = new Appointment(null, $this->userAuthId, $serviceId, $time, $date, 'pending', $employeeId);
            if (!$appointment->insert()) {
                $this->call(500, "internal_server_error", "Não foi possível salvar o agendamento.", "error")->back(); return;
            }
        } finally {
            if ($locked) $db->query("SELECT RELEASE_LOCK(" . $db->quote($lockName) . ")");
        }

        $stmt = $db->prepare(self::SELECT_BASE . " WHERE a.id = :id");
        $stmt->execute([':id' => $appointment->getId()]);
        $this->call(201, "created", "Agendamento criado com sucesso.", "success")->back($stmt->fetch());
    }

   
    public function cancel(array $data): void
    {
        if (!$this->authToken(2)) {
            $this->call(401, "unauthorized", "Acesso negado.", "error")->back(); return;
        }
        $id = (int)($data['appointment_id'] ?? 0);
        if ($id < 1) { $this->call(400, "bad_request", "ID inválido.", "error")->back(); return; }

        $db = Connect::getInstance();
        $stmt = $db->prepare("SELECT id, user_id, appointment_date, appointment_time, status FROM appointments WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $item = $stmt->fetch();

        // 404 também para agendamento de outra pessoa: não revela a existência.
        if (!$item || (int)$item->user_id !== $this->userAuthId) {
            $this->call(404, "not_found", "Agendamento não encontrado.", "error")->back(); return;
        }
        if (!in_array($item->status, ['pending', 'confirmed'], true)) {
            $this->call(409, "conflict", $item->status === 'cancelled' ? "Este agendamento já foi cancelado." : "Este agendamento não pode mais ser cancelado.", "error")->back(); return;
        }
        $startTs = strtotime($item->appointment_date . ' ' . $item->appointment_time);
        if ($startTs - time() < CONF_APPT_CANCEL_MIN_HOURS * 3600) {
            $this->call(409, "conflict", "O cancelamento deve ser feito com pelo menos " . CONF_APPT_CANCEL_MIN_HOURS . " horas de antecedência. Entre em contato com o salão.", "error")->back(); return;
        }

        $upd = $db->prepare("UPDATE appointments SET status = 'cancelled' WHERE id = :id AND user_id = :uid AND status IN ('pending','confirmed')");
        $upd->execute([':id' => $id, ':uid' => $this->userAuthId]);
        if ($upd->rowCount() !== 1) {
            $this->call(409, "conflict", "Não foi possível cancelar o agendamento.", "error")->back(); return;
        }
        $this->call(200, "success", "Agendamento cancelado com sucesso.", "success")->back(["id" => $id, "status" => "cancelled"]);
    }

    
    public function update(array $data): void
    {
        if (!$this->authToken(1)) {
            $this->call(401, "unauthorized", "Acesso de administrador necessário.", "error")->back();
            return;
        }

        $id = (int)($data['appointment_id'] ?? 0);
        if ($id < 1) {
            $this->call(400, "bad_request", "ID de agendamento inválido.", "error")->back();
            return;
        }

        $db = Connect::getInstance();
        $exists = $db->prepare("SELECT * FROM appointments WHERE id = :id LIMIT 1");
        $exists->execute([':id' => $id]);
        $current = $exists->fetch();
        if (!$current) {
            $this->call(404, "not_found", "Agendamento não encontrado.", "error")->back();
            return;
        }

        $fields = [];
        $params = [':id' => $id];
        $newStatus = $current->status;
        $newDate = $current->appointment_date;
        $newTime = $current->appointment_time;
        $newService = (int)$current->service_id;
        $newEmployee = $current->employee_id !== null ? (int)$current->employee_id : null;
        $scheduleChanged = false;

        if (array_key_exists('status', $data)) {
            if (!in_array($data['status'], self::STATUSES, true)) {
                $this->call(400, "bad_request", "Status inválido.", "error")->back();
                return;
            }
            $newStatus = $data['status'];
            $fields[] = "status = :status";
            $params[':status'] = $newStatus;
        }

        if (array_key_exists('appointment_date', $data)) {
            $date = trim((string)$data['appointment_date']);
            if (!$this->validDate($date)) {
                $this->call(400, "bad_request", "Data inválida.", "error")->back();
                return;
            }
            $newDate = $date;
            $scheduleChanged = $scheduleChanged || $date !== $current->appointment_date;
            $fields[] = "appointment_date = :appointment_date";
            $params[':appointment_date'] = $date;
        }

        if (array_key_exists('appointment_time', $data)) {
            $time = trim((string)$data['appointment_time']);
            if (!$this->validTime($time)) {
                $this->call(400, "bad_request", "Horário inválido.", "error")->back();
                return;
            }
            $time = substr($time, 0, 5) . ':00';
            $newTime = $time;
            $scheduleChanged = $scheduleChanged || $time !== $current->appointment_time;
            $fields[] = "appointment_time = :appointment_time";
            $params[':appointment_time'] = $time;
        }

        if (array_key_exists('service_id', $data)) {
            $serviceId = (int)$data['service_id'];
            if (!$this->activeService($serviceId)) {
                $this->call(400, "bad_request", "Serviço não encontrado ou inativo.", "error")->back();
                return;
            }
            $newService = $serviceId;
            $scheduleChanged = $scheduleChanged || $serviceId !== (int)$current->service_id;
            $fields[] = "service_id = :service_id";
            $params[':service_id'] = $serviceId;
        }

        if (array_key_exists('employee_id', $data)) {
            $employeeId = trim((string)$data['employee_id']) === '' ? null : (int)$data['employee_id'];
            if ($employeeId !== null && !$this->activeEmployee($employeeId)) {
                $this->call(400, "bad_request", "Funcionário não encontrado ou inativo.", "error")->back();
                return;
            }
            $newEmployee = $employeeId;
            $scheduleChanged = $scheduleChanged || $employeeId !== ($current->employee_id !== null ? (int)$current->employee_id : null);
            $fields[] = "employee_id = :employee_id";
            $params[':employee_id'] = $employeeId;
        }

        if (!$fields) {
            $this->call(400, "bad_request", "Nenhuma informação foi enviada para atualização.", "error")->back();
            return;
        }

        // Reativar (de cancelado) ou mudar data/hora/serviço/profissional exige horário livre.
        $reactivating = $current->status === 'cancelled' && $newStatus !== 'cancelled';
        $needsCheck = $newStatus !== 'cancelled' && ($scheduleChanged || $reactivating);
        $lockName = 'agendei_appt_' . $newDate;
        $locked = false;
        try {
            if ($needsCheck) {
                $locked = (int)$db->query("SELECT GET_LOCK(" . $db->quote($lockName) . ", 5)")->fetchColumn() === 1;
                $svc = $this->activeService($newService) ?: $this->anyService($newService);
                if (!$svc) {
                    $this->call(400, "bad_request", "Serviço não encontrado.", "error")->back();
                    return;
                }
                $problem = $this->slotProblem($newDate, $this->toMinutes($newTime), (int)$svc->duration, $newEmployee, (int)$current->user_id, $id, false);
                if ($problem !== null) {
                    $this->call(409, "conflict", $problem, "error")->back();
                    return;
                }
            }

            $stmt = $db->prepare("UPDATE appointments SET " . implode(', ', $fields) . " WHERE id = :id");
            $stmt->execute($params);
        } finally {
            if ($locked) $db->query("SELECT RELEASE_LOCK(" . $db->quote($lockName) . ")");
        }

        $this->call(200, "success", "Agendamento atualizado com sucesso.", "success")->back();
    }

    public function delete(array $data): void
    {
        if (!$this->authToken(1)) { $this->call(401, "unauthorized", "Acesso de administrador necessário.", "error")->back(); return; }
        $id = (int)($data['appointment_id'] ?? 0);
        $appointment = new Appointment();
        if ($id < 1 || !$appointment->deleteById($id)) { $this->call(404, "not_found", "Agendamento não encontrado.", "error")->back(); return; }
        $this->call(200, "success", "Agendamento excluído.", "success")->back();
    }

    
    /**
     * Retorna null se o horário está livre ou a mensagem do motivo se não está.
     * @param int      $startMin      início, em minutos desde 00:00
     * @param int|null $excludeId     agendamento a ignorar (edição)
     * @param bool     $enforceFuture exige horário futuro (cliente). O admin pode remarcar livremente.
     */
    private function slotProblem(string $date, int $startMin, int $duration, ?int $employeeId, int $userId, ?int $excludeId, bool $enforceFuture = true): ?string
    {
        $endMin = $startMin + $duration;

        if ($startMin < $this->toMinutes(CONF_APPT_OPEN) || $endMin > $this->toMinutes(CONF_APPT_CLOSE)) {
            return "Horário fora do funcionamento do salão (" . CONF_APPT_OPEN . " às " . CONF_APPT_CLOSE . ").";
        }
        if (($startMin - $this->toMinutes(CONF_APPT_OPEN)) % CONF_APPT_STEP_MINUTES !== 0) {
            return "Escolha um dos horários disponíveis.";
        }
        if ($enforceFuture) {
            $startTs = strtotime($date . ' ' . $this->fromMinutes($startMin));
            if ($startTs <= time()) {
                return $date < date('Y-m-d') ? "Não é possível agendar em uma data passada." : "Este horário já passou.";
            }
        }

        $db = Connect::getInstance();
        $stmt = $db->prepare("SELECT a.id, a.user_id, a.employee_id, a.appointment_time, s.duration
                              FROM appointments a JOIN services s ON s.id = a.service_id
                              WHERE a.appointment_date = :d AND a.status <> 'cancelled'");
        $stmt->execute([':d' => $date]);

        $overlapAll = 0;
        foreach ($stmt->fetchAll() as $row) {
            if ($excludeId !== null && (int)$row->id === $excludeId) continue;
            $s = $this->toMinutes($row->appointment_time);
            $e = $s + (int)$row->duration;
            if (!($startMin < $e && $s < $endMin)) continue;   // sem sobreposição

            if ((int)$row->user_id === $userId) {
                return "Você já possui um agendamento neste horário.";
            }
            if ($employeeId !== null && (int)$row->employee_id === $employeeId) {
                return "Este profissional já possui um agendamento nesse horário.";
            }
            $overlapAll++;
        }

        if ($employeeId === null) {
            // "Qualquer profissional": há vaga enquanto houver menos agendamentos simultâneos que profissionais ativos.
            $capacity = max(1, (int)$db->query("SELECT COUNT(*) FROM users WHERE type_id = 3 AND active = 1")->fetchColumn());
            if ($overlapAll >= $capacity) {
                return "Horário indisponível.";
            }
        }
        return null;
    }

    private function dateRangeError(string $date): ?string
    {
        if ($date < date('Y-m-d')) return "Não é possível agendar em uma data passada.";
        if ($date > date('Y-m-d', strtotime('+' . CONF_APPT_MAX_DAYS_AHEAD . ' days'))) {
            return "Só é possível agendar com até " . CONF_APPT_MAX_DAYS_AHEAD . " dias de antecedência.";
        }
        return null;
    }

    private function activeService(int $id): ?object
    {
        $stmt = Connect::getInstance()->prepare("SELECT id, duration FROM services WHERE id = :id AND active = 1 LIMIT 1");
        $stmt->execute([':id' => $id]);
        return $stmt->fetch() ?: null;
    }

    private function anyService(int $id): ?object
    {
        $stmt = Connect::getInstance()->prepare("SELECT id, duration FROM services WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        return $stmt->fetch() ?: null;
    }

    private function activeEmployee(int $id): bool
    {
        $stmt = Connect::getInstance()->prepare("SELECT id FROM users WHERE id = :id AND type_id = 3 AND active = 1 LIMIT 1");
        $stmt->execute([':id' => $id]);
        return (bool)$stmt->fetch();
    }

    private function toMinutes(string $time): int
    {
        [$h, $m] = array_map('intval', explode(':', $time));
        return $h * 60 + $m;
    }

    private function fromMinutes(int $min): string
    {
        return sprintf('%02d:%02d', intdiv($min, 60), $min % 60);
    }

    private function validDate(string $date): bool { $d = \DateTime::createFromFormat('Y-m-d', $date); return $d && $d->format('Y-m-d') === $date; }
    private function validTime(string $time): bool { return (bool)preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/', $time); }

    public function appointmentsListAll(): void { $this->listAll(); }
    public function appointmentsListById(array $d): void { $d['appointment_id'] = $d['appointmentId'] ?? null; $this->listById($d); }
    public function appointmentsInsert(array $d): void { $this->insert($d); }
    public function appointmentsDelete(array $d): void { $d['appointment_id'] = $d['appointmentId'] ?? null; $this->delete($d); }
}
