<?php

namespace Source\Models\Faqs;

use Source\Core\Connect;
use Source\Core\Model;

class FaqCategory extends Model
{
    private ?int $id = null;
    private ?string $name = null;
    private ?int $active = null;

    public function __construct(?int $id = null, ?string $name = null, ?int $active = 1)
    {
        $this->id = $id;
        $this->name = $name;
        $this->active = $active;

        $this->table = 'faqs_categories';
        $this->primaryKey = 'id';
        $this->fillable = ['name', 'active'];
    }

    public function getId(): ?int { return $this->id; }
    public function setId(?int $id): void { $this->id = $id; }

    public function getName(): ?string { return $this->name; }
    public function setName(?string $name): void { $this->name = $name; }

    public function getActive(): ?int { return $this->active; }
    public function setActive(?int $active): void { $this->active = $active; }

    /**
     * Soft-delete protegido: bloqueia remoção se houver FAQs ativos vinculados.
     * Retorna 400 (int) se há dependências, false se não encontrado, true se removido.
     */
    public function safeDelete(int $id): int|bool
    {
        $query = "SELECT id FROM faqs WHERE faqs_category_id = :id AND active = 1";
        $stmt  = Connect::getInstance()->prepare($query);
        $stmt->bindValue(':id', $id);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            return 400; // dependências ativas
        }

        return $this->softDeleteById($id);
    }
}
