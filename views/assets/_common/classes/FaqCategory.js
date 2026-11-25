
export default class FaqCategory {
    #id;
    #name;
    #active;

    constructor({ id = null, name = "", active = 1 } = {}) {
        this.id = id;
        this.name = name;
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

    get name() {
        return this.#name;
    }

    set name(value) {
        if (typeof value !== "string" || value.trim() === "") {
            throw new Error("O nome da categoria é obrigatório.");
        }

        this.#name = value.trim();
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
            name: this.name,
            active: this.active
        };
    }

    static fromJSON(data) {
        return new FaqCategory({
            id: data.id ?? null,
            name: data.name ?? "",
            active: data.active ?? 1
        });
    }

    toPayload() {
        return {
            name: this.name,
            active: this.active
        };
    }
}