import SessionStorage from "../../_common/scripts/storage.js";
import Users from "../../_common/classes/Users.js";
import { applyAvatar } from "../../_common/scripts/avatar.js";

const session = new SessionStorage("admin");
const api = new Users();
const token = session.getToken();
const loggedAdmin = session.getUser();
if (token) api.setAuthToken(token);
if (loggedAdmin) {
    const adminName = document.querySelector("#admin-name");
    const adminEmail = document.querySelector("#admin-email");
    const avatar = document.querySelector(".user-avatar");
    if (adminName) adminName.textContent = loggedAdmin.name || "Administrador";
    if (adminEmail) adminEmail.textContent = loggedAdmin.email || "Conta administrativa";
    if (avatar) avatar.textContent = String(loggedAdmin.name || "AD").trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
}

const tbody = document.querySelector("#users-tbody");
const emptyState = document.querySelector("#users-empty");
const countEl = document.querySelector("#users-count");
const searchInput = document.querySelector("#user-search");
const modal = document.querySelector("#user-modal");
const form = document.querySelector("#user-form");
const modalTitle = document.querySelector("#user-modal-title");
const nameInput = document.querySelector("#user-name");
const emailInput = document.querySelector("#user-email");
const typeInput = document.querySelector("#user-type");
const passwordInput = document.querySelector("#user-password");
const errorEl = document.querySelector("#user-form-error");
const saveButton = document.querySelector("#user-save-btn");
const confirmModal = document.querySelector("#confirm-modal");
const confirmText = document.querySelector("#confirm-modal-text");
const confirmButton = document.querySelector("#confirm-delete-btn");

let users = [];
let editingId = null;
let pendingDeleteId = null;

function responseData(response) {
    if (!response || response.status !== "success") throw new Error(response?.message || "Não foi possível carregar os usuários.");
    return response.data ?? [];
}

function initials(name) {
    return String(name).trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase() || "").join("");
}

function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

function roleName(user) {
    const typeId = Number(user.type_id ?? user.typeId);
    if (typeId === 1) return "Administrador";
    if (typeId === 3) return "Funcionário";
    return "Cliente";
}

function render() {
    const term = searchInput.value.trim().toLowerCase();
    const filtered = users.filter(user => user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term));
    tbody.replaceChildren();
    countEl.textContent = `${filtered.length} ${filtered.length === 1 ? "usuário" : "usuários"}`;
    emptyState.hidden = filtered.length > 0;

    filtered.forEach(user => {
        const row = document.createElement("tr");
        const nameCell = element("td"); nameCell.dataset.label = "Nome";
        const userCell = element("section", "user-cell");
        const cellAvatar = element("figure", "user-cell-avatar");
        applyAvatar(cellAvatar, { name: user.name, photoUrl: user.photo_url });
        userCell.append(cellAvatar, element("span", "user-cell-name", user.name));
        nameCell.appendChild(userCell);
        const emailCell = element("td", "", user.email); emailCell.dataset.label = "E-mail";
        const typeCell = element("td", "", roleName(user)); typeCell.dataset.label = "Tipo";
        const statusCell = element("td"); statusCell.dataset.label = "Status";
        const active = Number(user.active ?? 1) === 1;
        statusCell.appendChild(element("span", `badge ${active ? "badge--green" : "badge--red"}`, active ? "Ativo" : "Inativo"));
        const actionsCell = element("td", "col-actions"); actionsCell.dataset.label = "Ações";
        const actions = element("section", "row-actions");
        if (Number(user.type_id ?? user.typeId) !== 1) {
            const edit = element("button", "icon-btn", "Editar");
            edit.type = "button"; edit.addEventListener("click", () => openModal(user));
            actions.appendChild(edit);
            if (!active) {
                const reactivate = element("button", "icon-btn", "Reativar");
                reactivate.type = "button"; reactivate.addEventListener("click", () => reactivateUser(user, reactivate));
                actions.appendChild(reactivate);
            }
            if (active) {
                const deactivate = element("button", "icon-btn icon-btn--danger", "Desativar");
                deactivate.type = "button"; deactivate.addEventListener("click", () => askDelete(user));
                actions.appendChild(deactivate);
            }
        } else {
            actions.appendChild(element("span", "text-muted", "Conta protegida"));
        }
        actionsCell.appendChild(actions);
        row.append(nameCell, emailCell, typeCell, statusCell, actionsCell);
        tbody.appendChild(row);
    });
}

