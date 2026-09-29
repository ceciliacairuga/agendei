import HttpClientBase from "./HttpClientBase.js";

export default class FaqCategories extends HttpClientBase {
    async listAll() {
        return this.get("/faqs-categories");
    }

    async listById(id) {
        return this.get("/faqs-categories/:id", { id });
    }
    async listPaginator(page = 1, perPage = 10) {
        return this.get("/faqs-categories/list/paginator/:page/:per_page", {
            page,
            per_page: perPage
        });
    }

    async insert(data) {
        return this.postForm("/faqs-categories", data);
    }

    async update(id, data) {
        return this.putForm("/faqs-categories/:id", data, { id });
    }

    async delete(id) {
        return this.delete("/faqs-categories/:id", { id });
    }
}