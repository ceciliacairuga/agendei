import HttpClientBase from "./HttpClientBase.js";

export default class Dashboard extends HttpClientBase {
    async admin() {
        return this.get("/dashboard/admin");
    }
}
