
export default class ServiceType {
    #id;
    #name;

    constructor({ id = null, name = "" } = {}) {
        this.id = id;
        this.name = name;
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
            throw new Error("O nome do tipo de serviço é obrigatório.");
        }

        this.#name = value.trim();
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name
        };
    }

    static fromJSON(data) {
        return new ServiceType({
            id: data.id ?? null,
            name: data.name ?? ""
        });
    }

    toPayload() {
        return {
            name: this.name
        };
    }
}