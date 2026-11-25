/* views/assets/app/scripts/perfil.js
 * Perfil do usuário autenticado: dados, foto (Etapa 07), senha e histórico — tudo via API.
 * Usado por perfil.html e novo-agendamento.html (mesmos IDs).
 * A identidade vem SEMPRE do token validado na API; nenhum ID de usuário é enviado.
 */
import SessionStorage from "../../_common/scripts/storage.js";
import Users from "../../_common/classes/Users.js";
import Images from "../../_common/classes/Images.js";
import Appointments from "../../_common/classes/Appointments.js";
import { applyAvatar, applyAvatars } from "../../_common/scripts/avatar.js";

const storage = new SessionStorage("default");
const token = storage.getToken();
const usersApi = new Users();
const imagesApi = new Images();
const appointmentsApi = new Appointments();
[usersApi, imagesApi, appointmentsApi].forEach((api) => api.setAuthToken(token));

const $ = (selector) => document.querySelector(selector);
const messageOf = (error) => String(error?.message || error || "Erro desconhecido.").replace(/^Request failed:\s*/, "");
const show = (el, text) => { if (!el) return; if (text !== undefined) el.textContent = text; el.hidden = false; };
const hide = (el) => { if (el) el.hidden = true; };

let currentUser = null;

/* ------------------------------------------------------------------ */
/*  Dados do usuário                                                   */
/* ------------------------------------------------------------------ */
function splitName(fullName) {
    const parts = String(fullName || "").trim().split(/\s+/);
    return { first: parts.shift() || "", last: parts.join(" ") };
}

function renderUser(user) {
    currentUser = user;
    const name = user.name || "Cliente";

    const heroName = $("#profile-name");
    if (heroName) heroName.textContent = name;
    const meta = $("#profile-meta");
    if (meta) meta.textContent = user.email || "";

    $("#view-name") && ($("#view-name").textContent = name);
    $("#view-email") && ($("#view-email").textContent = user.email || "—");

    const { first, last } = splitName(name);
    if ($("#edit-firstname")) $("#edit-firstname").value = first;
    if ($("#edit-lastname")) $("#edit-lastname").value = last;
    if ($("#edit-email")) $("#edit-email").value = user.email || "";

    document.querySelectorAll(".user-name-text").forEach((el) => { el.textContent = name; });
    applyAvatar($("#profile-avatar"), { name, photoUrl: user.photo_url });
    applyAvatars(".user-avatar, .topbar-avatar", user);
    if (!pendingFile) applyAvatar($("#photo-preview"), { name, photoUrl: user.photo_url });

    // mantém a sessão (chip do cabeçalho em todas as telas) em dia
    storage.saveSession(token, { ...(storage.getUser() || {}), ...user });
}

async function loadUser() {
    try {
        const response = await usersApi.me();
        if (response?.status !== "success" || !response.data) throw new Error(response?.message || "Não foi possível carregar seus dados.");
        renderUser(response.data);
    } catch (error) {
        console.error("Perfil:", error);
        const cached = storage.getUser();
        if (cached?.name) renderUser(cached);
        else if ($("#profile-name")) $("#profile-name").textContent = "Não foi possível carregar seu perfil";
        if ($("#profile-meta")) $("#profile-meta").textContent = messageOf(error);
    }
}

/* ------------------------------------------------------------------ */
/*  Editar dados pessoais                                              */
/* ------------------------------------------------------------------ */
function setupPersonalForm() {
    const form = $("#personal-form");
    const view = $("#personal-view");
    const toggle = $("#toggle-edit-personal");
    if (!form || !toggle) return;

    const open = (state) => {
        form.hidden = !state;
        if (view) view.hidden = state;
        toggle.setAttribute("aria-expanded", String(state));
        hide($("#personal-success")); hide($("#personal-error"));
    };
    toggle.addEventListener("click", () => open(form.hidden));
    $("#cancel-edit-personal")?.addEventListener("click", () => { if (currentUser) renderUser(currentUser); open(false); });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        ["firstname", "lastname", "email"].forEach((k) => hide($(`#err-${k}`)));
        hide($("#personal-success")); hide($("#personal-error"));

        const first = $("#edit-firstname").value.trim();
        const last = $("#edit-lastname").value.trim();
        const email = $("#edit-email").value.trim();
        let valid = true;
        if (!first) { show($("#err-firstname"), "Informe seu nome."); valid = false; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { show($("#err-email"), "Informe um e-mail válido."); valid = false; }
        if (!valid) return;

        const button = $("#save-personal");
        button.disabled = true; const label = button.textContent; button.textContent = "Salvando...";
        try {
            const response = await usersApi.update({ name: `${first} ${last}`.trim(), email });
            if (response?.status !== "success") throw new Error(response?.message || "Não foi possível salvar.");
            renderUser({ ...currentUser, ...response.data });
            show($("#personal-success"));
            open(false);
            show($("#personal-success"));
            window.setTimeout(() => hide($("#personal-success")), 4000);
        } catch (error) {
            show($("#personal-error"), messageOf(error));
        } finally {
            button.disabled = false; button.textContent = label;
        }
    });
}

