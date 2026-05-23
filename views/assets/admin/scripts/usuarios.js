/* views/assets/admin/scripts/usuarios.js
 * Gestão de Usuários — CRUD em memória (dados estáticos).
 * Sem jQuery, sem eventos inline, usando document.querySelector.
 * Quando a API estiver pronta, troque as funções loadUsers/saveUser/deleteUser
 * por chamadas via HttpClientBase.js.
 */

/* ── Base de usuários (estática) ─────────────────────────────── */
const initialUsers = [
  { id: 1, name: "Ana Beatriz Santos", email: "ana.santos@email.com", phone: "(11) 98888-1122", birthdate: "1995-03-14", password: "123456" },
  { id: 2, name: "Carla Medeiros",     email: "carla.medeiros@email.com", phone: "(11) 97777-2233", birthdate: "1990-07-22", password: "123456" },
  { id: 3, name: "Fernanda Oliveira",  email: "fernanda.oli@email.com", phone: "(21) 96666-3344", birthdate: "1988-11-05", password: "123456" },
  { id: 4, name: "Luciana Pires",      email: "luciana.pires@email.com", phone: "(31) 95555-4455", birthdate: "1992-01-30", password: "123456" },
  { id: 5, name: "Renata Vieira",      email: "renata.vieira@email.com", phone: "(41) 94444-5566", birthdate: "1985-09-18", password: "123456" }
];

let users = initialUsers.map(u => ({ ...u }));
let searchTerm = "";
let editingId = null;
let pendingDeleteId = null;

/* ── Elementos ───────────────────────────────────────────────── */
const tbody = document.querySelector("#users-tbody");
const emptyState = document.querySelector("#users-empty");
const countEl = document.querySelector("#users-count");
const searchInput = document.querySelector("#user-search");

const userModal = document.querySelector("#user-modal");
const userModalTitle = document.querySelector("#user-modal-title");
const userModalClose = document.querySelector("#user-modal-close");
const userModalBackdrop = document.querySelector("#user-modal-backdrop");
const userForm = document.querySelector("#user-form");
const userIdInput = document.querySelector("#user-id");
const nameInput = document.querySelector("#user-name");
const emailInput = document.querySelector("#user-email");
const phoneInput = document.querySelector("#user-phone");
const birthInput = document.querySelector("#user-birthdate");
const passwordInput = document.querySelector("#user-password");
const userFormError = document.querySelector("#user-form-error");
const userSaveBtn = document.querySelector("#user-save-btn");
const userCancelBtn = document.querySelector("#user-cancel-btn");
const newUserBtn = document.querySelector("#btn-new-user");

const confirmModal = document.querySelector("#confirm-modal");
const confirmModalBackdrop = document.querySelector("#confirm-modal-backdrop");
const confirmDeleteBtn = document.querySelector("#confirm-delete-btn");
const confirmCancelBtn = document.querySelector("#confirm-cancel-btn");
const confirmText = document.querySelector("#confirm-modal-text");

/* ── Helpers ─────────────────────────────────────────────────── */
function getInitials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map(p => p[0].toUpperCase()).join("");
}

function formatDateBr(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);
}

function filteredUsers() {
  const term = searchTerm.trim().toLowerCase();
  if (!term) return users;
  return users.filter(u =>
    u.name.toLowerCase().includes(term) ||
    u.email.toLowerCase().includes(term) ||
    u.phone.toLowerCase().includes(term)
  );
}

