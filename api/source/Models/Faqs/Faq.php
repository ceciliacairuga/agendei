<?php

namespace Source\Models\Faqs;

use Source\Core\Connect;
use Source\Core\Model;

class Faq extends Model
{
    private ?int $id = null;
    private ?int $faqsCategoryId = null;
    private ?string $question = null;
    private ?string $answer = null;
    private ?int $active = null;

    public function __construct(
        ?int $id = null,
        ?int $faqsCategoryId = null,
        ?string $question = null,
        ?string $answer = null,
        ?int $active = 1
    ) {
        $this->id = $id;
        $this->faqsCategoryId = $faqsCategoryId;
        $this->question = $question;
        $this->answer = $answer;
        $this->active = $active;

        $this->table = 'faqs';
        $this->primaryKey = 'id';
        $this->fillable = ['faqsCategoryId', 'question', 'answer', 'active'];
    }

    public function getId(): ?int { return $this->id; }
    public function setId(?int $id): void { $this->id = $id; }

    public function getFaqsCategoryId(): ?int { return $this->faqsCategoryId; }
    public function setFaqsCategoryId(?int $faqsCategoryId): void { $this->faqsCategoryId = $faqsCategoryId; }

    public function getQuestion(): ?string { return $this->question; }
    public function setQuestion(?string $question): void { $this->question = $question; }

    public function getAnswer(): ?string { return $this->answer; }
    public function setAnswer(?string $answer): void { $this->answer = $answer; }

    public function getActive(): ?int { return $this->active; }
    public function setActive(?int $active): void { $this->active = $active; }

    /** Lista todos os FAQs com JOIN na categoria (mantém comportamento original) */
    public function listAllWithCategory(): array
    {
        $query = "SELECT f.id, f.faqs_category_id, f.question, f.answer, c.name AS category_name
                  FROM faqs AS f
                  JOIN faqs_categories AS c ON f.faqs_category_id = c.id
                  WHERE f.active = 1";
        $stmt = Connect::getInstance()->query($query);
        return $stmt->fetchAll();
    }
}
