import SessionStorage from "../../_common/scripts/storage.js";
import Dashboard from "../../_common/classes/Dashboard.js";

const storage = new SessionStorage("admin");
const api = new Dashboard();
const token = storage.getToken();
if (token) api.setAuthToken(token);

const byId = (id) => document.getElementById(id);
const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
};

function renderAppointments(items, listId = "today-list", emptyId = "appointments-empty", withDate = false) {
    const list = byId(listId);
    const empty = byId(emptyId);
    list.replaceChildren();
    if (!items.length) {
        empty.hidden = false;
        return;
    }
    empty.hidden = true;
    items.forEach(item => {
        const row = make("li", "today-item");
        const hour = String(item.appointment_time || "--:--").slice(0, 5);
        const [y, m, d] = String(item.appointment_date || "").split("-");
        row.appendChild(make("span", "today-time", withDate && d ? `${d}/${m} ${hour}` : hour));
        const info = make("section", "today-info");
        info.appendChild(make("p", "today-client", item.client_name || `Cliente #${item.user_id}`));
        info.appendChild(make("p", "today-service", `${item.service_name || `Serviço #${item.service_id}`} · ${item.employee_name || "Profissional não definido"}`));
        const statusLabels = { pending: ["Pendente", "badge--yellow"], confirmed: ["Confirmado", "badge--green"], completed: ["Concluído", "badge--blue"], cancelled: ["Cancelado", "badge--red"] };
        const [label, cls] = statusLabels[item.status] || statusLabels.pending;
        row.append(info, make("span", `badge ${cls}`, label));
        list.appendChild(row);
    });
}

function renderStaff(staff) {
    const list = byId("staff-list");
    const empty = byId("staff-empty");
    list.replaceChildren();
    if (!staff.length) {
        empty.hidden = false;
        return;
    }
    empty.hidden = true;
    staff.forEach(person => {
        const row = make("li", "pro-item");
        const avatar = make("figure", "pro-avatar pro-a", String(person.name || "?").trim().split(/\s+/).slice(0, 2).map(word => word[0]).join("").toUpperCase());
        avatar.setAttribute("aria-hidden", "true");
        const info = make("section", "pro-info");
        info.append(make("p", "pro-name", person.name), make("p", "pro-meta", person.email));
        row.append(avatar, info, make("span", "pro-status pro-status--free", "Ativo"));
        list.appendChild(row);
    });
}

async function loadPanel() {
    const subtitle = document.querySelector(".page-subtitle");
    try {
        if (!token) throw new Error("Sua sessão de administrador expirou. Entre novamente.");
        const response = await api.admin();
        if (response?.status !== "success" || !response.data) throw new Error(response?.message || "Não foi possível consultar o painel.");
        const { counts, today_appointments: appointments, next_appointments: nextAppointments, staff } = response.data;
        const set = (id, value) => { byId(id).textContent = Number(value || 0); };
        set("kpi-total-users", counts.total_users);
        set("kpi-total-services", counts.total_services);
        set("kpi-total-appointments", counts.total_appointments);
        set("kpi-upcoming", counts.upcoming_appointments);
        set("kpi-completed", counts.completed_appointments);
        set("kpi-cancelled", counts.cancelled_appointments);
        renderAppointments(Array.isArray(nextAppointments) ? nextAppointments : [], "next-list", "next-empty", true);
        byId("kpi-appointments").textContent = Number(counts.appointments_today || 0);
        byId("kpi-clients").textContent = Number(counts.active_clients || 0);
        byId("kpi-staff").textContent = Number(counts.active_employees || 0);
        byId("kpi-services").textContent = Number(counts.active_services || 0);
        renderAppointments(Array.isArray(appointments) ? appointments : []);
        renderStaff(Array.isArray(staff) ? staff : []);
        subtitle.textContent = `Dados atualizados em ${new Date().toLocaleString("pt-BR")}`;
    } catch (error) {
        subtitle.textContent = `Não foi possível carregar os dados: ${String(error.message).replace(/^Request failed:\s*/, "")}`;
        ["kpi-appointments", "kpi-clients", "kpi-staff", "kpi-services", "kpi-total-users", "kpi-total-services", "kpi-total-appointments", "kpi-upcoming", "kpi-completed", "kpi-cancelled"].forEach(id => byId(id).textContent = "—");
    }
}

const proTitle = byId("pros-title");
if (proTitle) proTitle.textContent = "Funcionários ativos";
loadPanel();
