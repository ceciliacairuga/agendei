
import HttpClientBase from "./HttpClientBase.js";

export default class ServicesType extends HttpClientBase {

    async listAll() {
        return this.get("/services-type/list");
    }

    async listById(id) {
        return this.get("/services-type/list/:services_type_id", {
            services_type_id: id
        });
    }

    async listPaginator(page = 1, perPage = 10) {
        return this.get(
            "/services-type/list/paginator/:page/:per_page",
            {
                page: page,
                per_page: perPage
            }
        );
    }

    async insert(data) {
        return this.postForm("/services-type/insert", data);
    }

    async update(id, data) {
        return this.putForm(
            "/services-type/:services_type_id",
            data,
            {
                services_type_id: id
            }
        );
    }

    async remove(id) {
        return this.delete("/services-type/:services_type_id", {
            services_type_id: id
        });
    }
}