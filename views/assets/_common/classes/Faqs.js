import HttpClientBase from "./HttpClientBase.js";

export default class Faqs extends HttpClientBase {
    async listAll() {
        return this.get("/faqs");
    }

    async listById(id) {
        return this.get("/faqs/:id", { id });
    }
    async listPaginator(page = 1, perPage = 10) {
        return this.get("/faqs/list/paginator/:page/:per_page", {
            page,
            per_page: perPage
        });
    }

    async insert(data) {
        return this.postForm("/faqs", data);
    }

    async update(id, data) {
        return this.putForm("/faqs/:id", data, { id });
    }

    async delete(id) {
        return this.delete("/faqs/:id", { id });
    }
}