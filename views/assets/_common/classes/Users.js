import HttpClientBase from "./HttpClientBase.js";

export default class Users extends HttpClientBase {

    async loginFromForm(form) {
        return this.postForm("/users/login", form);
    }

    async loginAdminFromForm(form) {
        return this.postForm("/users/login-admin", form);
    }

    async loginAthleteFromForm(form) {
        return this.postForm("/users/login-athlete", form);
    }

    async register(data) {
        return this.postForm("/users/register", data);
    }

    async update(data) {
        return this.put("/users/update", data);
    }

    async updateAdmin(data) {
        return this.put("/users/update-admin", data);
    }
}