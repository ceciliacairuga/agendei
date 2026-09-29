import HttpClientBase from "./HttpClientBase.js";

export default class Appointments extends HttpClientBase {


    #id;
    #userId;
    #serviceId;
    #appointmentTime;
    #appointmentDate;
    #status;

    constructor({id = null, userId = null, serviceId = null, appointmentTime = "", appointmentDate = "", status = ""} = {}) {
        this.id = id;
        this.userId = userId;
        this.serviceId = serviceId;
        this.appointmentTime = appointmentTime;
        this.appointmentDate = appointmentDate;
        this.status = status;
  
    }

    get id(){
        return this.#id;
    }
    set id(value){
        this.#id = value === null ? null : Number(value);
    }


    get userId(){
        return this.#userId;
    }
    set userId(value){
        this.#userId = value === null ? null : Number(value);
    }

    get serviceId(){
        return this.#serviceId;
    }
    set serviceId(value){
        this.#serviceId = value === null ? null : Number(value);
    }

    get appointmentTime(){
        return this.#appointmentTime;
    }
    set appointmentTime(value){
        if(typeof value !== "string" || value.trim() === ""){
            throw new TypeError("appointmentTime eh obrigatorio.");
        }
        this.#appointmentTime = value.trim();
    }

    get appointmentDate(){
        return this.#appointmentDate;
    }
    set appointmentDate(value){
        if(typeof value !== "string" || value.trim() === ""){
            throw new TypeError("appointmentDate eh obrigatorio.");
        }
        this.#appointmentDate = value.trim();
    }

    get status(){
        return this.#status;
    }
    set status(value){
       if(typeof value !== "string" || value.trim() === ""){
            throw new TypeError("status eh obrigatorio.");
        }
        this.#status = value.trim();
    }

    toJSON(){
        return {
            id: this.id,
            userId: this.userId,
            serviceId: this.serviceId,
            appointmentTime: this.appointmentTime,
            appointmentDate: this.appointmentDate,
            status: this.status
        };
    }

    


    async listAll() {
        return this.get("/appointments");
    }

    async listById(id) {
        return this.get("/appointments/:id", { id });
    }

    async listPaginator(page = 1, perPage = 10) {
        return this.get("/appointments/list/paginator/:page/:per_page", {
            page,
            per_page: perPage
        });
    }

    async insert(data) {
        return this.postForm("/appointments", data);
    }

    async update(id, data) {
        return this.putForm("/appointments/:id", data, { id });
    }

    async delete(id) {
        return this.delete("/appointments/:id", { id });
    }
}