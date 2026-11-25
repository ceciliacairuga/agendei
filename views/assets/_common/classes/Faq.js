
export default class Faq {
    #id;
    #faqsCategoryId;
    #question;
    #answer;
    #active;

    constructor({
        id = null,
        faqsCategoryId = null,
        question = "",
        answer = "",
        active = 1
    } = {}) {
        this.id = id;
        this.faqsCategoryId = faqsCategoryId;
        this.question = question;
        this.answer = answer;
        this.active = active;
    }

    get id() {
        return this.#id;
    }

    set id(value) {
        if (value === null || value === undefined || value === "") {
            this.#id = null;
            return;
        }

        const id = Number(value);

        if (!Number.isInteger(id) || id <= 0) {
            throw new Error("O ID deve ser um número inteiro positivo.");
        }

        this.#id = id;
    }

    get faqsCategoryId() {
        return this.#faqsCategoryId;
    }

    set faqsCategoryId(value) {
        if (value === null || value === undefined || value === "") {
            this.#faqsCategoryId = null;
            return;
        }

        const categoryId = Number(value);

        if (!Number.isInteger(categoryId) || categoryId <= 0) {
            throw new Error("A categoria deve ter um ID válido.");
        }

        this.#faqsCategoryId = categoryId;
    }

    get question() {
        return this.#question;
    }

    set question(value) {
        if (typeof value !== "string" || value.trim() === "") {
            throw new Error("A pergunta é obrigatória.");
        }

        this.#question = value.trim();
    }

    get answer() {
        return this.#answer;
    }

    set answer(value) {
        if (typeof value !== "string" || value.trim() === "") {
            throw new Error("A resposta é obrigatória.");
        }

        this.#answer = value.trim();
    }

    get active() {
        return this.#active;
    }

    set active(value) {
        const active = Number(value);

        if (active !== 0 && active !== 1) {
            throw new Error("O campo ativo deve ser 0 ou 1.");
        }

        this.#active = active;
    }

    toJSON() {
        return {
            id: this.id,
            faqsCategoryId: this.faqsCategoryId,
            question: this.question,
            answer: this.answer,
            active: this.active
        };
    }

    static fromJSON(data) {
        return new Faq({
            id: data.id ?? null,
            faqsCategoryId: data.faqsCategoryId ?? data.faqs_category_id ?? null,
            question: data.question ?? "",
            answer: data.answer ?? "",
            active: data.active ?? 1
        });
    }

    toPayload() {
        return {
            faqs_category_id: this.faqsCategoryId,
            question: this.question,
            answer: this.answer,
            active: this.active
        };
    }
}