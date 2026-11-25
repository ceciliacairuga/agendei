
export default class User {
    #id;
    #typeId;
    #name;
    #email;
    #password;
    #photo;
    #active;

    constructor({
        id = null,
        typeId = null,
        name = "",
        email = "",
        password = null,
        photo = null,
        active = 1
    } = {}) {
        this.id = id;
        this.typeId = typeId;
        this.name = name;
        this.email = email;
        this.password = password;
        this.photo = photo;
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

    get typeId() {
        return this.#typeId;
    }

    set typeId(value) {
        if (value === null || value === undefined || value === "") {
            this.#typeId = null;
            return;
        }

        const typeId = Number(value);

        if (!Number.isInteger(typeId) || typeId <= 0) {
            throw new Error("O tipo de usuário deve ser um número inteiro positivo.");
        }

        this.#typeId = typeId;
    }

    get name() {
        return this.#name;
    }

    set name(value) {
        if (typeof value !== "string" || value.trim() === "") {
            throw new Error("O nome é obrigatório.");
        }

        this.#name = value.trim();
    }

    get email() {
        return this.#email;
    }

    set email(value) {
        if (typeof value !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            throw new Error("Informe um e-mail válido.");
        }

        this.#email = value.trim();
    }

    get password() {
        return this.#password;
    }

    set password(value) {
        if (value !== null && typeof value !== "string") {
            throw new Error("A senha deve ser um texto.");
        }

        this.#password = value;
    }

    get photo() {
        return this.#photo;
    }

    set photo(value) {
        if (value !== null && typeof value !== "string") {
            throw new Error("A foto deve ser um texto ou nula.");
        }

        this.#photo = value;
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
            typeId: this.typeId,
            name: this.name,
            email: this.email,
            photo: this.photo,
            active: this.active
        };
    }

    static fromJSON(data) {
        return new User({
            id: data.id ?? null,
            typeId: data.typeId ?? data.type_id ?? null,
            name: data.name ?? "",
            email: data.email ?? "",
            photo: data.photo ?? null,
            active: data.active ?? 1
        });
    }

    toPayload() {
        const data = {
            type_id: this.typeId,
            name: this.name,
            email: this.email,
            photo: this.photo,
            active: this.active
        };

        if (this.password !== null && this.password !== "") {
            data.password = this.password;
        }

        return data;
    }
}