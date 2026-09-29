import HttpClientBase from "./HttpClientBase.js";

export default class ServicesType extends HttpClientBase {
    async listAll() {
        return this.get("/services-types");
    }

    async listById(id) {
        return this.get("/services-types/:id", { id });
    }
    async listPaginator(page = 1, perPage = 10) {
        return this.get("/services-types/list/paginator/:page/:per_page", {
            page,
            per_page: perPage
        });
    }

    async insert(data) {
        return this.postForm("/services-types", data);
    }

    async update(id, data) {
        return this.putForm("/services-types/:id", data, { id });
    }

    async delete(id) {
        return this.delete("/services-types/:id", { id });
    }
}