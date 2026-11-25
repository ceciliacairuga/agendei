
import HttpClientBase from "./HttpClientBase.js";

export default class UserTypes extends HttpClientBase {

    async listAll() {
        return this.get("/user-types/list");
    }

    async listById(id) {
        return this.get("/user-types/list/:user_type_id", {
            user_type_id: id
        });
    }

    async listPaginator(page = 1, perPage = 10) {
        return this.get(
            "/user-types/list/paginator/:page/:per_page",
            {
                page: page,
                per_page: perPage
            }
        );
    }

    async insert(data) {
        return this.postForm("/user-types/register", data);
    }

    async update(id, data) {
        return this.putForm("/user-types/:user_type_id", data, {
            user_type_id: id
        });
    }

    async remove(id) {
        return this.delete("/user-types/:user_type_id", {
            user_type_id: id
        });
    }
}