/* ------------------------------------------------------------------ */
/*  Alterar senha                                                      */
/* ------------------------------------------------------------------ */
function setupPasswordForm() {
    const form = $("#password-form");
    const toggle = $("#toggle-edit-password");
    if (!form || !toggle) return;
    const placeholder = $("#password-placeholder");

    const open = (state) => {
        form.hidden = !state;
        if (placeholder) placeholder.hidden = state;
        toggle.setAttribute("aria-expanded", String(state));
        if (!state) form.reset();
        ["current-pwd", "new-pwd", "confirm-pwd"].forEach((k) => hide($(`#err-${k}`)));
        hide($("#password-success")); hide($("#password-error"));
    };
    toggle.addEventListener("click", () => open(form.hidden));
    $("#cancel-edit-password")?.addEventListener("click", () => open(false));

    document.querySelectorAll(".toggle-pwd").forEach((btn) => {
        btn.addEventListener("click", () => {
            const input = document.getElementById(btn.dataset.target);
            if (!input) return;
            const reveal = input.type === "password";
            input.type = reveal ? "text" : "password";
            btn.querySelector(".icon-eye").hidden = reveal;
            btn.querySelector(".icon-eye-off").hidden = !reveal;
        });
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        ["current-pwd", "new-pwd", "confirm-pwd"].forEach((k) => hide($(`#err-${k}`)));
        hide($("#password-success")); hide($("#password-error"));

        const current = $("#current-password").value;
        const next = $("#new-password").value;
        const confirm = $("#confirm-password").value;
        let valid = true;
        if (!current) { show($("#err-current-pwd"), "Informe a senha atual."); valid = false; }
        if (next.length < 8) { show($("#err-new-pwd"), "A nova senha deve ter pelo menos 8 caracteres."); valid = false; }
        if (next !== confirm) { show($("#err-confirm-pwd"), "As senhas não coincidem."); valid = false; }
        if (!valid) return;

        const button = $("#save-password");
        button.disabled = true; const label = button.textContent; button.textContent = "Salvando...";
        try {
            const response = await usersApi.updatePassword({ current_password: current, new_password: next });
            if (response?.status !== "success") throw new Error(response?.message || "Não foi possível alterar a senha.");
            form.reset();
            show($("#password-success"));
            window.setTimeout(() => open(false), 1800);
        } catch (error) {
            show($("#password-error"), messageOf(error));
        } finally {
            button.disabled = false; button.textContent = label;
        }
    });
}

/* ------------------------------------------------------------------ */
/*  Foto de perfil: seleção, pré-visualização e envio (FormData)       */
/* ------------------------------------------------------------------ */
let pendingFile = null;
let previewUrl = null;

function photoFeedback(text, type = "info") {
    const el = $("#photo-feedback");
    if (!el) return;
    el.textContent = text;
    el.className = `photo-feedback photo-feedback--${type}`;
    el.hidden = !text;
}

function clearPending() {
    pendingFile = null;
    if (previewUrl) { URL.revokeObjectURL(previewUrl); previewUrl = null; }
    const input = $("#photo-input");
    if (input) input.value = "";
    if ($("#photo-upload")) $("#photo-upload").disabled = true;
    hide($("#photo-cancel"));
    applyAvatar($("#photo-preview"), { name: currentUser?.name, photoUrl: currentUser?.photo_url });
}

