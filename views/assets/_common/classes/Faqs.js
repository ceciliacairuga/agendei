
import HttpClientBase from "./HttpClientBase.js";

export default class Faqs extends HttpClientBase {

    async listAll() {
        return this.get("/faqs/list");
    }

    async listById(id) {
        return this.get("/faqs/list/:faq_id", {
            faq_id: id
        });
    }

    async listPaginator(page = 1, perPage = 10) {
        return this.get(
            "/faqs/list/paginator/:page/:per_page",
            {
                page: page,
                per_page: perPage
            }
        );
    }

    async insert(data) {
        return this.postForm("/faqs/insert", data);
    }

    async update(id, data) {
        return this.putForm("/faqs/:faq_id", data, {
            faq_id: id
        });
    }

    async remove(id) {
        return this.delete("/faqs/:faq_id", {
            faq_id: id
        });
    }
}