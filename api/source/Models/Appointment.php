<?php

namespace Source\Models;

use Source\Core\Model;

class Appointment extends Model
{
    private ?int $id = null;
    private ?int $userId = null;
    private ?int $employeeId = null;
    private ?int $serviceId = null;
    private ?string $appointmentTime = null;
    private ?string $appointmentDate = null;
    private ?string $status = null;

    public function __construct(?int $id = null, ?int $userId = null, ?int $serviceId = null,
        ?string $appointmentTime = null, ?string $appointmentDate = null,
        ?string $status = 'pending', ?int $employeeId = null)
    {
        $this->id = $id;
        $this->userId = $userId;
        $this->employeeId = $employeeId;
        $this->serviceId = $serviceId;
        $this->appointmentTime = $appointmentTime;
        $this->appointmentDate = $appointmentDate;
        $this->status = $status;
        $this->table = 'appointments';
        $this->primaryKey = 'id';
        $this->fillable = ['userId', 'employeeId', 'serviceId', 'appointmentTime', 'appointmentDate', 'status'];
    }

    public function getId(): ?int { return $this->id; }
    public function setId(?int $id): void { $this->id = $id; }
    public function getUserId(): ?int { return $this->userId; }
    public function setUserId(?int $id): void { $this->userId = $id; }
    public function getEmployeeId(): ?int { return $this->employeeId; }
    public function setEmployeeId(?int $id): void { $this->employeeId = $id; }
    public function getServiceId(): ?int { return $this->serviceId; }
    public function setServiceId(?int $id): void { $this->serviceId = $id; }
    public function getAppointmentTime(): ?string { return $this->appointmentTime; }
    public function setAppointmentTime(?string $time): void { $this->appointmentTime = $time; }
    public function getAppointmentDate(): ?string { return $this->appointmentDate; }
    public function setAppointmentDate(?string $date): void { $this->appointmentDate = $date; }
    public function getStatus(): ?string { return $this->status; }
    public function setStatus(?string $status): void { $this->status = $status; }

    public function selectByUserId(int $userId): array
    {
        $db = \Source\Core\Connect::getInstance();
        $stmt = $db->prepare("SELECT * FROM {$this->table} WHERE user_id=:id ORDER BY appointment_date, appointment_time");
        $stmt->execute([':id' => $userId]);
        return $stmt->fetchAll();
    }
}
