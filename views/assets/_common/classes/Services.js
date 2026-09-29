import HttpClientBase from "./HttpClientBase.js";

export default class Services extends HttpClientBase {
    async listAll() {
        return this.get("/services");
    }

    async listById(id) {
        return this.get("/services/:id", { id });
    }

    async listPaginator(page = 1, perPage = 10) {
        return this.get("/services/list/paginator/:page/:per_page", {
            page,
            per_page: perPage
        });
    }

    async insert(data) {
        return this.postForm("/services", data);
    }

    async update(id, data) {
        return this.putForm("/services/:id", data, { id });
    }

    async delete(id) {
        return this.delete("/services/:id", { id });
    }
}