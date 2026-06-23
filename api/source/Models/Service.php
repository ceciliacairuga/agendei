<?php

namespace Source\Models;

use Source\Core\Connect;
use Source\Core\Model;

class Service extends Model
{
    private ?int $id = null;
    private ?int $servicesTypeId = null;
    private ?string $name = null;
    private ?string $description = null;
    private ?int $duration = null;
    private ?float $price = null;
    private ?int $active = null;

    public function __construct(?int $id = null, ?int $servicesTypeId = null, ?string $name = null, ?string $description = null, ?int $duration = null, ?float $price = null, ?int $active = null)
    {
        $this->id = $id;
        $this->servicesTypeId = $servicesTypeId;
        $this->name = $name;
        $this->description = $description;
        $this->duration = $duration;
        $this->price = $price;
        $this->active = $active;

        $this->table = 'services'; // nome da tabela do banco
        $this->primaryKey = 'id'; // nome da chave primária da tabela
        $this->fillable = ['services_type_id', 'name', 'description', 'duration', 'price', 'active']; // camelCase

    }

    public function getId(): int
    {
        return $this->id;
    }
    public function setId(?int $id): void
    {
        $this->id = $id;
    }
    public function getName(): string
    {
        return $this->name;
    }
    public function setName(string $name): void
    {
        $this->name = $name;
    }
    public function getServicesTypeId(): int
    {
        return $this->servicesTypeId;
    }
    public function setServicesTypeId(int $servicesTypeId): void
    {
        $this->servicesTypeId = $servicesTypeId;
    }
    public function getDescription(): string
    {
        return $this->description;
    }
    public function setDescription(string $description): void
    {
        $this->description = $description;
    }
    public function getDuration(): int
    {
        return $this->duration;
    }
    public function setDuration(int $duration): void
    {
        $this->duration = $duration;
    }
    public function getPrice(): float
    {
        return $this->price;
    }
    public function setPrice(float $price): void
    {
        $this->price = $price;
    }
    public function getActive(): int
    {
        return $this->active;
    }
    public function setActive(int $active): void
    {
        $this->active = $active;
    }

    public function listAll(): array
    {
        $query = "SELECT * FROM services";
        $stmt = Connect::getInstance()->query($query);
        return $stmt->fetchAll();
    }

    public function listById(int $id): object|false
    {
        $query = "SELECT * FROM services WHERE id = :id";
        $stmt = Connect::getInstance()->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->execute();
        if ($stmt->rowCount() > 0) {
            return $stmt->fetch();
        }
        return false;
    }
}