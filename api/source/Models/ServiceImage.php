<?php

namespace Source\Models;

use PDO;
use PDOException;
use Source\Core\Connect;
use Source\Core\Model;


class ServiceImage extends Model
{
    private ?int $id = null;
    private ?int $serviceId = null;
    private ?string $imagePath = null;
    private ?string $altText = null;
    private ?int $position = 0;

    public function __construct(?int $id = null, ?int $serviceId = null, ?string $imagePath = null, ?string $altText = null, ?int $position = 0)
    {
        $this->id = $id;
        $this->serviceId = $serviceId;
        $this->imagePath = $imagePath;
        $this->altText = $altText;
        $this->position = $position;

        $this->table = 'service_images';
        $this->primaryKey = 'id';
        $this->fillable = ['serviceId', 'imagePath', 'altText', 'position'];
    }

    public function getId(): ?int { return $this->id; }
    public function setId(?int $id): void { $this->id = $id; }
    public function getServiceId(): ?int { return $this->serviceId; }
    public function setServiceId(?int $v): void { $this->serviceId = $v; }
    public function getImagePath(): ?string { return $this->imagePath; }
    public function setImagePath(?string $v): void { $this->imagePath = $v; }
    public function getAltText(): ?string { return $this->altText; }
    public function setAltText(?string $v): void { $this->altText = $v; }
    public function getPosition(): ?int { return $this->position; }
    public function setPosition(?int $v): void { $this->position = $v; }

    /** Lista as imagens de um serviço, já com a URL pública. */
    public function listByService(int $serviceId): array
    {
        try {
            $stmt = Connect::getInstance()->prepare(
                "SELECT id, service_id, image_path, alt_text, position, created_at
                 FROM {$this->table} WHERE service_id = :sid ORDER BY position ASC, id ASC"
            );
            $stmt->execute([':sid' => $serviceId]);
            return array_map(fn($row) => self::present($row), $stmt->fetchAll());
        } catch (PDOException $e) {
            $this->errorMessage = $e->getMessage();
            return [];
        }
    }

    public function countByService(int $serviceId): int
    {
        $stmt = Connect::getInstance()->prepare("SELECT COUNT(*) AS c FROM {$this->table} WHERE service_id = :sid");
        $stmt->execute([':sid' => $serviceId]);
        return (int)$stmt->fetch()->c;
    }

    public function nextPosition(int $serviceId): int
    {
        $stmt = Connect::getInstance()->prepare("SELECT COALESCE(MAX(position), 0) + 1 AS p FROM {$this->table} WHERE service_id = :sid");
        $stmt->execute([':sid' => $serviceId]);
        return (int)$stmt->fetch()->p;
    }

    /** Busca uma imagem garantindo que pertence ao serviço informado. */
    public function findInService(int $imageId, int $serviceId): ?object
    {
        $stmt = Connect::getInstance()->prepare("SELECT * FROM {$this->table} WHERE id = :id AND service_id = :sid LIMIT 1");
        $stmt->execute([':id' => $imageId, ':sid' => $serviceId]);
        return $stmt->fetch() ?: null;
    }

    /** Caminhos (relativos) de todas as imagens de um serviço — usado ao excluir o serviço. */
    public function pathsByService(int $serviceId): array
    {
        $stmt = Connect::getInstance()->prepare("SELECT image_path FROM {$this->table} WHERE service_id = :sid");
        $stmt->execute([':sid' => $serviceId]);
        return array_map(fn($r) => $r->image_path, $stmt->fetchAll());
    }

    /** Remove o registro garantindo o vínculo com o serviço. */
    public function deleteInService(int $imageId, int $serviceId): bool
    {
        try {
            $stmt = Connect::getInstance()->prepare("DELETE FROM {$this->table} WHERE id = :id AND service_id = :sid");
            $stmt->execute([':id' => $imageId, ':sid' => $serviceId]);
            return $stmt->rowCount() === 1;
        } catch (PDOException $e) {
            $this->errorMessage = $e->getMessage();
            return false;
        }
    }

    public static function present(object $row): array
    {
        return [
            "id"         => (int)$row->id,
            "service_id" => (int)$row->service_id,
            "image_path" => $row->image_path,
            "image_url"  => storage_url($row->image_path),
            "alt_text"   => $row->alt_text,
            "position"   => (int)$row->position,
            "created_at" => $row->created_at ?? null,
        ];
    }
}
