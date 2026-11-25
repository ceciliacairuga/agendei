
import HttpClientBase from "./HttpClientBase.js";

export default class Services extends HttpClientBase {

    async listAll() {
        return this.get("/services/list");
    }

    async listById(id) {
        return this.get("/services/list/:service_id", {
            service_id: id
        });
    }

    async listPaginator(page = 1, perPage = 10) {
        return this.get(
            "/services/list/paginator/:page/:per_page",
            {
                page: page,
                per_page: perPage
            }
        );
    }

    async insert(data) {
        return this.postForm("/services/insert", data);
    }

    async update(id, data) {
        return this.putForm(
            "/services/update/:service_id",
            data,
            {
                service_id: id
            }
        );
    }

    async remove(id) {
        return this.delete("/services/delete/:service_id", {
            service_id: id
        });
    }
}