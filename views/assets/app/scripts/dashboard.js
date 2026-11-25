import SessionStorage from "../../_common/scripts/storage.js";
import Appointments from "../../_common/classes/Appointments.js";
import Services from "../../_common/classes/Services.js";
import Users from "../../_common/classes/Users.js";
import { applyAvatar } from "../../_common/scripts/avatar.js";

const storage = new SessionStorage("default");
const appointmentsApi = new Appointments();
const servicesApi = new Services();
const usersApi = new Users();
const token = storage.getToken();

if (token) {
    appointmentsApi.setAuthToken(token);
    servicesApi.setAuthToken(token);
    usersApi.setAuthToken(token);
}

function getField(item, camel, snake) {
    return item?.[camel] ?? item?.[snake];
}

function formatDate(date) {
    if (!date) return "Data não informada";
    const parsed = new Date(`${String(date).slice(0, 10)}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return "Data não informada";
    return parsed.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
}

function formatShortDate(date) {
    const parsed = new Date(`${String(date).slice(0, 10)}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return { day: "—", month: "" };
    return {
        day: parsed.toLocaleDateString("pt-BR", { day: "2-digit" }),
        month: parsed.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")
    };
}

function statusInfo(status) {
    const values = {
        pending: ["Pendente", "badge--yellow"],
        confirmed: ["Confirmado", "badge--green"],
        completed: ["Concluído", "badge--blue"],
        cancelled: ["Cancelado", "badge--red"]
    };
    return values[status] || ["Pendente", "badge--yellow"];
}

function appointmentDateTime(item) {
    const date = getField(item, "appointmentDate", "appointment_date");
    const time = getField(item, "appointmentTime", "appointment_time") || "00:00";
    return new Date(`${String(date || "").slice(0, 10)}T${time}`);
}

function setLoggedUser(user) {
    const name = String(user?.name || "Cliente").trim();
    const firstName = name.split(/\s+/)[0];

    const title = document.querySelector(".page-title");
    const nameLabel = document.querySelector(".user-name-text");
    if (title) title.textContent = `Olá, ${firstName}!`;
    if (nameLabel) nameLabel.textContent = name;

    document.querySelectorAll(".user-avatar, .topbar-avatar").forEach(item => {
        applyAvatar(item, { name, photoUrl: user?.photo_url });
    });

    const oldUser = storage.getUser() || {};
    storage.saveSession(token, { ...oldUser, ...user });
}

function renderNextAppointment(item, serviceMap) {
    const card = document.querySelector(".next-appt-card");
    if (!card) return;

    const service = serviceMap.get(Number(getField(item, "serviceId", "service_id")));
    const name = item.serviceName || service?.name || "Serviço";
    const date = getField(item, "appointmentDate", "appointment_date");
    const time = String(getField(item, "appointmentTime", "appointment_time") || "--:--").slice(0, 5);
    const [statusLabel, statusClass] = statusInfo(item.status);

    card.querySelector(".next-appt-service").textContent = name;
    const meta = card.querySelector(".next-appt-meta");
    meta.replaceChildren();

    const dateItem = document.createElement("li");
    dateItem.textContent = `${formatDate(date)} · ${time}`;
    const durationItem = document.createElement("li");
    const minutes = service?.duration ?? item.serviceDuration;
    durationItem.textContent = `Duração: ${minutes ? `${minutes} minutos` : "não informada"}`;
    meta.append(dateItem, durationItem);

    const badge = card.querySelector(".badge");
    badge.hidden = false;
    badge.textContent = statusLabel;
    badge.className = `badge ${statusClass}`;

    const parsed = formatShortDate(date);
    card.querySelector(".deco-number").textContent = parsed.day;
    card.querySelector(".deco-month").textContent = parsed.month.toUpperCase();
}

function renderAppointmentList(items, serviceMap) {
    const list = document.querySelector(".appt-list");
    list.replaceChildren();

    if (items.length === 0) {
        const empty = document.createElement("li");
        empty.className = "appt-item";
        empty.textContent = "Você ainda não tem próximos agendamentos.";
        list.appendChild(empty);
        return;
    }

    items.slice(0, 3).forEach(item => {
        const service = serviceMap.get(Number(getField(item, "serviceId", "service_id")));
        const date = getField(item, "appointmentDate", "appointment_date");
        const time = String(getField(item, "appointmentTime", "appointment_time") || "--:--").slice(0, 5);
        const short = formatShortDate(date);
        const [label, badgeClass] = statusInfo(item.status);

        const row = document.createElement("li");
        row.className = "appt-item";
        const dateBadge = document.createElement("figure");
        dateBadge.className = "appt-date-badge";
        dateBadge.setAttribute("aria-hidden", "true");
        const day = document.createElement("strong");
        day.textContent = short.day;
        const month = document.createElement("span");
        month.textContent = short.month;
        dateBadge.append(day, month);

        const details = document.createElement("section");
        details.className = "appt-details";
        const serviceName = document.createElement("p");
        serviceName.className = "appt-name";
        serviceName.textContent = item.serviceName || service?.name || "Serviço";
        const sub = document.createElement("p");
        sub.className = "appt-sub";
        sub.textContent = `${time} · ${formatDate(date)}`;
        details.append(serviceName, sub);

        const badge = document.createElement("span");
        badge.className = `badge ${badgeClass}`;
        badge.textContent = label;
        row.append(dateBadge, details, badge);
        list.appendChild(row);
    });
}

function renderServiceTiles(services) {
    const list = document.querySelector(".service-tiles");
    if (!list) return;
    list.replaceChildren();

    services.filter(service => Number(service.active ?? 1) === 1).slice(0, 4).forEach(service => {
        const item = document.createElement("li");
        const button = document.createElement("button");
        button.type = "button";
        button.className = "service-tile";
        button.setAttribute("aria-label", `Agendar ${service.name}`);
        const icon = document.createElement("span");
        icon.setAttribute("aria-hidden", "true");
        const lowerName = String(service.name || "").toLowerCase();
        icon.textContent = lowerName.includes("unha") || lowerName.includes("manicure") ? "💅" : lowerName.includes("color") ? "🎨" : lowerName.includes("trat") ? "💆" : "✂️";
        const name = document.createElement("p");
        name.textContent = service.name;
        const price = document.createElement("small");
        price.textContent = Number(service.price || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
        button.append(icon, name, price);
        button.addEventListener("click", () => { window.location.href = "novo-agendamento.html"; });
        item.appendChild(button);
        list.appendChild(item);
    });

    if (list.children.length === 0) {
        const empty = document.createElement("li");
        empty.textContent = "Nenhum serviço disponível no momento.";
        list.appendChild(empty);
    }
}

/** Mensagem de erro amigável para exibir na tela. */
function messageOf(error) {
    return String(error?.message || error || "Erro desconhecido.").replace(/^Request failed:\s*/, "");
}

function showNoAppointments(serviceLabel) {
    if (serviceLabel) serviceLabel.textContent = "Você ainda não tem próximos agendamentos.";
    const meta = document.querySelector(".next-appt-meta");
    if (meta) meta.replaceChildren();
    const badge = document.querySelector(".next-appt-card .badge");
    if (badge) badge.hidden = true;
    const number = document.querySelector(".deco-number");
    const month = document.querySelector(".deco-month");
    if (number) number.textContent = "—";
    if (month) month.textContent = "";
}

function showAppointmentsError(error, serviceLabel, appointmentList) {
    if (serviceLabel) serviceLabel.textContent = "Não foi possível carregar seus agendamentos.";
    if (appointmentList) {
        appointmentList.replaceChildren();
        const item = document.createElement("li");
        item.className = "appt-item";
        item.textContent = messageOf(error);
        appointmentList.appendChild(item);
    }
}

/**
 * Cada bloco (usuário, serviços, agendamentos) é carregado de forma INDEPENDENTE:
 * a falha de um não impede que os outros sejam exibidos e nenhum fica preso em "Carregando...".
 */
async function loadDashboard() {
    const subtitle = document.querySelector(".page-subtitle");
    const serviceLabel = document.querySelector(".next-appt-service");
    const appointmentList = document.querySelector(".appt-list");

    // Mostra imediatamente o que já se sabe da sessão (primeiro nome / foto), antes de qualquer requisição.
    const cached = storage.getUser();
    if (cached?.name) setLoggedUser(cached);

    if (!token) {
        if (subtitle) subtitle.textContent = "Sua sessão expirou. Entre novamente na sua conta.";
        if (serviceLabel) serviceLabel.textContent = "Entre na sua conta para consultar seus agendamentos.";
        renderServiceTiles([]);
        return;
    }

    const now = new Date();
    if (subtitle) subtitle.textContent = `${now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · Veja seus próximos compromissos`;

    const userTask = usersApi.me().then(response => {
        if (response?.status !== "success" || !response.data) throw new Error(response?.message || "Não foi possível identificar sua conta.");
        setLoggedUser(response.data);
    });

    const servicesTask = servicesApi.listAll().then(response => {
        if (response?.status !== "success") throw new Error(response?.message || "Falha ao carregar serviços.");
        return Array.isArray(response.data) ? response.data : [];
    });

    const appointmentsTask = appointmentsApi.list();

    const [userResult, servicesResult, appointmentsResult] = await Promise.allSettled([userTask, servicesTask, appointmentsTask]);
    const problems = [];

    if (userResult.status === "rejected") {
        console.error("Dashboard — usuário:", userResult.reason);
        problems.push(`seus dados (${messageOf(userResult.reason)})`);
        if (!cached?.name) {
            const title = document.querySelector(".page-title");
            if (title) title.textContent = "Olá!";
        }
    }

    let services = [];
    if (servicesResult.status === "fulfilled") {
        services = servicesResult.value;
        renderServiceTiles(services);
    } else {
        console.error("Dashboard — serviços:", servicesResult.reason);
        problems.push(`os serviços (${messageOf(servicesResult.reason)})`);
        renderServiceTiles([]);
    }

    if (appointmentsResult.status === "fulfilled") {
        const serviceMap = new Map(services.map(service => [Number(service.id), service]));
        const upcoming = appointmentsResult.value
            .filter(item => item.status !== "cancelled" && item.status !== "completed" && appointmentDateTime(item) >= now)
            .sort((a, b) => appointmentDateTime(a) - appointmentDateTime(b));

        if (upcoming.length > 0) {
            renderNextAppointment(upcoming[0], serviceMap);
        } else {
            showNoAppointments(serviceLabel);
        }
        renderAppointmentList(upcoming, serviceMap);
    } else {
        console.error("Dashboard — agendamentos:", appointmentsResult.reason);
        problems.push(`os agendamentos (${messageOf(appointmentsResult.reason)})`);
        showAppointmentsError(appointmentsResult.reason, serviceLabel, appointmentList);
    }

    if (problems.length && subtitle) {
        subtitle.textContent = `Não foi possível carregar ${problems.join("; ")}.`;
    }
}

const style = document.createElement("style");
style.textContent = ".revealed { opacity: 1 !important; transform: translateY(0) !important; }";
document.head.appendChild(style);

if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
        }
    }), { threshold: 0.08 });
    document.querySelectorAll(".metric-card, .appt-item, .service-tile, .next-appt-card").forEach((item, index) => {
        item.style.opacity = "0";
        item.style.transform = "translateY(18px)";
        item.style.transition = `opacity 0.4s ease ${index * 0.07}s, transform 0.4s ease ${index * 0.07}s`;
        observer.observe(item);
    });
}

loadDashboard();