function openModal(user = null) {
    editingId = user ? Number(user.id) : null;
    form.reset();
    errorEl.hidden = true;
    errorEl.textContent = "";
    modalTitle.textContent = user ? "Editar usuário" : "Cadastrar usuário";
    saveButton.textContent = user ? "Salvar alterações" : "Cadastrar";
    nameInput.value = user?.name || "";
    emailInput.value = user?.email || "";
    typeInput.value = String(user ? (user.type_id ?? user.typeId) : 2);
    passwordInput.value = "";
    passwordInput.required = !user;
    passwordInput.placeholder = user ? "Deixe em branco para manter a senha atual" : "Mínimo de 8 caracteres";
    modal.hidden = false;
    nameInput.focus();
}

function closeModal() {
    modal.hidden = true;
    editingId = null;
    form.reset();
    errorEl.hidden = true;
}

function askDelete(user) {
    pendingDeleteId = Number(user.id);
    confirmText.textContent = `Deseja realmente desativar o usuário ${user.name}?`;
    confirmModal.hidden = false;
}

function closeConfirmModal() {
    confirmModal.hidden = true;
    pendingDeleteId = null;
}

async function reactivateUser(user, button) {
    button.disabled = true;
    try {
        const response = await api.manageByAdmin(Number(user.id), {
            name: user.name, email: user.email, type_id: Number(user.type_id ?? user.typeId), active: 1,
        });
        if (response.status !== "success") throw new Error(response.message || "Não foi possível reativar o usuário.");
        await loadUsers();
    } catch (error) {
        button.disabled = false;
        window.alert(String(error.message).replace(/^Request failed:\s*/, ""));
    }
}

async function loadUsers() {
    try {
        users = responseData(await api.listAll());
        render();
    } catch (error) {
        emptyState.hidden = false;
        emptyState.textContent = error.message;
        countEl.textContent = "—";
    }
}

form.addEventListener("submit", async event => {
    event.preventDefault();
    errorEl.hidden = true;
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const type_id = Number(typeInput.value);
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errorEl.textContent = "Informe um nome e um e-mail válido.";
        errorEl.hidden = false;
        return;
    }
    if (![2, 3].includes(type_id)) {
        errorEl.textContent = "Selecione Cliente ou Funcionário.";
        errorEl.hidden = false;
        return;
    }
    if ((!editingId && password.length < 8) || (password && password.length < 8)) {
        errorEl.textContent = "A senha deve ter pelo menos 8 caracteres.";
        errorEl.hidden = false;
        return;
    }

    saveButton.disabled = true;
    saveButton.textContent = editingId ? "Salvando..." : "Cadastrando...";
    const payload = { name, email, type_id };
    if (password) payload.password = password;
    try {
        const response = editingId ? await api.manageByAdmin(editingId, payload) : await api.createByAdmin(payload);
        if (response.status !== "success" && response.status !== "created") throw new Error(response.message || "Não foi possível salvar o usuário.");
        closeModal();
        await loadUsers();
    } catch (error) {
        errorEl.textContent = String(error.message).replace(/^Request failed:\s*/, "");
        errorEl.hidden = false;
    } finally {
        saveButton.disabled = false;
        saveButton.textContent = editingId ? "Salvar alterações" : "Cadastrar";
    }
});

confirmButton.addEventListener("click", async () => {
    if (!pendingDeleteId) return;
    confirmButton.disabled = true;
    try {
        const response = await api.remove(pendingDeleteId);
        if (response.status !== "success") throw new Error(response.message || "Não foi possível desativar o usuário.");
        closeConfirmModal();
        await loadUsers();
    } catch (error) {
        confirmText.textContent = error.message;
    } finally {
        confirmButton.disabled = false;
    }
});

document.querySelector("#btn-new-user")?.addEventListener("click", () => openModal());
document.querySelector("#user-modal-close")?.addEventListener("click", closeModal);
document.querySelector("#user-cancel-btn")?.addEventListener("click", closeModal);
document.querySelector("#user-modal-backdrop")?.addEventListener("click", closeModal);
document.querySelector("#confirm-cancel-btn")?.addEventListener("click", closeConfirmModal);
document.querySelector("#confirm-modal-backdrop")?.addEventListener("click", closeConfirmModal);
searchInput?.addEventListener("input", render);
document.addEventListener("keydown", event => { if (event.key === "Escape") { closeModal(); closeConfirmModal(); } });

loadUsers();
