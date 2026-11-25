import HttpClientBase from "./HttpClientBase.js";
import Appointment from "./Appointment.js";

/** Serviço HTTP de agendamentos. Não manipula a interface. */
export default class Appointments extends HttpClientBase {
    async list() {
        const response = await this.get("/appointments/list");
        if (response?.status !== "success") throw new Error(response?.message || "Não foi possível carregar os agendamentos.");
        // Uma linha inválida é ignorada (não impede o restante da lista de aparecer).
        return (response.data ?? []).map((item) => Appointment.tryFromJSON(item)).filter(Boolean);
    }

    /** Lista com filtros (admin): { date, client, service_id, status, employee_id }. */
    async listFiltered(filters = {}) {
        const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== "" && v !== null && v !== undefined));
        const response = await this.get("/appointments/list", params);
        if (response?.status !== "success") throw new Error(response?.message || "Não foi possível carregar os agendamentos.");
        return (response.data ?? []).map((item) => Appointment.tryFromJSON(item)).filter(Boolean);
    }

    /** Horários do dia para um serviço: { date, duration, slots: [{ time, available, reason }] }. */
    async availability(serviceId, date, employeeId = null) {
        const params = { service_id: serviceId, date };
        if (employeeId) params.employee_id = employeeId;
        const response = await this.get("/appointments/availability", params);
        if (response?.status !== "success") throw new Error(response?.message || "Não foi possível consultar os horários.");
        return response.data;
    }

    /** O cliente cancela o próprio agendamento. */
    async cancel(id) {
        const response = await this.putForm("/appointments/cancel/:appointment_id", {}, { appointment_id: id });
        if (response?.status !== "success") throw new Error(response?.message || "Não foi possível cancelar o agendamento.");
        return response;
    }

    async find(id) {
        const response = await this.get("/appointments/list/:appointment_id", { appointment_id: id });
        if (response?.status !== "success" || !response.data) throw new Error(response?.message || "Agendamento não encontrado.");
        return Appointment.fromJSON(response.data);
    }

    async create(data) {
        const appointment = data instanceof Appointment ? data : new Appointment(data);
        const response = await this.postForm("/appointments/insert", appointment.toPayload());
        if (response?.status !== "created" && response?.status !== "success") throw new Error(response?.message || "Não foi possível criar o agendamento.");
        return response;
    }

    async update(id, data) {
        const payload = data instanceof Appointment ? data.toPayload() : data;
        const response = await this.putForm("/appointments/:appointment_id", payload, { appointment_id: id });
        if (response?.status !== "success") throw new Error(response?.message || "Não foi possível atualizar o agendamento.");
        return response;
    }

    async remove(id) {
        const response = await this.delete("/appointments/:appointment_id", { appointment_id: id });
        if (response?.status !== "success") throw new Error(response?.message || "Não foi possível remover o agendamento.");
        return response;
    }

    /** Admin: altera status e/ou data, hora, serviço, profissional. */
    async update(id, data) {
        const response = await this.putForm("/appointments/:appointment_id", data, { appointment_id: id });
        if (response?.status !== "success") throw new Error(response?.message || "Não foi possível atualizar o agendamento.");
        return response;
    }

    /** Admin: exclui definitivamente o agendamento. */
    async remove(id) {
        const response = await this.delete("/appointments/:appointment_id", { appointment_id: id });
        if (response?.status !== "success") throw new Error(response?.message || "Não foi possível excluir o agendamento.");
        return response;
    }

    // Nomes antigos mantidos para compatibilidade com telas existentes.
    async listAll() { return this.getListResponse(); }
    async getListResponse() { return this.get("/appointments/list"); }
    async listById(id) { return this.get("/appointments/list/:appointment_id", { appointment_id: id }); }
    async insert(data) { return this.postForm("/appointments/insert", data instanceof Appointment ? data.toPayload() : data); }
    async listPaginator(page = 1, perPage = 10) {
        return this.get("/appointments/list/paginator/:page/:per_page", { page, per_page: perPage });
    }
}
