<?php

namespace Source\Models;

use Source\Core\Model;

class Appointment extends Model
{
    private ?int $id = null;
    private ?int $userId = null;
    private ?int $serviceId = null;
    private ?string $appointmentTime = null;  // TIME column: "HH:MM:SS"
    private ?string $appointmentDate = null;  // DATE column: "YYYY-MM-DD"
    private ?string $status = null;           // ENUM: pending|confirmed|completed|cancelled

    public function __construct(
        ?int $id = null,
        ?int $userId = null,
        ?int $serviceId = null,
        ?string $appointmentTime = null,
        ?string $appointmentDate = null,
        ?string $status = 'pending'
    ) {
        $this->id = $id;
        $this->userId = $userId;
        $this->serviceId = $serviceId;
        $this->appointmentTime = $appointmentTime;
        $this->appointmentDate = $appointmentDate;
        $this->status = $status;

        $this->table = 'appointments';
        $this->primaryKey = 'id';
        $this->fillable = ['userId', 'serviceId', 'appointmentTime', 'appointmentDate', 'status'];
    }

    public function getId(): ?int { return $this->id; }
    public function setId(?int $id): void { $this->id = $id; }

    public function getUserId(): ?int { return $this->userId; }
    public function setUserId(?int $userId): void { $this->userId = $userId; }

    public function getServiceId(): ?int { return $this->serviceId; }
    public function setServiceId(?int $serviceId): void { $this->serviceId = $serviceId; }

    public function getAppointmentTime(): ?string { return $this->appointmentTime; }
    public function setAppointmentTime(?string $appointmentTime): void { $this->appointmentTime = $appointmentTime; }

    public function getAppointmentDate(): ?string { return $this->appointmentDate; }
    public function setAppointmentDate(?string $appointmentDate): void { $this->appointmentDate = $appointmentDate; }

    public function getStatus(): ?string { return $this->status; }
    public function setStatus(?string $status): void { $this->status = $status; }
}
