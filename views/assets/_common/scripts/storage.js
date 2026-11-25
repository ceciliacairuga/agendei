/* views/assets/_common/scripts/storage.js
 *
 * Classe compartilhada para gerenciar a sessão do usuário no localStorage.
 * Cada "escopo" (área da aplicação) usa um conjunto próprio de chaves, para
 * que a sessão de um cliente autenticado não seja confundida com a sessão
 * de um administrador autenticado no mesmo navegador.
 *
 *   default -> agendei_token / agendei_user           (área do cliente)
 *   admin   -> agendei_admin_token / agendei_admin_user (área administrativa)
 *
 * Nunca armazene aqui a senha do usuário ou qualquer segredo usado para
 * assinar o token (JWT_SECRET_KEY). O único dado sensível guardado é o
 * próprio token de sessão, que já é assinado e expira no backend.
 */

export default class SessionStorage {
    #tokenKey;
    #userKey;
    #scope;

    constructor(scope = "default") {
        this.#scope = scope;
        const prefix = scope === "default" ? "agendei_" : `agendei_${scope}_`;
        this.#tokenKey = `${prefix}token`;
        this.#userKey = `${prefix}user`;
    }

    get scope() {
        return this.#scope;
    }

    saveSession(token, user = null) {
        if (!token) return;

        localStorage.setItem(this.#tokenKey, token);

        if (user) {
            localStorage.setItem(this.#userKey, JSON.stringify(user));
        }
    }

    getToken() {
        return localStorage.getItem(this.#tokenKey);
    }

    getUser() {
        const raw = localStorage.getItem(this.#userKey);
        if (!raw) return null;

        try {
            return JSON.parse(raw);
        } catch (err) {
            return null;
        }
    }

    isAuthenticated() {
        return !!this.getToken();
    }

    clearSession() {
        localStorage.removeItem(this.#tokenKey);
        localStorage.removeItem(this.#userKey);
    }
}
