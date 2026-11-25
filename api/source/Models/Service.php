<?php

namespace Source\Models;

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

    public function __construct(
        ?int $id = null,
        ?int $servicesTypeId = null,
        ?string $name = null,
        ?string $description = null,
        ?int $duration = null,
        ?float $price = null,
        ?int $active = 1
    ) {
        $this->id = $id;
        $this->servicesTypeId = $servicesTypeId;
        $this->name = $name;
        $this->description = $description;
        $this->duration = $duration;
        $this->price = $price;
        $this->active = $active;

        $this->table = 'services';
        $this->primaryKey = 'id';
        $this->fillable = ['servicesTypeId', 'name', 'description', 'duration', 'price', 'active'];
    }

    public function getId(): ?int { return $this->id; }
    public function setId(?int $id): void { $this->id = $id; }

    public function getServicesTypeId(): ?int { return $this->servicesTypeId; }
    public function setServicesTypeId(?int $servicesTypeId): void { $this->servicesTypeId = $servicesTypeId; }

    public function getName(): ?string { return $this->name; }
    public function setName(?string $name): void { $this->name = $name; }

    public function getDescription(): ?string { return $this->description; }
    public function setDescription(?string $description): void { $this->description = $description; }

    public function getDuration(): ?int { return $this->duration; }
    public function setDuration(?int $duration): void { $this->duration = $duration; }

    public function getPrice(): ?float { return $this->price; }
    public function setPrice(?float $price): void { $this->price = $price; }

    public function getActive(): ?int { return $this->active; }
    public function setActive(?int $active): void { $this->active = $active; }
}
