
export default class Service {
    #id;
    #servicesTypeId;
    #name;
    #description;
    #duration;
    #price;
    #active;

    constructor({id = null, servicesTypeId = null, name = "", description = null, duration = null, price = null, active = 1} = {}) {
        this.id = id;
        this.servicesTypeId = servicesTypeId;
        this.name = name;
        this.description = description;
        this.duration = duration;
        this.price = price;
        this.active = active;
    }

    get id() {
        return this.#id;
    }

    set id(value) {
        this.#id = value === null ? null : Number(value);

        if (this.#id !== null && (!Number.isInteger(this.#id) || this.#id <= 0)) {
            throw new TypeError("O ID deve ser um número inteiro positivo.");
        }
    }

    get servicesTypeId() {
        return this.#servicesTypeId;
    }

    set servicesTypeId(value) {
        this.#servicesTypeId = value === null ? null : Number(value);

        if (this.#servicesTypeId !== null &&
            (!Number.isInteger(this.#servicesTypeId) || this.#servicesTypeId <= 0)) {
            throw new TypeError("O tipo de serviço é inválido.");
        }
    }

    get name() {
        return this.#name;
    }

    set name(value) {
        if (typeof value !== "string" || value.trim() === "") {
            throw new TypeError("O nome do serviço é obrigatório.");
        }

        this.#name = value.trim();
    }

    get description() {
        return this.#description;
    }

    set description(value) {
        if (value !== null && typeof value !== "string") {
            throw new TypeError("A descrição deve ser um texto.");
        }

        this.#description = value === null ? null : value.trim();
    }

    get duration() {
        return this.#duration;
    }

    set duration(value) {
        this.#duration = value === null ? null : Number(value);

        if (this.#duration !== null &&
            (!Number.isInteger(this.#duration) || this.#duration <= 0)) {
            throw new TypeError("A duração deve ser um número inteiro positivo.");
        }
    }

    get price() {
        return this.#price;
    }

    set price(value) {
        this.#price = value === null ? null : Number(value);

        if (this.#price !== null &&
            (!Number.isFinite(this.#price) || this.#price < 0)) {
            throw new TypeError("O preço deve ser um número válido e não negativo.");
        }
    }

    get active() {
        return this.#active;
    }

    set active(value) {
        this.#active = Number(value);

        if (this.#active !== 0 && this.#active !== 1) {
            throw new TypeError("O campo active deve ser 0 ou 1.");
        }
    }

    toJSON() {
        return {
            id: this.id,
            servicesTypeId: this.servicesTypeId,
            name: this.name,
            description: this.description,
            duration: this.duration,
            price: this.price,
            active: this.active
        };
    }

    static fromJSON(data) {
        const service = new Service({
            id: data.id ?? null,
            servicesTypeId: data.servicesTypeId ?? data.services_type_id ?? null,
            name: data.name ?? "",
            description: data.description ?? null,
            duration: data.duration ?? null,
            price: data.price ?? null,
            active: data.active ?? 1
        });
        // Somente leitura (galeria): miniatura e quantidade de imagens vindas da API.
        service.cover_url = data.cover_url ?? null;
        service.image_count = Number(data.image_count ?? 0);
        return service;
    }

    toPayload() {
        return {
            services_type_id: this.servicesTypeId,
            name: this.name,
            description: this.description,
            duration: this.duration,
            price: this.price,
            active: this.active
        };
    }
}