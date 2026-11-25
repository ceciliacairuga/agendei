
import HttpClientBase from "./HttpClientBase.js";

export default class FaqCategories extends HttpClientBase {

    async listAll() {
        return this.get("/faqs-categories/list");
    }

    async listById(id) {
        return this.get("/faqs-categories/list/:category_id", {
            category_id: id
        });
    }

    async listPaginator(page = 1, perPage = 10) {
        return this.get(
            "/faqs-categories/list/paginator/:page/:per_page",
            {
                page: page,
                per_page: perPage
            }
        );
    }

    async insert(data) {
        return this.postForm("/faqs-categories/insert", data);
    }

    async update(id, data) {
        return this.putForm("/faqs-categories/:category_id", data, {
            category_id: id
        });
    }

    async remove(id) {
        return this.delete("/faqs-categories/:category_id", {
            category_id: id
        });
    }
}