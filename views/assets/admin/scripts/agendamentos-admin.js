/* views/assets/admin/scripts/agendamentos-admin.js
 * Gestão de agendamentos (admin): lista real da API, filtros, alteração de status e exclusão.
 * As permissões são validadas pela API (token de administrador).
 */
import SessionStorage from "../../_common/scripts/storage.js";
import Appointments from "../../_common/classes/Appointments.js";
import Services from "../../_common/classes/Services.js";

const session = new SessionStorage("admin");
const token = session.getToken();
const appointmentsApi = new Appointments();
const servicesApi = new Services();
if (token) { appointmentsApi.setAuthToken(token); servicesApi.setAuthToken(token); }

const tbody = document.querySelector("#appt-tbody");
const emptyEl = document.querySelector("#appt-empty");
const countEl = document.querySelector("#appt-count");
const feedback = document.querySelector("#appt-admin-feedback");
const fDate = document.querySelector("#f-date");
const fClient = document.querySelector("#f-client");
const fService = document.querySelector("#f-service");
const fStatus = document.querySelector("#f-status");

const STATUS = {
    pending: ["Pendente", "badge--yellow"],
    confirmed: ["Confirmado", "badge--green"],
    completed: ["Concluído", "badge--blue"],
    cancelled: ["Cancelado", "badge--red"],
};

const messageOf = (error) => String(error?.message || error || "Erro desconhecido.").replace(/^Request failed:\s*/, "");

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

function notify(text, type = "success") {
    feedback.textContent = text;
    feedback.className = `appt-admin-feedback appt-admin-feedback--${type}`;
    feedback.hidden = false;
    window.clearTimeout(notify.timer);
    notify.timer = window.setTimeout(() => { feedback.hidden = true; }, 6000);
}

function formatDate(date) {
    const [y, m, d] = String(date || "").split("-");
    return y && m && d ? `${d}/${m}/${y}` : "—";
}

function renderRows(items) {
    tbody.replaceChildren();
    items.forEach((item) => {
        const row = el("tr");

        const when = el("td");
        when.append(el("strong", "", formatDate(item.appointmentDate)), el("span", "appt-cell-sub", String(item.appointmentTime).slice(0, 5)));

        const client = el("td");
        client.append(el("strong", "", item.clientName || `Usuário #${item.userId}`), el("span", "appt-cell-sub", item.clientEmail || ""));

        const service = el("td");
        service.append(el("strong", "", item.serviceName || `Serviço #${item.serviceId}`));
        if (item.serviceDuration) service.append(el("span", "appt-cell-sub", `${item.serviceDuration} min`));

        const staff = el("td", "", item.employeeName || "A definir");

        const [label, badge] = STATUS[item.status] || STATUS.pending;
        const statusCell = el("td");
        statusCell.append(el("span", `badge ${badge}`, label));

        const actions = el("td", "col-actions");
        const box = el("section", "appt-row-actions");

        const select = el("select", "status-select");
        select.setAttribute("aria-label", `Alterar status do agendamento de ${item.clientName || "cliente"}`);
        Object.entries(STATUS).forEach(([value, [text]]) => select.add(new Option(text, value, false, value === item.status)));
        select.addEventListener("change", () => changeStatus(item, select));
        box.appendChild(select);

        if (item.status !== "cancelled" && item.status !== "completed") {
            const cancel = el("button", "btn btn-outline", "Cancelar");
            cancel.type = "button";
            cancel.addEventListener("click", () => {
                if (window.confirm(`Cancelar o agendamento de ${item.clientName || "cliente"} em ${formatDate(item.appointmentDate)} às ${String(item.appointmentTime).slice(0, 5)}?`)) {
                    select.value = "cancelled";
                    changeStatus(item, select);
                }
            });
            box.appendChild(cancel);
        }

        const remove = el("button", "btn btn-outline", "Excluir");
        remove.type = "button";
        remove.addEventListener("click", () => removeAppointment(item, remove));
        box.appendChild(remove);

        actions.appendChild(box);
        row.append(when, client, service, staff, statusCell, actions);
        tbody.appendChild(row);
    });
    countEl.textContent = `${items.length} agendamento${items.length === 1 ? "" : "s"}`;
    emptyEl.hidden = items.length > 0;
}

let requestCounter = 0;
async function load() {
    const requestId = ++requestCounter;
    const filters = { date: fDate.value, client: fClient.value.trim(), service_id: fService.value, status: fStatus.value };
    try {
        const items = await appointmentsApi.listFiltered(filters);
        if (requestId !== requestCounter) return;   // resposta antiga: ignora
        // Mais próximos primeiro quando há filtro; do contrário, o mais recente no topo.
        renderRows(items.sort((a, b) => `${b.appointmentDate} ${b.appointmentTime}`.localeCompare(`${a.appointmentDate} ${a.appointmentTime}`)));
    } catch (error) {
        if (requestId !== requestCounter) return;
        console.error("Agendamentos:", error);
        tbody.replaceChildren();
        countEl.textContent = "0 agendamentos";
        emptyEl.hidden = false;
        emptyEl.firstElementChild.textContent = `Não foi possível carregar os agendamentos. ${messageOf(error)}`;
        return;
    }
    emptyEl.firstElementChild.textContent = "Nenhum agendamento encontrado.";
}

async function changeStatus(item, select) {
    const previous = item.status;
    const next = select.value;
    if (next === previous) return;
    select.disabled = true;
    try {
        await appointmentsApi.update(item.id, { status: next });
        notify("Status atualizado com sucesso.");
    } catch (error) {
        select.value = previous;
        notify(messageOf(error), "error");   // ex.: horário já ocupado ao reativar um cancelado
    }
    await load();
}

async function removeAppointment(item, button) {
    if (!window.confirm("Excluir este agendamento definitivamente? Esta ação não pode ser desfeita.")) return;
    button.disabled = true;
    try {
        await appointmentsApi.remove(item.id);
        notify("Agendamento excluído.");
    } catch (error) {
        notify(messageOf(error), "error");
    }
    await load();
}

async function loadServiceFilter() {
    try {
        const response = await servicesApi.listAll();
        (response?.data ?? []).forEach((service) => fService.add(new Option(service.name, service.id)));
    } catch (error) {
        console.warn("Filtro de serviços indisponível:", error);
    }
}

let debounce;
fClient.addEventListener("input", () => { window.clearTimeout(debounce); debounce = window.setTimeout(load, 300); });
[fDate, fService, fStatus].forEach((field) => field.addEventListener("change", load));
document.querySelector("#f-clear").addEventListener("click", () => { fDate.value = ""; fClient.value = ""; fService.value = ""; fStatus.value = ""; load(); });

loadServiceFilter().finally(load);
