/* views/assets/_common/scripts/auth-guard.js
 *
 * AuthGuard: barreira de UX no frontend para telas autenticadas.
 *
 * IMPORTANTE: isto NÃO é segurança de verdade. Qualquer pessoa pode abrir
 * o console e chamar a API diretamente. A validação real acontece no
 * backend (api/source/Controller/Api.php::authToken), que confere
 * assinatura, expiração, usuário e permissão em toda rota protegida.
 * Este guard só evita que a tela protegida seja exibida (com dados
 * de outra pessoa, ou nenhum) para quem não tem uma sessão local válida,
 * e redireciona o usuário não autenticado de volta para o login.
 */

import SessionStorage from "./storage.js";
import { applyAvatar } from "./avatar.js";

/**
 * Garante que existe uma sessão local para o escopo informado.
 * Se não houver, redireciona para a tela de login correspondente.
 *
 * @param {"default"|"admin"} scope
 * @param {string} loginUrl - caminho relativo (a partir da página atual) para a tela de login
 * @returns {SessionStorage|null} a instância de storage, ou null se redirecionou
 */
export function requireAuth(scope, loginUrl) {
    const storage = new SessionStorage(scope);

    if (!storage.isAuthenticated()) {
        window.location.href = loginUrl;
        return null;
    }

    return storage;
}

/**
 * Preenche o "user-chip" da sidebar (avatar + nome) com os dados salvos
 * da sessão, quando os elementos existirem na página.
 */
export function renderUserChip(storage) {
    const user = storage.getUser();
    if (!user || !user.name) return;

    const nameEl = document.querySelector(".user-name-text");
    const avatarEl = document.querySelector(".user-avatar");
    const roleEl = document.querySelector(".user-role-text");

    if (nameEl) nameEl.textContent = user.name;

    if (avatarEl) {
        applyAvatar(avatarEl, { name: user.name, photoUrl: user.photo_url });
    }

    if (roleEl && user.email) {
        roleEl.textContent = user.email;
    }
}

/**
 * Liga o botão/link de logout (".logout-btn") para encerrar a sessão local
 * e redirecionar para a tela informada.
 */
export function wireLogout(storage, redirectUrl) {
    const btn = document.querySelector(".logout-btn");
    if (!btn) return;

    btn.addEventListener("click", function (evt) {
        evt.preventDefault();
        storage.clearSession();
        window.location.href = redirectUrl;
    });
}

/**
 * Atalho: aplica o guard completo (proteção + chip + logout) de uma vez.
 */
export function initProtectedPage({ scope, loginUrl, logoutUrl }) {
    const storage = requireAuth(scope, loginUrl);
    if (!storage) return null;

    renderUserChip(storage);
    wireLogout(storage, logoutUrl);

    return storage;
}
