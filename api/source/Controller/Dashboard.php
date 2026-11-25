<?php

namespace Source\Controller;

use Source\Core\Connect;

class Dashboard extends Api
{
   
    public function admin(): void
    {
        if (!$this->authToken(1)) {
            $this->call(401, "unauthorized", "Acesso de administrador necessário.", "error")->back();
            return;
        }

        $db = Connect::getInstance();
        $today = date('Y-m-d');

        $counts = $db->query("SELECT
            (SELECT COUNT(*) FROM appointments WHERE appointment_date = CURDATE() AND status <> 'cancelled') AS appointments_today,
            (SELECT COUNT(*) FROM users WHERE type_id = 2 AND active = 1) AS active_clients,
            (SELECT COUNT(*) FROM users WHERE type_id = 3 AND active = 1) AS active_employees,
            (SELECT COUNT(*) FROM services WHERE active = 1) AS active_services,
            (SELECT COUNT(*) FROM appointments WHERE status = 'pending') AS pending_appointments,
            (SELECT COUNT(*) FROM users WHERE type_id <> 1) AS total_users,
            (SELECT COUNT(*) FROM users WHERE type_id <> 1 AND active = 0) AS inactive_users,
            (SELECT COUNT(*) FROM services) AS total_services,
            (SELECT COUNT(*) FROM appointments) AS total_appointments,
            (SELECT COUNT(*) FROM appointments WHERE status IN ('pending','confirmed')
                AND (appointment_date > CURDATE() OR (appointment_date = CURDATE() AND appointment_time >= CURTIME()))) AS upcoming_appointments,
            (SELECT COUNT(*) FROM appointments WHERE status = 'completed') AS completed_appointments,
            (SELECT COUNT(*) FROM appointments WHERE status = 'cancelled') AS cancelled_appointments
        ")->fetch();

        $next = $db->query("SELECT a.id, a.user_id, a.employee_id, a.service_id,
                a.appointment_date, a.appointment_time, a.status,
                c.name AS client_name, e.name AS employee_name, s.name AS service_name
            FROM appointments a
            LEFT JOIN users c ON c.id = a.user_id
            LEFT JOIN users e ON e.id = a.employee_id
            LEFT JOIN services s ON s.id = a.service_id
            WHERE a.status IN ('pending','confirmed')
              AND (a.appointment_date > CURDATE() OR (a.appointment_date = CURDATE() AND a.appointment_time >= CURTIME()))
            ORDER BY a.appointment_date ASC, a.appointment_time ASC LIMIT 8")->fetchAll();

        $stmt = $db->prepare("SELECT a.id, a.user_id, a.employee_id, a.service_id,
                a.appointment_date, a.appointment_time, a.status,
                c.name AS client_name, e.name AS employee_name, s.name AS service_name
            FROM appointments a
            LEFT JOIN users c ON c.id = a.user_id
            LEFT JOIN users e ON e.id = a.employee_id
            LEFT JOIN services s ON s.id = a.service_id
            WHERE a.appointment_date = :today AND a.status <> 'cancelled'
            ORDER BY a.appointment_time ASC");
        $stmt->execute([':today' => $today]);
        $todayAppointments = $stmt->fetchAll();

        $staff = $db->query("SELECT id, name, email FROM users WHERE type_id = 3 AND active = 1 ORDER BY name ASC")->fetchAll();

        $this->call(200, "success", "Indicadores do painel carregados.", "success")->back([
            "counts" => $counts,
            "today_appointments" => $todayAppointments,
            "next_appointments" => $next,
            "staff" => $staff
        ]);
    }
}
