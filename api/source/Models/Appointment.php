<?php

namespace Source\Models;

use Source\Core\Connect;
use Source\Core\Model;


enum AppointmentStatus: int {
    case PENDING = 1;
    case CONFIRMED = 2;
    case COMPLETED = 3;
    case CANCELED = 4;
}
class Appointment extends Model{
    private ?int $id = null;
    private ?int $userId = null;
    private ?int $serviceId = null;
    private ?int $appointmentTime = null;
    private ?int $appointmentDate = null; 
    private ?AppointmentStatus $status = null;

    public function __construct(?int $id = null, ?int $userId = null, ?int $serviceId = null, ?int $appointmentTime = null, ?int $appointmentDate = null, ?AppointmentStatus $status = null)
    {
        $this->id = $id;
        $this->userId = $userId;
        $this->serviceId = $serviceId;
        $this->appointmentTime = $appointmentTime;
        $this->appointmentDate = $appointmentDate;
        $this->status = $status;

        $this->table = 'appointments'; // nome da tabela do banco
        $this->primaryKey = 'id'; // nome da chave primária da tabela
        $this->fillable = ['user_id', 'service_id', 'appointment_time', 'appointment_date', 'status']; // camelCase
    }

     public function getId(): int
    {
        return $this->id;
    }
    public function setId(?int $id): void
    {
        $this->id = $id;
    }
    public function getUserId(): int
    {
        return $this->userId;
    }
    public function setUserId(?int $userId): void
    {
        $this->userId = $userId;
    }
    public function getServiceId(): int
    {
        return $this->serviceId;
    }
    public function setServiceId(?int $serviceId): void
    {
        $this->serviceId = $serviceId;
    }
    public function getAppointmentTime(): int
    {
        return $this->appointmentTime;
    }
    public function setAppointmentTime(?int $appointmentTime): void
    {
        $this->appointmentTime = $appointmentTime;
    }
    public function getAppointmentDate(): int
    {
        return $this->appointmentDate;
    }
    public function setAppointmentDate(?int $appointmentDate): void
    {
        $this->appointmentDate = $appointmentDate;
    }
    public function getStatus(): ?string
    {
        return $this->status?->name;
    }
    public function setStatus(?AppointmentStatus $status): void
    {
        $this->status = $status;
    }

    public function listAll(): array
    {
        $query = "SELECT * FROM appointments";
        $stmt = Connect::getInstance()->query($query);
        return $stmt->fetchAll();
    }

    public function listById(int $id): object|false
    {
        $query = "SELECT * FROM appointments WHERE id = :id";
        $stmt = Connect::getInstance()->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->execute();
        if ($stmt->rowCount() > 0) {
            return $stmt->fetch();
        }
        return false;
    }

}