import SessionStorage from "../../_common/scripts/storage.js";
import Appointments from "../../_common/classes/Appointments.js";
import Services from "../../_common/classes/Services.js";
import Appointment from "../../_common/classes/Appointment.js";
import Users from "../../_common/classes/Users.js";

(function () {
    "use strict";

    const modal = document.querySelector("#modal-overlay");
    const openBtn = document.querySelector("#open-booking-btn");
    const closeBtn = document.querySelector("#modal-close");
    const cancelBtn = document.querySelector("#modal-cancel");
    const form = document.querySelector("#booking-form");
    const serviceSelect = document.querySelector("#appt-service");
    const employeeSelect = document.querySelector("#appt-employee");
    const dateInput = document.querySelector("#appt-date");
    const timeSelect = document.querySelector("#appt-time");
    const submitButton = document.querySelector("#appt-submit");
    const successMessage = document.querySelector("#appt-success");
    const globalError = document.querySelector("#appt-error-global");

    const storage = new SessionStorage("default");
    const appointments = new Appointments();
    const services = new Services();
    const users = new Users();
    const token = storage.getToken();

    appointments.setAuthToken(token);
    services.setAuthToken(token);
    users.setAuthToken(token);

    function showError(id, message) {
        const element = document.getElementById(id);
        if (!element) return;
        element.textContent = message;
        element.hidden = false;
    }

    function clearError(id) {
        const element = document.getElementById(id);
        if (!element) return;
        element.textContent = "";
        element.hidden = true;
    }

    function showGlobalError(message) {
        if (!globalError) return;
        globalError.textContent = message;
        globalError.hidden = false;
    }

    function openModal() {
        if (!modal) return;
        modal.hidden = false;
        modal.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
    }

    function closeModal() {
        if (!modal) return;
        modal.hidden = true;
        modal.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
        if (form) form.reset();
        clearAllMessages();
        if (typeof resetTimes === "function") resetTimes();
    }

    function clearAllMessages() {
        ["appt-service-error", "appt-date-error", "appt-time-error"].forEach(clearError);
        if (successMessage) successMessage.hidden = true;
        if (globalError) globalError.hidden = true;
    }

    async function loadServices() {
        serviceSelect.disabled = true;
        serviceSelect.innerHTML = '<option value="">Carregando serviços...</option>';

        try {
            const response = await services.listAll();
            if (response?.status !== "success" || !Array.isArray(response.data)) {
                throw new Error(response?.message || "A API não retornou uma lista válida de serviços.");
            }

            const available = response.data.filter((item) => Number(item.active ?? 1) === 1);
            serviceSelect.innerHTML = '<option value="">Selecione um serviço</option>';

            available.forEach((item) => {
                const option = document.createElement("option");
                option.value = item.id;
                const price = Number(item.price);
                const duration = item.duration ? ` · ${item.duration} min` : "";
                option.textContent = `${item.name}${Number.isFinite(price) ? ` — R$ ${price.toFixed(2).replace(".", ",")}` : ""}${duration}`;
                serviceSelect.appendChild(option);
            });

            if (available.length === 0) {
                serviceSelect.innerHTML = '<option value="">Nenhum serviço disponível</option>';
            }
        } catch (error) {
            console.error("Erro ao carregar serviços:", error);
            serviceSelect.innerHTML = '<option value="">Não foi possível carregar os serviços</option>';
            showGlobalError(error.message);
        } finally {
            serviceSelect.disabled = false;
        }
    }

    async function loadEmployees() {
        if (!employeeSelect) return;
        try {
            const result = await users.listEmployees();
            if (result.status !== "success" || !Array.isArray(result.data)) return;
            employeeSelect.replaceChildren();
            const anyOption = document.createElement("option");
            anyOption.value = "";
            anyOption.textContent = "Qualquer profissional disponível";
            employeeSelect.appendChild(anyOption);
            result.data.forEach(person => {
                const option = document.createElement("option");
                option.value = person.id;
                option.textContent = person.name;
                employeeSelect.appendChild(option);
            });
        } catch (error) {
            console.warn("Não foi possível carregar os profissionais:", error);
        }
    }

    // ---- Horários disponíveis (calculados pela API) -----------------------
    let slotsRequest = 0;

    function resetTimes(message = "Selecione serviço e data") {
        timeSelect.innerHTML = "";
        timeSelect.add(new Option(message, ""));
        timeSelect.disabled = true;
    }

    async function loadSlots() {
        clearError("appt-time-error");
        const serviceId = serviceSelect.value;
        const date = dateInput.value;
        if (!serviceId || !date) { resetTimes(); return; }

        const requestId = ++slotsRequest;           // ignora respostas antigas se o usuário mudar de ideia
        resetTimes("Carregando horários...");
        try {
            const result = await appointments.availability(serviceId, date, employeeSelect?.value || null);
            if (requestId !== slotsRequest) return;

            timeSelect.innerHTML = "";
            const free = result.slots.filter((slot) => slot.available);
            timeSelect.add(new Option(free.length ? "Selecione um horário" : "Nenhum horário livre neste dia", ""));
            result.slots.forEach((slot) => {
                const option = new Option(slot.available ? slot.time : `${slot.time} — indisponível`, slot.time);
                option.disabled = !slot.available;
                if (!slot.available && slot.reason) option.title = slot.reason;
                timeSelect.add(option);
            });
            timeSelect.disabled = free.length === 0;
        } catch (error) {
            if (requestId !== slotsRequest) return;
            console.error("Erro ao carregar horários:", error);
            resetTimes("Não foi possível carregar os horários");
            showError("appt-time-error", String(error.message || error).replace(/^Request failed:\s*/, ""));
        }
    }

    [serviceSelect, dateInput, employeeSelect].forEach((field) => field?.addEventListener("change", loadSlots));
    resetTimes();

    if (openBtn) openBtn.addEventListener("click", openModal);
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (cancelBtn) cancelBtn.addEventListener("click", closeModal);

    if (modal) {
        modal.addEventListener("click", (event) => {
            if (event.target === modal) closeModal();
        });
    }

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && modal && !modal.hidden) closeModal();
    });

    if (dateInput) {
        const now = new Date();
        const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
        dateInput.min = localToday;
    }

    if (form) {
        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            clearAllMessages();

            if (!token) {
                showGlobalError("Sua sessão expirou. Entre novamente para criar um agendamento.");
                return;
            }

            const serviceId = serviceSelect.value;
            const date = dateInput.value;
            const time = timeSelect.value;
            let valid = true;

            if (!serviceId) {
                showError("appt-service-error", "Selecione um serviço.");
                valid = false;
            }
            if (!date) {
                showError("appt-date-error", "Selecione uma data.");
                valid = false;
            }
            if (!time) {
                showError("appt-time-error", "Selecione um horário.");
                valid = false;
            }
            if (!valid) return;

            try {
                const appointment = new Appointment({
                    serviceId,
                    appointmentDate: date,
                    appointmentTime: time,
                    employeeId: employeeSelect?.value || null,
                    status: "pending"
                });

                submitButton.disabled = true;
                submitButton.textContent = "Salvando agendamento...";

                await appointments.create(appointment);

                if (successMessage) {
                    successMessage.textContent = "Agendamento cadastrado com sucesso!";
                    successMessage.hidden = false;
                }

                window.setTimeout(() => {
                    window.location.href = "agendamentos.html";   // a lista já carrega o novo agendamento
                }, 900);
            } catch (error) {
                console.error("Erro ao criar agendamento:", error);
                showGlobalError(String(error.message || "Não foi possível criar o agendamento. Tente novamente.").replace(/^Request failed:\s*/, ""));
                loadSlots();   // o horário pode ter sido ocupado por outra pessoa: atualiza a lista
                submitButton.disabled = false;
                submitButton.textContent = "Confirmar agendamento";
            }
        });
    }

    loadServices();
    loadEmployees();
})();