/* ── Renderização ────────────────────────────────────────────── */
function renderUsers() {
  const list = filteredUsers();
  countEl.textContent = `${list.length} ${list.length === 1 ? "usuário" : "usuários"}`;

  tbody.innerHTML = "";
  if (list.length === 0) {
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;

  list.forEach(user => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td data-label="Nome">
        <section class="user-cell">
          <figure class="user-cell-avatar" aria-hidden="true">${escapeHtml(getInitials(user.name))}</figure>
          <span class="user-cell-name">${escapeHtml(user.name)}</span>
        </section>
      </td>
      <td data-label="E-mail">${escapeHtml(user.email)}</td>
      <td data-label="Telefone">${escapeHtml(user.phone)}</td>
      <td data-label="Nascimento">${escapeHtml(formatDateBr(user.birthdate))}</td>
      <td data-label="Ações" class="col-actions">
        <section class="row-actions">
          <button type="button" class="icon-btn" data-action="edit" data-id="${user.id}" aria-label="Editar ${escapeHtml(user.name)}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button type="button" class="icon-btn icon-btn--danger" data-action="delete" data-id="${user.id}" aria-label="Excluir ${escapeHtml(user.name)}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </section>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

/* ── Modais ──────────────────────────────────────────────────── */
function openUserModal(user) {
  editingId = user ? user.id : null;
  userModalTitle.textContent = user ? "Editar usuário" : "Novo usuário";
  userIdInput.value = user ? user.id : "";
  nameInput.value = user ? user.name : "";
  emailInput.value = user ? user.email : "";
  phoneInput.value = user ? user.phone : "";
  birthInput.value = user ? user.birthdate : "";
  passwordInput.value = "";
  passwordInput.placeholder = user ? "Deixe em branco para manter" : "Senha do usuário";
  userFormError.hidden = true;
  userModal.hidden = false;
  setTimeout(() => nameInput.focus(), 50);
}

function closeUserModal() {
  userModal.hidden = true;
  editingId = null;
}

function openConfirmModal(user) {
  pendingDeleteId = user.id;
  confirmText.textContent = `Tem certeza que deseja excluir "${user.name}"? Esta ação não pode ser desfeita.`;
  confirmModal.hidden = false;
}

function closeConfirmModal() {
  confirmModal.hidden = true;
  pendingDeleteId = null;
}

/* ── CRUD em memória ─────────────────────────────────────────── */
function validateForm() {
  const errors = [];
  if (!nameInput.value.trim()) errors.push("Informe o nome.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value)) errors.push("E-mail inválido.");
  if (!phoneInput.value.trim()) errors.push("Informe o telefone.");
  if (!birthInput.value) errors.push("Informe a data de nascimento.");
  if (!editingId && (!passwordInput.value || passwordInput.value.length < 6)) {
    errors.push("A senha deve ter ao menos 6 caracteres.");
  }
  if (passwordInput.value && passwordInput.value.length < 6) {
    errors.push("A senha deve ter ao menos 6 caracteres.");
  }
  // E-mail único
  const dup = users.find(u =>
    u.email.toLowerCase() === emailInput.value.trim().toLowerCase() && u.id !== editingId
  );
  if (dup) errors.push("Já existe um usuário com este e-mail.");
  return errors;
}

function saveUser() {
  const errors = validateForm();
  if (errors.length) {
    userFormError.textContent = errors.join(" ");
    userFormError.hidden = false;
    return;
  }

  const payload = {
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
    phone: phoneInput.value.trim(),
    birthdate: birthInput.value
  };

  if (editingId) {
    users = users.map(u => {
      if (u.id !== editingId) return u;
      return {
        ...u,
        ...payload,
        password: passwordInput.value ? passwordInput.value : u.password
      };
    });
  } else {
    const nextId = users.reduce((max, u) => Math.max(max, u.id), 0) + 1;
    users.push({ id: nextId, ...payload, password: passwordInput.value });
  }

  closeUserModal();
  renderUsers();
}

function deleteUser() {
  if (pendingDeleteId == null) return;
  users = users.filter(u => u.id !== pendingDeleteId);
  closeConfirmModal();
  renderUsers();
}

/* ── Eventos ─────────────────────────────────────────────────── */
searchInput.addEventListener("input", () => {
  searchTerm = searchInput.value;
  renderUsers();
});

newUserBtn.addEventListener("click", () => openUserModal(null));

tbody.addEventListener("click", (event) => {
  const btn = event.target.closest("button[data-action]");
  if (!btn) return;
  const id = Number(btn.dataset.id);
  const user = users.find(u => u.id === id);
  if (!user) return;
  if (btn.dataset.action === "edit") openUserModal(user);
  if (btn.dataset.action === "delete") openConfirmModal(user);
});

userSaveBtn.addEventListener("click", saveUser);
userCancelBtn.addEventListener("click", closeUserModal);
userModalClose.addEventListener("click", closeUserModal);
userModalBackdrop.addEventListener("click", closeUserModal);

confirmDeleteBtn.addEventListener("click", deleteUser);
confirmCancelBtn.addEventListener("click", closeConfirmModal);
confirmModalBackdrop.addEventListener("click", closeConfirmModal);

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (!userModal.hidden) closeUserModal();
  if (!confirmModal.hidden) closeConfirmModal();
});

/* ── Bootstrap ───────────────────────────────────────────────── */
renderUsers();
