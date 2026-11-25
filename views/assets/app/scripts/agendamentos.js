/* views/assets/app/scripts/agendamentos.js
 * Lista, filtra, e cancela os agendamentos do usuário autenticado (dados reais da API).
 */

import SessionStorage from "../../_common/scripts/storage.js";
import Appointments from "../../_common/classes/Appointments.js";
import Services from "../../_common/classes/Services.js";

(function () {
    "use strict";

    const CANCEL_MIN_HOURS = 2; // espelha CONF_APPT_CANCEL_MIN_HOURS da API (a API é quem decide de verdade)

    const storage = new SessionStorage("default");
    const appointmentsService = new Appointments();
    const servicesService = new Services();
    const serviceNames = new Map();
    const list = document.querySelector("#appt-list");
    const tabs = document.querySelectorAll(".filter-tab");
    const btnNovoAgendamento = document.querySelector("#new-appt-btn");
    const staticEmpty = document.querySelector("#empty-state");
    const pageSubtitle = document.querySelector(".page-subtitle");

    let currentFilter = "todos";
    let appointments = [];

    appointmentsService.setAuthToken(storage.getToken());
    servicesService.setAuthToken(storage.getToken());

    const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
    const STATUSES = {
        pending: { label: "Pendente", filter: "pendente", badge: "badge--yellow" },
        confirmed: { label: "Confirmado", filter: "confirmado", badge: "badge--green" },
        completed: { label: "Concluído", filter: "concluido", badge: "badge--blue" },
        cancelled: { label: "Cancelado", filter: "cancelado", badge: "badge--red" }
    };

    function formatDate(date) {
        const parts = String(date || "").split("-");
        if (parts.length !== 3) return { day: "--", month: "---", year: "" };
        return { day: parts[2], month: MONTHS[Number(parts[1]) - 1] || "---", year: parts[0] };
    }

    function escapeHTML(value) {
        const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
        return String(value ?? "").replace(/[&<>"']/g, (char) => entities[char]);
    }

    function messageOf(error) {
        return String(error?.message || error || "Erro desconhecido.").replace(/^Request failed:\s*/, "");
    }

    function showFeedback(text, type = "success") {
        let box = document.querySelector("#appt-feedback");
        if (!box) {
            box = document.createElement("p");
            box.id = "appt-feedback";
            box.setAttribute("role", "status");
            box.setAttribute("aria-live", "polite");
            list.parentElement.insertBefore(box, list);
        }
        box.textContent = text;
        box.style.cssText = `margin:0 0 .85rem;padding:.7rem 1rem;border-radius:10px;font-size:.9rem;font-weight:600;` +
            (type === "success" ? "background:#e8f7ee;color:#1d6b3a" : "background:#fdecec;color:#a12626");
        window.clearTimeout(showFeedback.timer);
        showFeedback.timer = window.setTimeout(() => box.remove(), 6000);
    }

    /** O cliente só vê "Cancelar" quando a regra (status + antecedência) permite. */
    function canCancel(appointment) {
        if (!["pending", "confirmed"].includes(appointment.status)) return false;
        const start = appointment.startsAt;
        return !!start && start.getTime() - Date.now() >= CANCEL_MIN_HOURS * 3600 * 1000;
    }

    function renderAppointment(appointment) {
        const date = formatDate(appointment.appointmentDate);
        const time = String(appointment.appointmentTime || "--:--").slice(0, 5);
        const serviceName = appointment.serviceName || serviceNames.get(Number(appointment.serviceId)) || `Serviço #${appointment.serviceId || "—"}`;
        const status = STATUSES[appointment.status] || STATUSES.pending;
        const cancelled = status.filter === "cancelado";

        const card = document.createElement("article");
        card.className = "appt-card";
        card.dataset.status = status.filter;
        card.dataset.id = appointment.id;

        const meta = [`<li><span aria-hidden="true">◷</span> ${escapeHTML(time)}</li>`];
        if (appointment.serviceDuration) meta.push(`<li><span aria-hidden="true">⏱</span> ${escapeHTML(appointment.serviceDuration)} min</li>`);
        meta.push(`<li><span aria-hidden="true">👤</span> ${escapeHTML(appointment.employeeName || "Profissional a definir")}</li>`);

        card.innerHTML = `
            <figure class="appt-card-date ${cancelled ? "appt-card-date--cancelled" : ""}" aria-hidden="true">
                <strong>${escapeHTML(date.day)}</strong>
                <span>${escapeHTML(date.month)}</span>
                <p>${escapeHTML(date.year)}</p>
            </figure>
            <section class="appt-card-body ${cancelled ? "appt-card-body--cancelled" : ""}">
                <header class="appt-card-header">
                    <h3 class="appt-card-title">${escapeHTML(serviceName)}</h3>
                    <span class="badge ${status.badge}">${status.label}</span>
                </header>
                <ul class="appt-card-meta" role="list">${meta.join("")}</ul>
            </section>
            <footer class="appt-card-actions"></footer>
        `;

        const actions = card.querySelector(".appt-card-actions");
        if (canCancel(appointment)) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "btn btn--outline";
            button.textContent = "Cancelar";
            button.setAttribute("aria-label", `Cancelar agendamento de ${serviceName} em ${date.day}/${date.month}`);
            button.addEventListener("click", () => cancelAppointment(appointment, serviceName, button));
            actions.appendChild(button);
        } else if (["pending", "confirmed"].includes(appointment.status)) {
            const hint = document.createElement("small");
            hint.textContent = `Cancelamento só até ${CANCEL_MIN_HOURS}h antes`;
            hint.style.color = "var(--color-text-muted)";
            actions.appendChild(hint);
        }
        if (!actions.children.length) actions.remove();

        list.appendChild(card);
    }

    async function cancelAppointment(appointment, serviceName, button) {
        if (!window.confirm(`Cancelar o agendamento de "${serviceName}"?`)) return;
        button.disabled = true;
        button.textContent = "Cancelando...";
        try {
            await appointmentsService.cancel(appointment.id);
            showFeedback("Agendamento cancelado com sucesso.");
        } catch (error) {
            showFeedback(messageOf(error), "error");
        }
        await loadAppointments();   // atualiza a lista sem recarregar a página
    }

    function renderEmpty(totalCards) {
        const message = document.createElement("section");
        message.className = "empty-state";
        message.innerHTML = `
            <h3 class="empty-title">${totalCards === 0 ? "Você ainda não possui agendamentos." : "Nenhum agendamento encontrado."}</h3>
            <p class="empty-desc">${totalCards === 0
                ? "Quando você realizar um agendamento, ele aparecerá aqui."
                : "Tente selecionar outro filtro para visualizar seus agendamentos."}</p>
            ${totalCards === 0 ? '<a class="btn btn--primary" href="novo-agendamento.html">Fazer primeiro agendamento</a>' : ""}
        `;
        list.appendChild(message);
    }

    function render() {
        list.innerHTML = "";
        // Mais recentes primeiro; o histórico (concluídos/cancelados) fica acessível nas abas.
        const sorted = [...appointments].sort((a, b) =>
            `${b.appointmentDate} ${b.appointmentTime}`.localeCompare(`${a.appointmentDate} ${a.appointmentTime}`));
        sorted.forEach(renderAppointment);

        const visible = sorted.filter((item) => currentFilter === "todos" || (STATUSES[item.status] || STATUSES.pending).filter === currentFilter);
        list.querySelectorAll(".appt-card").forEach((card) => {
            card.classList.toggle("hidden", !(currentFilter === "todos" || card.dataset.status === currentFilter));
        });
        if (visible.length === 0) renderEmpty(sorted.length);
        if (pageSubtitle) {
            const upcoming = appointments.filter((a) => ["pending", "confirmed"].includes(a.status) && a.startsAt && a.startsAt >= new Date()).length;
            pageSubtitle.textContent = upcoming
                ? `Você tem ${upcoming} agendamento${upcoming > 1 ? "s" : ""} por vir`
                : "Gerencie todos os seus horários em um só lugar";
        }
    }

    async function loadAppointments() {
        try {
            appointments = await appointmentsService.list();
            render();
        } catch (error) {
            console.error("Erro ao buscar agendamentos:", error);
            list.innerHTML = "";
            const message = document.createElement("p");
            message.className = "appt-empty-message";
            message.textContent = `Não foi possível carregar os agendamentos. ${messageOf(error)}`;
            list.appendChild(message);
        }
    }

    tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            tabs.forEach((item) => {
                item.classList.remove("filter-tab--active");
                item.setAttribute("aria-pressed", "false");
            });
            tab.classList.add("filter-tab--active");
            tab.setAttribute("aria-pressed", "true");
            currentFilter = tab.dataset.filter;
            render();
        });
    });

    if (btnNovoAgendamento) {
        btnNovoAgendamento.addEventListener("click", () => { window.location.href = "novo-agendamento.html"; });
    }

    list.innerHTML = '<p class="appt-empty-message">Carregando agendamentos...</p>';
    servicesService.listAll()
        .then((response) => (response?.data ?? []).forEach((service) => serviceNames.set(Number(service.id), service.name)))
        .catch((error) => console.warn("Não foi possível carregar os nomes dos serviços:", error))
        .finally(loadAppointments);
})();