function setupPhoto() {
    const input = $("#photo-input");
    if (!input) return;

    $("#photo-choose")?.addEventListener("click", () => input.click());

    input.addEventListener("change", () => {
        const file = input.files?.[0];
        if (!file) { clearPending(); return; }
        const problem = Images.validateFile(file, Images.MAX_USER_PHOTO_BYTES);
        if (problem) { clearPending(); photoFeedback(problem, "error"); return; }

        pendingFile = file;
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        previewUrl = URL.createObjectURL(file);
        const preview = $("#photo-preview");
        preview.replaceChildren();
        const img = document.createElement("img");
        img.src = previewUrl; img.alt = "Pré-visualização da nova foto";
        preview.appendChild(img);
        $("#photo-upload").disabled = false;
        show($("#photo-cancel"));
        photoFeedback("Pré-visualização. Clique em “Enviar foto” para confirmar.", "info");
    });

    $("#photo-cancel")?.addEventListener("click", () => { clearPending(); photoFeedback(""); });

    $("#photo-upload")?.addEventListener("click", async () => {
        if (!pendingFile) { photoFeedback("Selecione uma imagem primeiro.", "error"); return; }
        const button = $("#photo-upload");
        button.disabled = true; $("#photo-choose").disabled = true;
        photoFeedback("Enviando foto...", "info");
        try {
            const result = await imagesApi.uploadUserPhoto(pendingFile);
            const file = pendingFile;
            pendingFile = null;
            if (previewUrl) { URL.revokeObjectURL(previewUrl); previewUrl = null; }
            input.value = "";
            hide($("#photo-cancel"));
            renderUser({ ...currentUser, photo: result.photo, photo_url: `${result.photo_url}?v=${Date.now()}` });
            photoFeedback("Foto atualizada com sucesso!", "success");
            void file;
        } catch (error) {
            photoFeedback(messageOf(error), "error");
            button.disabled = false;
        } finally {
            $("#photo-choose").disabled = false;
        }
    });
}

/* ------------------------------------------------------------------ */
/*  Histórico recente                                                  */
/* ------------------------------------------------------------------ */
const STATUS_BADGE = {
    pending: ["Pendente", "badge--yellow"], confirmed: ["Confirmado", "badge--green"],
    completed: ["Concluído", "badge--blue"], cancelled: ["Cancelado", "badge--red"],
};

async function loadHistory() {
    const list = $("#history-list");
    if (!list) return;
    const placeholder = (text) => {
        list.replaceChildren();
        const li = document.createElement("li"); li.className = "history-item";
        const sec = document.createElement("section"); sec.className = "history-info";
        const p = document.createElement("p"); p.className = "history-meta"; p.textContent = text;
        sec.appendChild(p); li.appendChild(sec); list.appendChild(li);
    };
    try {
        const items = await appointmentsApi.list();
        const recent = [...items]
            .sort((a, b) => `${b.appointmentDate} ${b.appointmentTime}`.localeCompare(`${a.appointmentDate} ${a.appointmentTime}`))
            .slice(0, 4);
        if (!recent.length) { placeholder("Você ainda não possui agendamentos."); return; }
        list.replaceChildren();
        recent.forEach((item) => {
            const [label, badge] = STATUS_BADGE[item.status] || STATUS_BADGE.pending;
            const li = document.createElement("li"); li.className = "history-item";
            const info = document.createElement("section"); info.className = "history-info";
            const name = document.createElement("p"); name.className = "history-name"; name.textContent = item.serviceName || `Serviço #${item.serviceId}`;
            const meta = document.createElement("p"); meta.className = "history-meta";
            const [y, m, d] = String(item.appointmentDate).split("-");
            meta.textContent = `${d}/${m}/${y} · ${String(item.appointmentTime).slice(0, 5)}`;
            info.append(name, meta);
            const status = document.createElement("span"); status.className = `badge ${badge}`; status.textContent = label;
            li.append(info, status);
            list.appendChild(li);
        });
    } catch (error) {
        console.error("Histórico:", error);
        placeholder(`Não foi possível carregar o histórico. ${messageOf(error)}`);
    }
}

/* ------------------------------------------------------------------ */
setupPersonalForm();
setupPasswordForm();
setupPhoto();
loadUser();
loadHistory();
