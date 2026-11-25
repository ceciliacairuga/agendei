/** Entidade de agendamento (POO clássica). */
export default class Appointment {
    #id;
    #userId;
    #serviceId;
    #employeeId;
    #appointmentTime;
    #appointmentDate;
    #status;

    // Campos somente leitura vindos do JOIN da API (exibição). Não fazem parte do payload de gravação.
    serviceName = null;
    serviceDuration = null;
    servicePrice = null;
    clientName = null;
    clientEmail = null;
    employeeName = null;

    constructor({ id = null, userId = null, serviceId, employeeId = null, appointmentTime, appointmentDate, status = "pending" } = {}) {
        this.id = id;
        this.userId = userId;
        this.serviceId = serviceId;
        this.employeeId = employeeId;
        this.appointmentTime = appointmentTime;
        this.appointmentDate = appointmentDate;
        this.status = status;
    }

    get id() { return this.#id; }
    set id(value) {
        const id = value === null || value === undefined || value === "" ? null : Number(value);
        if (id !== null && (!Number.isInteger(id) || id <= 0)) throw new TypeError("ID do agendamento inválido.");
        this.#id = id;
    }

    get userId() { return this.#userId; }
    set userId(value) {
        const id = value === null || value === undefined || value === "" ? null : Number(value);
        if (id !== null && (!Number.isInteger(id) || id <= 0)) throw new TypeError("ID do usuário inválido.");
        this.#userId = id;
    }

    get serviceId() { return this.#serviceId; }
    set serviceId(value) {
        const id = Number(value);
        if (!Number.isInteger(id) || id <= 0) throw new TypeError("Selecione um serviço válido.");
        this.#serviceId = id;
    }

    get employeeId() { return this.#employeeId; }
    set employeeId(value) {
        const id = value === null || value === undefined || value === "" ? null : Number(value);
        if (id !== null && (!Number.isInteger(id) || id <= 0)) throw new TypeError("Funcionário inválido.");
        this.#employeeId = id;
    }

    get appointmentTime() { return this.#appointmentTime; }
    set appointmentTime(value) {
        if (typeof value !== "string" || !/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(value)) {
            throw new TypeError("Informe um horário válido.");
        }
        this.#appointmentTime = value.length === 5 ? `${value}:00` : value;
    }

    get appointmentDate() { return this.#appointmentDate; }
    set appointmentDate(value) {
        if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new TypeError("Informe uma data válida.");
        const [year, month, day] = value.split("-").map(Number);
        const parsed = new Date(year, month - 1, day);
        if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) {
            throw new TypeError("A data informada é inválida.");
        }
        this.#appointmentDate = value;
    }

    get status() { return this.#status; }
    set status(value) {
        const allowed = ["pending", "confirmed", "completed", "cancelled"];
        if (!allowed.includes(value)) throw new TypeError("Status de agendamento inválido.");
        this.#status = value;
    }

    toJSON() {
        return {
            id: this.id,
            userId: this.userId,
            serviceId: this.serviceId,
            employeeId: this.employeeId,
            appointmentTime: this.appointmentTime,
            appointmentDate: this.appointmentDate,
            status: this.status
        };
    }

    toPayload() {
        return {
            service_id: this.serviceId,
            employee_id: this.employeeId ?? "",
            appointment_time: this.appointmentTime,
            appointment_date: this.appointmentDate,
            status: this.status
        };
    }

    /** Converte sem lançar erro: devolve null se a linha da API estiver inválida (uma linha ruim não derruba a lista). */
    static tryFromJSON(data = {}) {
        try {
            return Appointment.fromJSON(data);
        } catch (error) {
            console.warn("Agendamento ignorado por dados inválidos:", data, error);
            return null;
        }
    }

    /** Data/hora como objeto Date local (ou null). */
    get startsAt() {
        const date = new Date(`${this.appointmentDate}T${this.appointmentTime}`);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    static fromJSON(data = {}) {
        const appointment = Appointment.#build(data);
        appointment.serviceName = data.service_name ?? data.serviceName ?? null;
        appointment.serviceDuration = data.service_duration ?? null;
        appointment.servicePrice = data.service_price ?? null;
        appointment.clientName = data.client_name ?? null;
        appointment.clientEmail = data.client_email ?? null;
        appointment.employeeName = data.employee_name ?? null;
        return appointment;
    }

    static #build(data = {}) {
        return new Appointment({
            id: data.id ?? null,
            userId: data.userId ?? data.user_id ?? null,
            serviceId: data.serviceId ?? data.service_id,
            employeeId: data.employeeId ?? data.employee_id ?? null,
            appointmentTime: data.appointmentTime ?? data.appointment_time,
            appointmentDate: data.appointmentDate ?? data.appointment_date,
            status: data.status ?? "pending"
        });
    }
}
