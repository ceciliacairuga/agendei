
import HttpClientBase from "./HttpClientBase.js";

export default class Users extends HttpClientBase {

    async listAll() {
        return this.get("/users/list");
    }

    async listEmployees() {
        return this.get("/users/employees");
    }

    async listById(id) {
        return this.get("/users/list/:userId", {
            userId: id
        });
    }

    async listPaginator(page = 1, perPage = 10) {
        return this.get("/users/list/paginator/:page/:per_page", {
            page: page,
            per_page: perPage
        });
    }

    async register(data) {
        return this.postForm("/users/register", data);
    }

    async registerAdmin(data) {
        return this.postForm("/users/register-admin", data);
    }

    async createByAdmin(data) {
        return this.postForm("/users/create", data);
    }

    async manageByAdmin(id, data) {
        return this.putForm("/users/manage/:userId", data, { userId: id });
    }

    async loginFromForm(form) {
        return this.postForm("/users/login", form);
    }

    async loginAdminFromForm(form) {
        return this.postForm("/users/login-admin", form);
    }

    async me() {
        return this.get("/users/me");
    }

    // O Router da API só lê PUT em application/x-www-form-urlencoded (putForm), nunca JSON.
    async update(data) {
        return this.putForm("/users/update", data);
    }

    async updatePassword(data) {
        return this.putForm("/users/update-password", data);
    }

    async updateAdmin(data) {
        return this.putForm("/users/update-admin", data);
    }

    async remove(id) {
        return this.delete("/users/:userId", {
            userId: id
        });
    }
}